begin;

-- Personal profile fields are private to the signed-in account. Existing rows
-- stay valid: only new registrations require names through the application.
alter table public.profiles
  add column first_name text,
  add column last_name text,
  add column city text,
  add constraint profiles_first_name_length check (first_name is null or char_length(btrim(first_name)) between 2 and 80),
  add constraint profiles_last_name_length check (last_name is null or char_length(btrim(last_name)) between 2 and 120),
  add constraint profiles_city_allowed check (city is null or city in ('Chincha', 'Pisco', 'Ica'));

-- The public application row retains the small, non-sensitive workflow fields.
-- Detailed legal/operational fields have no direct Data API column grants.
alter table public.clinic_applications
  add column legal_name text,
  add column ruc text,
  add column address text,
  add column legal_representative_name text,
  add column veterinarian_name text,
  add column veterinarian_license text,
  add column services text[],
  add column opening_hours jsonb;

alter table public.clinic_applications
  add constraint clinic_applications_legal_name_length check (legal_name is null or char_length(btrim(legal_name)) between 2 and 180),
  add constraint clinic_applications_ruc_format check (ruc is null or ruc ~ '^[0-9]{11}$'),
  add constraint clinic_applications_address_length check (address is null or char_length(btrim(address)) between 5 and 200),
  add constraint clinic_applications_legal_representative_length check (legal_representative_name is null or char_length(btrim(legal_representative_name)) between 2 and 120),
  add constraint clinic_applications_veterinarian_length check (veterinarian_name is null or char_length(btrim(veterinarian_name)) between 2 and 120),
  add constraint clinic_applications_veterinarian_license_length check (veterinarian_license is null or char_length(btrim(veterinarian_license)) between 3 and 40),
  add constraint clinic_applications_services_shape check (services is null or cardinality(services) between 1 and 20),
  add constraint clinic_applications_hours_shape check (opening_hours is null or jsonb_typeof(opening_hours) = 'array');

