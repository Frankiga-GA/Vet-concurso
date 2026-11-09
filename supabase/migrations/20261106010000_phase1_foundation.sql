-- VetIA Phase 1 foundation. Private schema remains excluded from PostgREST.
begin;

-- Fail on a collision rather than altering a preexisting schema.
create schema private;
revoke all on schema private from public, anon, authenticated, service_role;

create type public.application_status as enum (
  'submitted', 'needs_information', 'approved', 'rejected'
);
create type public.clinic_lifecycle_status as enum (
  'pending_activation', 'active', 'suspended', 'inactive'
);
create type public.clinic_profile_status as enum ('incomplete', 'complete');
create type public.clinic_publication_status as enum ('unpublished', 'published', 'withdrawn');
create type public.membership_role as enum ('clinic_admin', 'clinic_staff');
create type public.membership_status as enum ('pending', 'active', 'suspended', 'revoked');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired', 'failed');
create type public.outbox_status as enum ('pending', 'processing', 'processed', 'failed', 'dead');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 120),
  constraint profiles_phone_length check (phone is null or char_length(phone) <= 32)
);

create table private.platform_admins (
  user_id uuid primary key references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint platform_admin_not_self_created check (created_by is null or created_by <> user_id)
);

create table public.clinic_applications (
  id uuid primary key default gen_random_uuid(),
  submission_key uuid not null unique default gen_random_uuid(),
  applicant_user_id uuid not null references auth.users(id) on delete restrict,
  business_name text not null,
  city text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  submission_status public.application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  decision_message text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_applications_business_name_length check (char_length(business_name) between 2 and 180),
  constraint clinic_applications_city_allowed check (city in ('Chincha', 'Pisco', 'Ica')),
  constraint clinic_applications_contact_name_length check (char_length(contact_name) between 2 and 120),
  constraint clinic_applications_email_length check (char_length(contact_email) between 3 and 254),
  constraint clinic_applications_phone_length check (char_length(contact_phone) between 6 and 32),
  constraint clinic_applications_decision_consistency check (
    (submission_status in ('approved', 'rejected', 'needs_information') and reviewed_at is not null)
    or (submission_status = 'submitted' and reviewed_at is null
      and reviewed_by is null and decision_message is null)
  )
);
create index clinic_applications_applicant_created_idx
  on public.clinic_applications (applicant_user_id, created_at desc);
create index clinic_applications_status_created_idx
  on public.clinic_applications (submission_status, created_at);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.clinic_applications(id) on delete restrict,
  slug text not null unique,
  name text not null,
  city text not null,
  address text,
  phone text,
  email text,
  description text,
  lifecycle_status public.clinic_lifecycle_status not null default 'pending_activation',
  profile_status public.clinic_profile_status not null default 'incomplete',
  publication_status public.clinic_publication_status not null default 'unpublished',
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinics_city_allowed check (city in ('Chincha', 'Pisco', 'Ica')),
  constraint clinics_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint clinics_operational_requires_approval check (
    lifecycle_status not in ('active', 'suspended') or approved_at is not null
  ),
  constraint clinics_publication_requires_eligibility check (
    publication_status <> 'published'
    or (lifecycle_status = 'active' and profile_status = 'complete' and approved_at is not null)
  )
);
create index clinics_city_publication_idx
  on public.clinics (city, publication_status, lifecycle_status, profile_status);

create table public.clinic_memberships (
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role public.membership_role not null,
  status public.membership_status not null default 'pending',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, user_id),
  constraint clinic_membership_inviter_not_target check (invited_by is null or invited_by <> user_id)
);
create index clinic_memberships_user_status_idx
  on public.clinic_memberships (user_id, status, clinic_id);

create table private.clinic_invitations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  email_normalized text not null,
  role public.membership_role not null,
  token_hash text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_user_id uuid references auth.users(id) on delete set null,
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint clinic_invitation_email_normalized check (email_normalized = lower(btrim(email_normalized))),
  constraint clinic_invitation_expiry_order check (expires_at > created_at),
  -- ON DELETE SET NULL may remove the accepting user but preserves the timestamp.
  constraint clinic_invitation_acceptance_consistency check (
    (status = 'accepted' and accepted_at is not null
      and accepted_at >= created_at and accepted_at < expires_at)
    or (status <> 'accepted' and accepted_at is null and accepted_user_id is null)
  ),
  constraint clinic_invitation_token_hash_length check (char_length(token_hash) >= 32)
);
create unique index clinic_invitations_one_pending_per_email
  on private.clinic_invitations (clinic_id, email_normalized)
  where status = 'pending';
