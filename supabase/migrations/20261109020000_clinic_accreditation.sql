begin;

-- 1. Storage bucket for private clinic accreditation documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-accreditation',
  'clinic-accreditation',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];

-- 2. Storage RLS policies for clinic-accreditation
create policy "Superadmin can read accreditation documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'clinic-accreditation'
    and exists (select 1 from private.platform_admins pa where pa.user_id = auth.uid())
  );

create policy "Applicant can read own accreditation documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'clinic-accreditation'
    and exists (
      select 1 from public.clinic_applications a
      where a.applicant_user_id = auth.uid()
        and (storage.objects.name like (a.id::text || '/%'))
    )
  );

create policy "Applicant can upload accreditation documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'clinic-accreditation'
    and exists (
      select 1 from public.clinic_applications a
      where a.applicant_user_id = auth.uid()
        and (storage.objects.name like (a.id::text || '/%'))
        and a.submission_status in ('submitted', 'needs_information')
    )
  );

-- 3. Document catalog table in private schema
create table if not exists private.clinic_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.clinic_applications(id) on delete restrict,
  document_type text not null check (document_type in ('rep_identity', 'sunarp_power', 'sunat_ruc', 'cmvp_license', 'other')),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  storage_path text not null unique check (char_length(btrim(storage_path)) between 5 and 500),
  file_size integer not null check (file_size > 0 and file_size <= 10485760),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp()
);

alter table private.clinic_application_documents enable row level security;
revoke all on private.clinic_application_documents from public, anon, authenticated, service_role;