-- DNI/CE and any future identity material never live in an API-readable table.
create table private.clinic_application_private_details (
  application_id uuid primary key references public.clinic_applications(id) on delete restrict,
  representative_document text not null check (representative_document ~ '^[A-Za-z0-9-]{8,20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table private.clinic_application_private_details enable row level security;
revoke all on private.clinic_application_private_details from public, anon, authenticated, service_role;
create trigger clinic_application_private_details_touch_updated_at before update on private.clinic_application_private_details
  for each row execute function private.touch_updated_at();

-- Registration metadata is only used for non-authorizing profile data.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_first_name text := nullif(btrim(new.raw_user_meta_data ->> 'first_name'), '');
  v_last_name text := nullif(btrim(new.raw_user_meta_data ->> 'last_name'), '');
begin
  insert into public.profiles (user_id, display_name, first_name, last_name)
  values (new.id, nullif(concat_ws(' ', v_first_name, v_last_name), ''), v_first_name, v_last_name)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated, service_role;

create function public.vetia_my_profile()
returns table (first_name text, last_name text, phone text, city text)
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null
  ) then
    raise exception using errcode = '28000', message = 'Confirmed email required';
  end if;
  return query select p.first_name, p.last_name, p.phone, p.city
    from public.profiles p where p.user_id = auth.uid();
end;
$$;

create function public.vetia_update_my_profile(
  p_first_name text, p_last_name text, p_phone text, p_city text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_first_name text := nullif(btrim(p_first_name), '');
  v_last_name text := nullif(btrim(p_last_name), '');
  v_phone text := nullif(regexp_replace(btrim(p_phone), '[ ()-]', '', 'g'), '');
  v_city text := nullif(btrim(p_city), '');
begin
  if auth.uid() is null or not exists (
    select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null
  ) then
    raise exception using errcode = '28000', message = 'Confirmed email required';
  end if;
  if coalesce(char_length(v_first_name), 0) not between 2 and 80
    or coalesce(char_length(v_last_name), 0) not between 2 and 120
    or v_city not in ('Chincha', 'Pisco', 'Ica')
    or (v_phone is not null and v_phone !~ '^\+?[0-9]{6,15}$')
  then raise exception using errcode = '22023', message = 'Invalid profile details'; end if;

  insert into public.profiles (user_id, first_name, last_name, display_name, phone, city)
    values (auth.uid(), v_first_name, v_last_name, v_first_name || ' ' || v_last_name, v_phone, v_city)
  on conflict (user_id) do update set first_name = excluded.first_name, last_name = excluded.last_name,
    display_name = excluded.display_name, phone = excluded.phone, city = excluded.city;
end;
$$;

revoke all on function public.vetia_my_profile() from public, anon, authenticated, service_role;
revoke all on function public.vetia_update_my_profile(text,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.vetia_my_profile() to authenticated;
grant execute on function public.vetia_update_my_profile(text,text,text,text) to authenticated;

-- New applications use a separate function so older clients and existing
-- records remain valid. A submitted key remains the persistent retry key.
create function public.vetia_submit_clinic_application_v2(
  p_submission_key uuid, p_business_name text, p_legal_name text, p_ruc text,
  p_city text, p_address text, p_contact_name text, p_contact_email text, p_contact_phone text,
  p_legal_representative_name text, p_legal_representative_document text,
  p_veterinarian_name text, p_veterinarian_license text, p_services text[], p_opening_hours jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_application_id uuid;
  v_services text[];
  v_hours jsonb := p_opening_hours;
begin
  if v_user_id is null or not exists (select 1 from auth.users u where u.id = v_user_id and u.email_confirmed_at is not null) then
    raise exception using errcode = '28000', message = 'Confirmed email required';
  end if;
  if p_submission_key is null then raise exception using errcode = '22023', message = 'Submission key required'; end if;

  select a.id into v_application_id from public.clinic_applications a
    where a.submission_key = p_submission_key and a.applicant_user_id = v_user_id;
  if found then return v_application_id; end if;

  select array_agg(btrim(s) order by btrim(s)) into v_services
    from (select distinct s from unnest(coalesce(p_services, '{}'::text[])) as s where char_length(btrim(s)) between 2 and 80) clean;
  if coalesce(char_length(btrim(p_business_name)), 0) not between 2 and 180
    or coalesce(char_length(btrim(p_legal_name)), 0) not between 2 and 180
    or coalesce(btrim(p_ruc), '') !~ '^[0-9]{11}$'
    or coalesce(btrim(p_city), '') not in ('Chincha', 'Pisco', 'Ica')
    or coalesce(char_length(btrim(p_address)), 0) not between 5 and 200
    or coalesce(char_length(btrim(p_contact_name)), 0) not between 2 and 120
    or coalesce(lower(btrim(p_contact_email)), '') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or coalesce(btrim(p_contact_phone), '') !~ '^\+?[0-9 ()-]{6,32}$'
    or coalesce(char_length(btrim(p_legal_representative_name)), 0) not between 2 and 120
    or coalesce(btrim(p_legal_representative_document), '') !~ '^[A-Za-z0-9-]{8,20}$'
    or coalesce(char_length(btrim(p_veterinarian_name)), 0) not between 2 and 120
    or coalesce(btrim(p_veterinarian_license), '') !~ '^[A-Za-z0-9-]{3,40}$'
    or coalesce(cardinality(v_services), 0) <> coalesce(cardinality(p_services), 0)
    or coalesce(cardinality(v_services), 0) not between 1 and 20
  then raise exception using errcode = '22023', message = 'Invalid clinic application details'; end if;
  if coalesce(jsonb_typeof(v_hours), '') <> 'array' or jsonb_array_length(v_hours) < 1
    or exists (select 1 from jsonb_array_elements(v_hours) h
      where jsonb_typeof(h) <> 'object' or coalesce(h ->> 'day', '') !~ '^[0-6]$'
        or coalesce(h ->> 'start', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        or coalesce(h ->> 'end', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        or (h ->> 'start') >= (h ->> 'end'))
  then raise exception using errcode = '22023', message = 'Invalid clinic opening hours'; end if;

  insert into public.clinic_applications (
    submission_key, applicant_user_id, business_name, legal_name, ruc, city, address,
    contact_name, contact_email, contact_phone, legal_representative_name,
    veterinarian_name, veterinarian_license, services, opening_hours
  ) values (
    p_submission_key, v_user_id, btrim(p_business_name), btrim(p_legal_name), btrim(p_ruc), btrim(p_city), btrim(p_address),
    btrim(p_contact_name), lower(btrim(p_contact_email)), btrim(p_contact_phone), btrim(p_legal_representative_name),
    btrim(p_veterinarian_name), btrim(p_veterinarian_license), v_services, v_hours
  ) returning id into v_application_id;
  insert into private.clinic_application_private_details (application_id, representative_document)
    values (v_application_id, btrim(p_legal_representative_document));
  return v_application_id;
exception when unique_violation then
  select a.id into v_application_id from public.clinic_applications a
    where a.submission_key = p_submission_key and a.applicant_user_id = v_user_id;
  if found then return v_application_id; end if;
  raise;
end;
$$;

create function public.vetia_get_admin_clinic_application_details(p_application_id uuid)
returns table (
  legal_name text, ruc text, address text, legal_representative_name text,
  representative_document text, veterinarian_name text, veterinarian_license text,
  services text[], opening_hours jsonb
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform private.require_active_review_admin();
  return query select a.legal_name, a.ruc, a.address, a.legal_representative_name,
    d.representative_document, a.veterinarian_name, a.veterinarian_license, a.services, a.opening_hours
  from public.clinic_applications a
  left join private.clinic_application_private_details d on d.application_id = a.id
  where a.id = p_application_id;
end;
$$;

revoke all on function public.vetia_submit_clinic_application_v2(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text[],jsonb) from public, anon, authenticated, service_role;
revoke all on function public.vetia_get_admin_clinic_application_details(uuid) from public, anon, authenticated, service_role;
grant execute on function public.vetia_submit_clinic_application_v2(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text[],jsonb) to authenticated;
grant execute on function public.vetia_get_admin_clinic_application_details(uuid) to authenticated;

commit;