create index clinic_invitations_expiry_idx
  on private.clinic_invitations (status, expires_at);

-- Global owner identity. Not exposed through PostgREST or direct client grants.
create table private.owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owners_full_name_length check (char_length(full_name) between 2 and 180),
  constraint owners_phone_length check (phone is null or char_length(phone) <= 32),
  constraint owners_email_length check (email is null or char_length(email) <= 254)
);
create index owners_user_id_idx on private.owners (user_id) where user_id is not null;

-- Global, private pet identity. Clinical history is intentionally not part of this table.
create table private.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references private.owners(id) on delete restrict,
  name text not null,
  species text not null,
  breed text,
  sex text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pets_name_length check (char_length(name) between 1 and 120),
  constraint pets_species_length check (char_length(species) between 2 and 60),
  constraint pets_birth_date_not_future check (birth_date is null or birth_date <= current_date)
);
create index pets_owner_created_idx on private.pets (owner_id, created_at desc);

-- Tenant-local contact/patient records; global identifiers never appear in this schema.
create table public.clinic_clients (
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  id uuid not null default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, id),
  constraint clinic_clients_name_length check (char_length(full_name) between 2 and 180),
  constraint clinic_clients_phone_length check (char_length(phone) between 6 and 32),
  constraint clinic_clients_email_length check (email is null or char_length(email) <= 254)
);
create index clinic_clients_tenant_name_idx
  on public.clinic_clients (clinic_id, lower(full_name));
create index clinic_clients_tenant_phone_idx
  on public.clinic_clients (clinic_id, phone);

create table public.clinic_patients (
  clinic_id uuid not null,
  id uuid not null default gen_random_uuid(),
  clinic_client_id uuid not null,
  name text not null,
  species text not null,
  breed text,
  sex text,
  birth_date date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, id),
  unique (clinic_id, clinic_client_id, id),
  constraint clinic_patients_client_fk foreign key (clinic_id, clinic_client_id)
    references public.clinic_clients (clinic_id, id) on delete restrict,
  constraint clinic_patients_name_length check (char_length(name) between 1 and 120),
  constraint clinic_patients_species_length check (char_length(species) between 2 and 60),
  constraint clinic_patients_birth_date_not_future check (birth_date is null or birth_date <= current_date)
);
create index clinic_patients_client_idx
  on public.clinic_patients (clinic_id, clinic_client_id);
create index clinic_patients_name_idx
  on public.clinic_patients (clinic_id, lower(name));

-- Private cross-reference tables. They convey no read permission to global rows.
create table private.owner_client_links (
  clinic_id uuid not null,
  clinic_client_id uuid not null,
  owner_id uuid not null references private.owners(id) on delete restrict,
  linked_by uuid not null references auth.users(id) on delete restrict,
  consent_basis text not null check (consent_basis in ('owner_action', 'verified_claim', 'authorized_transfer')),
  linked_at timestamptz not null default now(),
  primary key (clinic_id, clinic_client_id),
  unique (clinic_id, owner_id),
  foreign key (clinic_id, clinic_client_id)
    references public.clinic_clients (clinic_id, id) on delete restrict
);
create index owner_client_links_owner_idx on private.owner_client_links (owner_id, clinic_id);

create table private.clinic_pet_links (
  clinic_id uuid not null,
  clinic_patient_id uuid not null,
  clinic_client_id uuid not null,
  pet_id uuid not null references private.pets(id) on delete restrict,
  linked_by uuid not null references auth.users(id) on delete restrict,
  consent_basis text not null check (consent_basis in ('owner_action', 'verified_claim', 'authorized_transfer')),
  linked_at timestamptz not null default now(),
  primary key (clinic_id, clinic_patient_id),
  unique (clinic_id, pet_id),
  foreign key (clinic_id, clinic_client_id, clinic_patient_id)
    references public.clinic_patients (clinic_id, clinic_client_id, id) on delete restrict
);
create index clinic_pet_links_pet_idx on private.clinic_pet_links (pet_id, clinic_id);

