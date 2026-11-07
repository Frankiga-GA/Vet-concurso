begin;

-- This projection is shared by listing, detail and intake eligibility.
create view private.public_clinic_directory as
select c.id, c.slug, c.name, c.city, c.address, c.phone, c.description
from public.clinics c join public.clinic_applications a on a.id = c.application_id
where a.submission_status = 'approved' and c.approved_at is not null
  and c.lifecycle_status = 'active' and c.profile_status = 'complete'
  and c.publication_status = 'published'
  and nullif(btrim(c.address), '') is not null
  and nullif(btrim(c.phone), '') is not null;
revoke all on private.public_clinic_directory from public, anon, authenticated, service_role;

create function public.vetia_public_clinics(p_city text default null, p_slug text default null)
returns table(id uuid, slug text, name text, city text, address text, phone text, description text)
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select d.id, d.slug, d.name, d.city, d.address, d.phone, d.description
  from private.public_clinic_directory d
  where (p_city is null or d.city = p_city) and (p_slug is null or d.slug = p_slug)
  order by d.city, d.name, d.id limit 100
$$;
revoke all on function public.vetia_public_clinics(text,text) from public, anon, authenticated, service_role;
grant execute on function public.vetia_public_clinics(text,text) to anon, authenticated;

-- Provision a SHA-256 digest of a randomly generated intake-only key per environment.
-- The actual key is available only to the Next.js action after anti-abuse verification.
create table private.appointment_intake_key (
  singleton boolean primary key default true check (singleton),
  key_digest bytea not null check (octet_length(key_digest) = 32)
);
alter table private.appointment_intake_key enable row level security;
revoke all on private.appointment_intake_key from public, anon, authenticated, service_role;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  reference uuid not null unique default gen_random_uuid(),
  request_key uuid not null unique,
  contact_name text not null check (char_length(btrim(contact_name)) between 2 and 120),
  contact_phone text not null check (contact_phone ~ '^\+?[0-9]{6,15}$'),
  reason text not null check (char_length(btrim(reason)) between 5 and 500),
  preferred_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  agreed_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  check ((status = 'pending' and agreed_at is null and confirmed_at is null and confirmed_by is null)
    or (status = 'confirmed' and agreed_at is not null and confirmed_at is not null
      and confirmed_by is not null and agreed_at > confirmed_at and confirmed_at >= created_at))
);
create index appointments_clinic_queue_idx on public.appointments (clinic_id, status, created_at desc, id);
create index appointments_intake_recent_idx on public.appointments (created_at desc);
alter table public.appointments enable row level security;
revoke all on public.appointments from public, anon, authenticated, service_role;
grant select (id, clinic_id, reference, contact_name, contact_phone, reason, preferred_at,
  status, agreed_at, confirmed_at, created_at) on public.appointments to authenticated;
create function private.has_appointment_session()
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select exists (
    select 1 from auth.users u join auth.sessions s on s.user_id = u.id
    where u.id = auth.uid() and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= statement_timestamp())
      and s.id = case when auth.jwt() ->> 'session_id' ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
        then (auth.jwt() ->> 'session_id')::uuid else null end
      and (s.not_after is null or s.not_after > statement_timestamp())
  )
$$;
revoke all on function private.has_appointment_session() from public, anon, authenticated, service_role;
grant execute on function private.has_appointment_session() to authenticated;
create policy appointments_read_clinic on public.appointments for select to authenticated
  using ((select private.has_appointment_session())
    and private.is_clinic_member(clinic_id, array['clinic_admin','clinic_staff']::text[]));