-- 4. Accreditations review table in private schema
create table if not exists private.clinic_application_accreditations (
  application_id uuid primary key references public.clinic_applications(id) on delete restrict,
  sunat_verified boolean not null default false,
  sunat_status text check (sunat_status is null or sunat_status in ('activo_habido', 'activo_no_habido', 'no_hallado', 'baja', 'invalido')),
  sunat_notes text,
  sunat_verified_at timestamptz,

  sunarp_required boolean not null default true,
  sunarp_verified boolean not null default false,
  sunarp_entry text,
  sunarp_notes text,
  sunarp_verified_at timestamptz,

  cmvp_verified boolean not null default false,
  cmvp_license_status text check (cmvp_license_status is null or cmvp_license_status in ('habilitado', 'no_habilitado', 'no_encontrado')),
  cmvp_notes text,
  cmvp_verified_at timestamptz,

  status text not null default 'pending_review' check (status in ('pending_review', 'corrections_requested', 'verified', 'rejected')),
  correction_notes text,

  verified_by uuid references auth.users(id) on delete restrict,
  verified_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

alter table private.clinic_application_accreditations enable row level security;
revoke all on private.clinic_application_accreditations from public, anon, authenticated, service_role;

-- 5. RPCs for Document Management
create or replace function public.vetia_get_application_documents(p_application_id uuid)
returns table (
  id uuid,
  document_type text,
  file_name text,
  storage_path text,
  file_size integer,
  mime_type text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if not exists (select 1 from private.platform_admins pa where pa.user_id = v_user_id)
     and not exists (select 1 from public.clinic_applications a where a.id = p_application_id and a.applicant_user_id = v_user_id)
  then
    raise exception using errcode = '42501', message = 'Permission denied';
  end if;

  return query
  select d.id, d.document_type, d.file_name, d.storage_path, d.file_size, d.mime_type, d.created_at
  from private.clinic_application_documents d
  where d.application_id = p_application_id
  order by d.created_at desc;
end;
$$;

create or replace function public.vetia_record_application_document(
  p_application_id uuid,
  p_document_type text,
  p_file_name text,
  p_storage_path text,
  p_file_size integer,
  p_mime_type text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_doc_id uuid;
  v_app_status public.application_status;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select a.submission_status into v_app_status
  from public.clinic_applications a
  where a.id = p_application_id and a.applicant_user_id = v_user_id;

  if v_app_status is null then
    raise exception using errcode = '42501', message = 'Application not found or unauthorized';
  end if;

  if v_app_status not in ('submitted', 'needs_information') then
    raise exception using errcode = '22023', message = 'Application is not editable in current status';
  end if;

  if p_storage_path not like (p_application_id::text || '/%') then
    raise exception using errcode = '22023', message = 'Invalid storage path';
  end if;

  insert into private.clinic_application_documents (
    application_id, document_type, file_name, storage_path, file_size, mime_type, uploaded_by
  ) values (
    p_application_id, p_document_type, btrim(p_file_name), btrim(p_storage_path), p_file_size, p_mime_type, v_user_id
  ) returning id into v_doc_id;

  return v_doc_id;
end;
$$;

-- 6. RPCs for Accreditation Review
create or replace function public.vetia_get_clinic_accreditation(p_application_id uuid)
returns table (
  application_id uuid,
  sunat_verified boolean,
  sunat_status text,
  sunat_notes text,
  sunat_verified_at timestamptz,
  sunarp_required boolean,
  sunarp_verified boolean,
  sunarp_entry text,
  sunarp_notes text,
  sunarp_verified_at timestamptz,
  cmvp_verified boolean,
  cmvp_license_status text,
  cmvp_notes text,
  cmvp_verified_at timestamptz,
  status text,
  correction_notes text,
  verified_by uuid,
  verified_at timestamptz,
  is_representation_active boolean
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform private.require_active_review_admin();

  return query
  select
    a.id as application_id,
    coalesce(acc.sunat_verified, false) as sunat_verified,
    acc.sunat_status,
    acc.sunat_notes,
    acc.sunat_verified_at,
    coalesce(acc.sunarp_required, true) as sunarp_required,
    coalesce(acc.sunarp_verified, false) as sunarp_verified,
    acc.sunarp_entry,
    acc.sunarp_notes,
    acc.sunarp_verified_at,
    coalesce(acc.cmvp_verified, false) as cmvp_verified,
    acc.cmvp_license_status,
    acc.cmvp_notes,
    acc.cmvp_verified_at,
    coalesce(acc.status, 'pending_review') as status,
    acc.correction_notes,
    acc.verified_by,
    acc.verified_at,
    exists(
      select 1 from private.clinic_application_representations rep
      where rep.application_id = p_application_id
        and rep.revoked_at is null
        and rep.verified_at <= clock_timestamp()
    ) as is_representation_active
  from public.clinic_applications a
  left join private.clinic_application_accreditations acc on acc.application_id = a.id
  where a.id = p_application_id;
end;
$$;

create or replace function public.vetia_save_accreditation_checks(
  p_application_id uuid,
  p_sunat_verified boolean,
  p_sunat_status text,
  p_sunat_notes text,
  p_sunarp_required boolean,
  p_sunarp_verified boolean,
  p_sunarp_entry text,
  p_sunarp_notes text,
  p_cmvp_verified boolean,
  p_cmvp_license_status text,
  p_cmvp_notes text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform private.require_active_review_admin();

  insert into private.clinic_application_accreditations (
    application_id,
    sunat_verified, sunat_status, sunat_notes, sunat_verified_at,
    sunarp_required, sunarp_verified, sunarp_entry, sunarp_notes, sunarp_verified_at,
    cmvp_verified, cmvp_license_status, cmvp_notes, cmvp_verified_at,
    status, updated_at
  ) values (
    p_application_id,
    p_sunat_verified, p_sunat_status, p_sunat_notes, case when p_sunat_verified then clock_timestamp() else null end,
    p_sunarp_required, p_sunarp_verified, p_sunarp_entry, p_sunarp_notes, case when p_sunarp_verified then clock_timestamp() else null end,
    p_cmvp_verified, p_cmvp_license_status, p_cmvp_notes, case when p_cmvp_verified then clock_timestamp() else null end,
    'pending_review', clock_timestamp()
  )
  on conflict (application_id) do update set
    sunat_verified = excluded.sunat_verified,
    sunat_status = excluded.sunat_status,
    sunat_notes = excluded.sunat_notes,
    sunat_verified_at = case when excluded.sunat_verified and not clinic_application_accreditations.sunat_verified then clock_timestamp() else clinic_application_accreditations.sunat_verified_at end,
    sunarp_required = excluded.sunarp_required,
    sunarp_verified = excluded.sunarp_verified,
    sunarp_entry = excluded.sunarp_entry,
    sunarp_notes = excluded.sunarp_notes,
    sunarp_verified_at = case when excluded.sunarp_verified and not clinic_application_accreditations.sunarp_verified then clock_timestamp() else clinic_application_accreditations.sunarp_verified_at end,
    cmvp_verified = excluded.cmvp_verified,
    cmvp_license_status = excluded.cmvp_license_status,
    cmvp_notes = excluded.cmvp_notes,
    cmvp_verified_at = case when excluded.cmvp_verified and not clinic_application_accreditations.cmvp_verified then clock_timestamp() else clinic_application_accreditations.cmvp_verified_at end,
    updated_at = clock_timestamp();
end;
$$;

create or replace function public.vetia_request_accreditation_corrections(
  p_application_id uuid,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_admin uuid := auth.uid();
  v_notes text := nullif(btrim(p_notes), '');
begin
  perform private.require_active_review_admin();

  if v_notes is null or char_length(v_notes) < 5 then
    raise exception using errcode = '22023', message = 'Ingresa el detalle de las correcciones solicitadas.';
  end if;

  update private.clinic_application_accreditations set
    status = 'corrections_requested',
    correction_notes = v_notes,
    updated_at = clock_timestamp()
  where application_id = p_application_id;

  if not found then
    insert into private.clinic_application_accreditations (
      application_id, status, correction_notes, updated_at
    ) values (
      p_application_id, 'corrections_requested', v_notes, clock_timestamp()
    );
  end if;

  update private.clinic_application_representations set
    revoked_at = clock_timestamp()
  where application_id = p_application_id and revoked_at is null;

  update public.clinic_applications set
    submission_status = 'needs_information',
    decision_message = v_notes
  where id = p_application_id;

  insert into private.audit_events (actor_user_id, actor_type, action, entity_type, entity_id, reason, metadata)
  values (
    v_admin, 'admin', 'accreditation_corrections_requested', 'clinic_application', p_application_id, v_notes,
    jsonb_build_object('application_id', p_application_id, 'reason', v_notes)
  );
end;
$$;

create or replace function public.vetia_verify_clinic_accreditation(
  p_application_id uuid,
  p_evidence_reference text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_admin uuid := auth.uid();
  v_app public.clinic_applications%rowtype;
  v_acc private.clinic_application_accreditations%rowtype;
  v_ref text := nullif(btrim(p_evidence_reference), '');
  v_doc_count integer;
begin
  perform private.require_active_review_admin();

  select * into v_app from public.clinic_applications where id = p_application_id;
  if v_app.id is null then
    raise exception using errcode = 'P0002', message = 'Application not found';
  end if;

  if v_app.applicant_user_id = v_admin then
    raise exception using errcode = '42501', message = 'Self-accreditation is not allowed';
  end if;

  if v_app.submission_status not in ('submitted', 'needs_information') then
    raise exception using errcode = '22023', message = 'Application status does not allow accreditation';
  end if;

  select * into v_acc from private.clinic_application_accreditations where application_id = p_application_id;
  if v_acc.application_id is null then
    raise exception using errcode = '22023', message = 'Debes registrar primero las comprobaciones de SUNAT, SUNARP y CMVP';
  end if;

  if not v_acc.sunat_verified or coalesce(v_acc.sunat_status, '') <> 'activo_habido' then
    raise exception using errcode = '22023', message = 'Se requiere comprobar estado ACTIVO Y HABIDO en SUNAT';
  end if;

  if not v_acc.cmvp_verified or coalesce(v_acc.cmvp_license_status, '') <> 'habilitado' then
    raise exception using errcode = '22023', message = 'Se requiere comprobar condición HABILITADO en CMVP';
  end if;

  if v_acc.sunarp_required and not v_acc.sunarp_verified then
    raise exception using errcode = '22023', message = 'Se requiere comprobar vigencia de poder en SUNARP';
  end if;

  select count(*) into v_doc_count from private.clinic_application_documents where application_id = p_application_id;
  if v_doc_count = 0 then
    raise exception using errcode = '22023', message = 'El solicitante debe haber adjuntado al menos un documento de sustento';
  end if;

  v_ref := coalesce(v_ref, 'ACRED-' || upper(substring(replace(p_application_id::text, '-', '') from 1 for 8)));

  insert into private.clinic_application_representations (
    application_id, applicant_user_id, verified_by, evidence_reference, verified_at, revoked_at
  ) values (
    p_application_id, v_app.applicant_user_id, v_admin, v_ref, clock_timestamp(), null
  )
  on conflict (application_id) do update set
    applicant_user_id = excluded.applicant_user_id,
    verified_by = excluded.verified_by,
    evidence_reference = excluded.evidence_reference,
    verified_at = excluded.verified_at,
    revoked_at = null;

  update private.clinic_application_accreditations set
    status = 'verified',
    verified_by = v_admin,
    verified_at = clock_timestamp(),
    updated_at = clock_timestamp()
  where application_id = p_application_id;

  insert into private.audit_events (actor_user_id, actor_type, action, entity_type, entity_id, reason, metadata)
  values (
    v_admin, 'admin', 'clinic_representation_accredited', 'clinic_application', p_application_id, 'Comprobaciones oficiales verificadas',
    jsonb_build_object(
      'application_id', p_application_id,
      'evidence_reference', v_ref,
      'sunat_status', v_acc.sunat_status,
      'cmvp_license_status', v_acc.cmvp_license_status,
      'sunarp_verified', v_acc.sunarp_verified
    )
  );
end;
$$;

revoke all on function public.vetia_get_application_documents(uuid) from public, anon, authenticated, service_role;
revoke all on function public.vetia_record_application_document(uuid,text,text,text,integer,text) from public, anon, authenticated, service_role;
revoke all on function public.vetia_get_clinic_accreditation(uuid) from public, anon, authenticated, service_role;
revoke all on function public.vetia_save_accreditation_checks(uuid,boolean,text,text,boolean,boolean,text,text,boolean,text,text) from public, anon, authenticated, service_role;
revoke all on function public.vetia_request_accreditation_corrections(uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.vetia_verify_clinic_accreditation(uuid,text) from public, anon, authenticated, service_role;

grant execute on function public.vetia_get_application_documents(uuid) to authenticated;
grant execute on function public.vetia_record_application_document(uuid,text,text,text,integer,text) to authenticated;
grant execute on function public.vetia_get_clinic_accreditation(uuid) to authenticated;
grant execute on function public.vetia_save_accreditation_checks(uuid,boolean,text,text,boolean,boolean,text,text,boolean,text,text) to authenticated;
grant execute on function public.vetia_request_accreditation_corrections(uuid,text) to authenticated;
grant execute on function public.vetia_verify_clinic_accreditation(uuid,text) to authenticated;

commit;