create table private.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'system', 'bootstrap')),
  clinic_id uuid references public.clinics(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_action_length check (char_length(action) between 2 and 120),
  constraint audit_entity_length check (char_length(entity_type) between 2 and 100)
);
create index audit_events_created_idx on private.audit_events (created_at desc);
create index audit_events_clinic_created_idx on private.audit_events (clinic_id, created_at desc);
create index audit_events_entity_idx on private.audit_events (entity_type, entity_id, created_at desc);

create table private.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  status public.outbox_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  constraint outbox_event_type_length check (char_length(event_type) between 2 and 160),
  constraint outbox_aggregate_type_length check (char_length(aggregate_type) between 2 and 100),
  constraint outbox_last_error_length check (last_error is null or char_length(last_error) <= 2000),
  constraint outbox_processed_consistency check ((status = 'processed') = (processed_at is not null)),
  constraint outbox_lease_consistency check (
    (status = 'processing' and lease_token is not null and lease_expires_at is not null)
    or (status <> 'processing' and lease_token is null and lease_expires_at is null)
  )
);
create index outbox_events_ready_idx on private.outbox_events (available_at, created_at)
  where status in ('pending', 'failed');
create index outbox_events_expired_lease_idx on private.outbox_events (lease_expires_at, created_at)
  where status = 'processing';
create index outbox_events_aggregate_idx
  on private.outbox_events (aggregate_type, aggregate_id, created_at);

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger applications_touch_updated_at before update on public.clinic_applications
  for each row execute function private.touch_updated_at();
create trigger clinics_touch_updated_at before update on public.clinics
  for each row execute function private.touch_updated_at();
create trigger memberships_touch_updated_at before update on public.clinic_memberships
  for each row execute function private.touch_updated_at();
create trigger clients_touch_updated_at before update on public.clinic_clients
  for each row execute function private.touch_updated_at();
create trigger patients_touch_updated_at before update on public.clinic_patients
  for each row execute function private.touch_updated_at();
create trigger owners_touch_updated_at before update on private.owners
  for each row execute function private.touch_updated_at();
create trigger pets_touch_updated_at before update on private.pets
  for each row execute function private.touch_updated_at();

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.platform_admins pa
    where pa.user_id = (select auth.uid())
      and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  );
$$;

create function private.is_clinic_member(p_clinic_id uuid, p_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.clinic_memberships cm
    join public.clinics c on c.id = cm.clinic_id and c.lifecycle_status = 'active'
    where cm.clinic_id = p_clinic_id
      and cm.user_id = (select auth.uid())
      and cm.status = 'active'
      and (p_roles is null or cm.role::text = any(p_roles))
  );
$$;

