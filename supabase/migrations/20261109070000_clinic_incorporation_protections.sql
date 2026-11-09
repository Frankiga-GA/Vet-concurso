-- Migration: 20261109070000_clinic_incorporation_protections.sql
-- Enforce non-duplication of clinic applications by RUC and protect incorporation workflow.

-- 1. Unique index on RUC for active/approved applications
create unique index if not exists clinic_applications_unique_active_ruc_idx
  on public.clinic_applications (ruc)
  where submission_status in ('submitted', 'needs_information', 'approved') and ruc is not null;

-- 2. Update vetia_submit_clinic_application_v2 to check for existing active/approved RUC
create or replace function public.vetia_submit_clinic_application_v2(
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
  v_clean_ruc text := btrim(coalesce(p_ruc, ''));
begin
  if v_user_id is null or not exists (select 1 from auth.users u where u.id = v_user_id and u.email_confirmed_at is not null) then
    raise exception using errcode = '28000', message = 'Confirmed email required';
  end if;
  if p_submission_key is null then raise exception using errcode = '22023', message = 'Submission key required'; end if;

  select a.id into v_application_id from public.clinic_applications a
    where a.submission_key = p_submission_key and a.applicant_user_id = v_user_id;
  if found then return v_application_id; end if;

  if exists (
    select 1 from public.clinic_applications a
    where a.ruc = v_clean_ruc
      and a.submission_status in ('submitted', 'needs_information', 'approved')
      and (a.submission_key <> p_submission_key or a.applicant_user_id <> v_user_id)
  ) then
    raise exception using errcode = '23505', message = 'Ya existe una solicitud activa o aprobada con este RUC.';
  end if;

  select array_agg(btrim(s) order by btrim(s)) into v_services
    from (select distinct s from unnest(coalesce(p_services, '{}'::text[])) as s where char_length(btrim(s)) between 2 and 80) clean;
  if coalesce(char_length(btrim(p_business_name)), 0) not between 2 and 180
    or coalesce(char_length(btrim(p_legal_name)), 0) not between 2 and 180
    or v_clean_ruc !~ '^[0-9]{11}$'
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
    p_submission_key, v_user_id, btrim(p_business_name), btrim(p_legal_name), v_clean_ruc, btrim(p_city), btrim(p_address),
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
  raise exception using errcode = '23505', message = 'Ya existe una solicitud activa o aprobada con este RUC.';
end;
$$;

-- 3. Update vetia_complete_clinic_application to prevent switching to an existing active RUC
create or replace function public.vetia_complete_clinic_application(
  p_application_id uuid,
  p_legal_name text,
  p_ruc text,
  p_address text,
  p_legal_representative_name text,
  p_legal_representative_document text,
  p_veterinarian_name text,
  p_veterinarian_license text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_app public.clinic_applications%rowtype;
  v_clean_ruc text := btrim(coalesce(p_ruc, ''));
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select * into v_app from public.clinic_applications
    where id = p_application_id and applicant_user_id = v_user_id;

  if v_app.id is null then
    raise exception using errcode = '42501', message = 'Application not found or unauthorized';
  end if;

  if v_app.submission_status not in ('submitted', 'needs_information') then
    raise exception using errcode = '22023', message = 'Application is not editable in current status';
  end if;

  if exists (
    select 1 from public.clinic_applications a
    where a.ruc = v_clean_ruc
      and a.submission_status in ('submitted', 'needs_information', 'approved')
      and a.id <> p_application_id
  ) then
    raise exception using errcode = '23505', message = 'Ya existe una solicitud activa o aprobada con este RUC.';
  end if;

  if coalesce(char_length(btrim(p_legal_name)), 0) not between 2 and 180
    or v_clean_ruc !~ '^[0-9]{11}$'
    or coalesce(char_length(btrim(p_address)), 0) not between 5 and 200
    or coalesce(char_length(btrim(p_legal_representative_name)), 0) not between 2 and 120
    or coalesce(btrim(p_legal_representative_document), '') !~ '^[A-Za-z0-9-]{8,20}$'
    or coalesce(char_length(btrim(p_veterinarian_name)), 0) not between 2 and 120
    or coalesce(btrim(p_veterinarian_license), '') !~ '^[A-Za-z0-9-]{3,40}$'
  then
    raise exception using errcode = '22023', message = 'Datos incompletos o inválidos. Revisa RUC (11 dígitos), colegiatura y nombres.';
  end if;

  update public.clinic_applications set
    legal_name = btrim(p_legal_name),
    ruc = v_clean_ruc,
    address = btrim(p_address),
    legal_representative_name = btrim(p_legal_representative_name),
    veterinarian_name = btrim(p_veterinarian_name),
    veterinarian_license = btrim(p_veterinarian_license)
  where id = p_application_id;

  insert into private.clinic_application_private_details (application_id, representative_document)
    values (p_application_id, btrim(p_legal_representative_document))
    on conflict (application_id) do update set
      representative_document = excluded.representative_document;
end;
$$;