create function public.vetia_request_appointment(
  p_intake_key text, p_request_key uuid, p_clinic_id uuid, p_contact_name text,
  p_contact_phone text, p_reason text, p_preferred_at timestamptz
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_existing public.appointments%rowtype;
  v_reference uuid;
  v_now timestamptz;
begin
  if p_intake_key is null or p_intake_key !~ '^[0-9a-f]{64}$' or not exists (
    select 1 from private.appointment_intake_key k
      where k.key_digest = sha256(convert_to(p_intake_key, 'UTF8'))
  ) then
    raise exception using errcode = '42501', message = 'Appointment intake unavailable';
  end if;
  if p_request_key is null or p_clinic_id is null or p_contact_name is null or p_contact_phone is null
    or p_reason is null or p_preferred_at is null
    or char_length(btrim(p_contact_name)) not between 2 and 120
    or p_contact_phone !~ '^\+?[0-9]{6,15}$'
    or char_length(btrim(p_reason)) not between 5 and 500
  then
    raise exception using errcode = '22023', message = 'Invalid appointment request';
  end if;

  -- Serialize the pilot quota and request-key check. There is no external I/O under this lock.
  perform pg_advisory_xact_lock(hashtextextended('vetia:appointment-intake', 0));
  select a.* into v_existing from public.appointments a where a.request_key = p_request_key;
  if found then
    if row(v_existing.clinic_id, v_existing.contact_name, v_existing.contact_phone, v_existing.reason, v_existing.preferred_at)
      is distinct from row(p_clinic_id, btrim(p_contact_name), p_contact_phone, btrim(p_reason), p_preferred_at)
    then
      raise exception using errcode = 'PT409', message = 'Request key already used';
    end if;
    return v_existing.reference;
  end if;

  perform 1 from public.clinics c where c.id = p_clinic_id for share;
  if not exists (select 1 from private.public_clinic_directory d where d.id = p_clinic_id) then
    raise exception using errcode = 'PT409', message = 'Clinic is not accepting public requests';
  end if;
  v_now := clock_timestamp();
  if p_preferred_at <= v_now or p_preferred_at > v_now + interval '90 days' then
    raise exception using errcode = '22023', message = 'Invalid appointment preference';
  end if;
  if (select count(*) from public.appointments a where a.created_at >= v_now - interval '1 hour') >= 300
    or (select count(*) from public.appointments a where a.created_at >= v_now - interval '1 hour'
      and a.clinic_id = p_clinic_id) >= 40
    or (select count(*) from public.appointments a where a.created_at >= v_now - interval '1 hour'
      and a.contact_phone = p_contact_phone) >= 4
  then
    raise exception using errcode = 'PT429', message = 'Appointment intake rate limit reached';
  end if;

  insert into public.appointments (clinic_id, request_key, contact_name, contact_phone, reason, preferred_at)
  values (p_clinic_id, p_request_key, btrim(p_contact_name), p_contact_phone, btrim(p_reason), p_preferred_at)
  returning reference into v_reference;
  return v_reference;
end;
$$;
revoke all on function public.vetia_request_appointment(text,uuid,uuid,text,text,text,timestamptz)
  from public, anon, authenticated, service_role;
grant execute on function public.vetia_request_appointment(text,uuid,uuid,text,text,text,timestamptz)
  to anon, authenticated;

create function public.vetia_confirm_appointment(p_clinic_id uuid, p_appointment_id uuid, p_agreed_at timestamptz)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_appointment public.appointments%rowtype;
  v_now timestamptz;
begin
  if v_actor is null or not private.is_clinic_member(p_clinic_id, array['clinic_admin','clinic_staff']::text[])
    or not private.has_appointment_session()
  then
    raise exception using errcode = '42501', message = 'Clinic membership required';
  end if;

  perform 1 from public.clinics c where c.id = p_clinic_id and c.lifecycle_status = 'active' for share;
  if not found then
    raise exception using errcode = '42501', message = 'Clinic membership required';
  end if;
  perform 1 from public.clinic_memberships m where m.clinic_id = p_clinic_id and m.user_id = v_actor
    and m.status = 'active' and m.role in ('clinic_admin','clinic_staff') for share;
  if not found then
    raise exception using errcode = '42501', message = 'Clinic membership required';
  end if;

  select a.* into v_appointment from public.appointments a
    where a.id = p_appointment_id and a.clinic_id = p_clinic_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Appointment not found';
  end if;
  if not private.has_appointment_session() then
    raise exception using errcode = '42501', message = 'Clinic membership required';
  end if;
  if v_appointment.status = 'confirmed' then
    if v_appointment.agreed_at is not distinct from p_agreed_at then return v_appointment.reference; end if;
    raise exception using errcode = 'PT409', message = 'Appointment already confirmed';
  end if;
  v_now := clock_timestamp();
  if p_agreed_at is null or p_agreed_at <= v_now or p_agreed_at > v_now + interval '90 days' then
    raise exception using errcode = '22023', message = 'Invalid agreed time';
  end if;
  update public.appointments set status = 'confirmed', agreed_at = p_agreed_at, confirmed_at = v_now, confirmed_by = v_actor
    where id = v_appointment.id;
  insert into private.audit_events (actor_user_id, actor_type, clinic_id, action, entity_type, entity_id)
  values (v_actor, 'user', p_clinic_id, 'appointment.confirm', 'appointment', v_appointment.id);
  return v_appointment.reference;
end;
$$;
revoke all on function public.vetia_confirm_appointment(uuid,uuid,timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.vetia_confirm_appointment(uuid,uuid,timestamptz) to authenticated;

commit;