revoke all on function private.is_platform_admin() from public, anon;
revoke all on function private.is_clinic_member(uuid, text[]) from public, anon;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.is_clinic_member(uuid, text[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.clinic_applications enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.clinic_clients enable row level security;
alter table public.clinic_patients enable row level security;
alter table private.platform_admins enable row level security;
alter table private.clinic_invitations enable row level security;
alter table private.owners enable row level security;
alter table private.pets enable row level security;
alter table private.owner_client_links enable row level security;
alter table private.clinic_pet_links enable row level security;
alter table private.audit_events enable row level security;
alter table private.outbox_events enable row level security;

-- No implicit default grants: establish the least-privilege API surface explicitly.
revoke all on public.profiles, public.clinic_applications, public.clinics,
  public.clinic_memberships, public.clinic_clients, public.clinic_patients
  from public, anon, authenticated, service_role;
revoke all on private.platform_admins, private.clinic_invitations, private.owners,
  private.pets, private.owner_client_links, private.clinic_pet_links, private.audit_events,
  private.outbox_events from public, anon, authenticated, service_role;

-- Owner can read own safe profile and update only profile fields.
grant select (user_id, display_name, phone, created_at, updated_at) on public.profiles to authenticated;
grant update (display_name, phone) on public.profiles to authenticated;
create policy profiles_select_self on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy profiles_update_self on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Applicants can create and inspect only their own application. Review internals are private.
grant select (id, applicant_user_id, business_name, city, contact_name, contact_email,
  contact_phone, submission_status, submitted_at, decision_message, reviewed_at, created_at)
  on public.clinic_applications to authenticated;
create policy applications_select_applicant on public.clinic_applications for select to authenticated
  using ((select auth.uid()) = applicant_user_id);
create policy applications_select_superadmin on public.clinic_applications for select to authenticated
  using (private.is_platform_admin());

-- Membership reads expose only a user's own memberships and clinic admin's own roster.
grant select (clinic_id, user_id, role, status, invited_by, created_at, updated_at)
  on public.clinic_memberships to authenticated;
create policy memberships_select_self_or_clinic_admin on public.clinic_memberships
  for select to authenticated using (
    user_id = (select auth.uid())
    or private.is_clinic_member(clinic_id, array['clinic_admin']::text[])
    or private.is_platform_admin()
  );

-- Clinic data is isolated by an active membership. Local records never include global IDs.
grant select (clinic_id, id, full_name, phone, email, created_at, updated_at),
  insert (clinic_id, id, full_name, phone, email),
  update (full_name, phone, email)
  on public.clinic_clients to authenticated;
grant select (clinic_id, id, clinic_client_id, name, species, breed, sex, birth_date,
  status, created_at, updated_at) on public.clinic_patients to authenticated;
grant insert (clinic_id, id, clinic_client_id, name, species, breed, sex, birth_date, status)
  on public.clinic_patients to authenticated;
grant update (name, species, breed, sex, birth_date, status)
  on public.clinic_patients to authenticated;
create policy clinic_clients_select_tenant on public.clinic_clients for select to authenticated
  using (private.is_clinic_member(clinic_id, array['clinic_admin','clinic_staff']::text[])
    or private.is_platform_admin());
create policy clinic_clients_insert_tenant on public.clinic_clients for insert to authenticated
  with check (private.is_clinic_member(clinic_id, array['clinic_admin','clinic_staff']::text[]));
create policy clinic_clients_update_tenant on public.clinic_clients for update to authenticated
  using (private.is_clinic_member(clinic_id, array['clinic_admin','clinic_staff']::text[]))
  with check (private.is_clinic_member(clinic_id, array['clinic_admin','clinic_staff']::text[]));
create policy clinic_patients_select_tenant on public.clinic_patients for select to authenticated
  using (private.is_clinic_member(clinic_id, array['clinic_admin','clinic_staff']::text[])
    or private.is_platform_admin());
create policy clinic_patients_insert_tenant on public.clinic_patients for insert to authenticated
  with check (private.is_clinic_member(clinic_id, array['clinic_admin','clinic_staff']::text[])
    and exists (select 1 from public.clinic_clients c
      where c.clinic_id = clinic_patients.clinic_id and c.id = clinic_patients.clinic_client_id));
create policy clinic_patients_update_tenant on public.clinic_patients for update to authenticated
  using (private.is_clinic_member(clinic_id, array['clinic_admin','clinic_staff']::text[]))
  with check (private.is_clinic_member(clinic_id, array['clinic_admin','clinic_staff']::text[]));

-- Clinics are not directly selectable from the public Data API in Phase 1.
-- Future public directory uses an explicit safe view/RPC; clinic profile editing is added with Phase 2.

-- Role discovery for MFA enrollment/routing only, including at AAL1.
-- Privileged policies must use private.is_platform_admin(), which requires AAL2.
create function public.vetia_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.platform_admins pa where pa.user_id = (select auth.uid())
  );
$$;
revoke all on function public.vetia_is_platform_admin() from public, anon;
grant execute on function public.vetia_is_platform_admin() to authenticated;

-- Auth signup creates only a minimal profile; no role or authorization metadata is trusted.
create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created_vetia
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- Internal review material remains separate from applicant-visible application fields.
create table private.application_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.clinic_applications(id) on delete restrict,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('request_information', 'approve', 'reject')),
  internal_notes text,
  created_at timestamptz not null default now()
);
create index application_reviews_application_created_idx
  on private.application_reviews (application_id, created_at desc);
alter table private.application_reviews enable row level security;
revoke all on private.application_reviews from public, anon, authenticated, service_role;

-- The application records a stable submission key; retries can safely return the existing row.
create function public.vetia_submit_clinic_application(
  p_submission_key uuid,
  p_business_name text,
  p_city text,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_application_id uuid;
begin
  if v_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  if not exists (select 1 from auth.users u where u.id = v_user_id and u.email_confirmed_at is not null) then
    raise exception using errcode = '28000', message = 'Confirmed email required';
  end if;
  if p_submission_key is null then raise exception using errcode = '22023', message = 'Submission key required'; end if;

  select id into v_application_id from public.clinic_applications
    where submission_key = p_submission_key and applicant_user_id = v_user_id;
  if v_application_id is not null then return v_application_id; end if;

  insert into public.clinic_applications (
    submission_key, applicant_user_id, business_name, city, contact_name,
    contact_email, contact_phone
  ) values (
    p_submission_key, v_user_id, btrim(p_business_name), btrim(p_city), btrim(p_contact_name),
    lower(btrim(p_contact_email)), btrim(p_contact_phone)
  ) returning id into v_application_id;
  return v_application_id;
exception when unique_violation then
  select id into v_application_id from public.clinic_applications
    where submission_key = p_submission_key and applicant_user_id = auth.uid();
  if v_application_id is not null then return v_application_id; end if;
  raise;
end;
$$;
revoke all on function public.vetia_submit_clinic_application(uuid,text,text,text,text,text) from public, anon;
grant execute on function public.vetia_submit_clinic_application(uuid,text,text,text,text,text) to authenticated;

-- Global owner profile is accessed only through self-scoped RPCs, never direct table grants.
create function public.vetia_upsert_my_owner(p_full_name text, p_phone text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
begin
  if v_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  select u.email into v_email from auth.users u where u.id = v_user_id and u.email_confirmed_at is not null;
  if v_email is null then raise exception using errcode = '28000', message = 'Confirmed email required'; end if;
  if char_length(btrim(p_full_name)) not between 2 and 180 then
    raise exception using errcode = '22023', message = 'Invalid owner name';
  end if;
  insert into private.owners (user_id, full_name, phone, email)
    values (v_user_id, btrim(p_full_name), nullif(btrim(p_phone), ''), lower(v_email))
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    email = excluded.email,
    updated_at = now();
end;
$$;
revoke all on function public.vetia_upsert_my_owner(text,text) from public, anon;
grant execute on function public.vetia_upsert_my_owner(text,text) to authenticated;

create function public.vetia_list_my_pets()
returns table (id uuid, name text, species text, breed text, sex text, birth_date date, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.species, p.breed, p.sex, p.birth_date, p.created_at
  from private.pets p
  join private.owners o on o.id = p.owner_id
  where o.user_id = (select auth.uid())
    and exists (select 1 from auth.users u where u.id = o.user_id and u.email_confirmed_at is not null)
  order by p.created_at desc;
$$;
revoke all on function public.vetia_list_my_pets() from public, anon;
grant execute on function public.vetia_list_my_pets() to authenticated;

create function public.vetia_create_my_pet(
  p_name text, p_species text, p_breed text default null,
  p_sex text default null, p_birth_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_pet_id uuid;
begin
  if v_user_id is null or not exists (
    select 1 from auth.users u where u.id = v_user_id and u.email_confirmed_at is not null
  ) then raise exception using errcode = '28000', message = 'Confirmed account required'; end if;
  select o.id into v_owner_id from private.owners o where o.user_id = v_user_id;
  if v_owner_id is null then raise exception using errcode = '23503', message = 'Owner profile required'; end if;
  insert into private.pets (owner_id, name, species, breed, sex, birth_date)
    values (v_owner_id, btrim(p_name), btrim(p_species), nullif(btrim(p_breed), ''),
      nullif(btrim(p_sex), ''), p_birth_date)
    returning id into v_pet_id;
  return v_pet_id;
end;
$$;
revoke all on function public.vetia_create_my_pet(text,text,text,text,date) from public, anon;
grant execute on function public.vetia_create_my_pet(text,text,text,text,date) to authenticated;

-- Function owner is trusted migration role; callers are limited to self-scoped operations above.
commit;
