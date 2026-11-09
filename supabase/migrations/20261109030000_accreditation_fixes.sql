begin;

-- 1. Fix vetia_request_accreditation_corrections to set reviewed_at and reviewed_by
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
  v_now timestamptz := clock_timestamp();
begin
  perform private.require_active_review_admin();

  if v_notes is null or char_length(v_notes) < 5 then
    raise exception using errcode = '22023', message = 'Ingresa el detalle de las correcciones solicitadas (mínimo 5 caracteres).';
  end if;

  update private.clinic_application_accreditations set
    status = 'corrections_requested',
    correction_notes = v_notes,
    updated_at = v_now
  where application_id = p_application_id;

  if not found then
    insert into private.clinic_application_accreditations (
      application_id, status, correction_notes, updated_at
    ) values (
      p_application_id, 'corrections_requested', v_notes, v_now
    );
  end if;

  update private.clinic_application_representations set
    revoked_at = v_now
  where application_id = p_application_id and revoked_at is null;

  -- Crucial: update reviewed_by and reviewed_at to strictly satisfy clinic_applications_decision_consistency
  update public.clinic_applications set
    submission_status = 'needs_information',
    decision_message = v_notes,
    reviewed_by = v_admin,
    reviewed_at = v_now
  where id = p_application_id;

  insert into private.audit_events (actor_user_id, actor_type, action, entity_type, entity_id, reason, metadata, created_at)
  values (
    v_admin, 'admin', 'accreditation_corrections_requested', 'clinic_application', p_application_id, v_notes,
    jsonb_build_object('application_id', p_application_id, 'reason', v_notes), v_now
  );
end;
$$;

-- 2. Secure RPC for applicants to complete missing fields on submitted or needs_information applications
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

  if coalesce(char_length(btrim(p_legal_name)), 0) not between 2 and 180
    or coalesce(btrim(p_ruc), '') !~ '^[0-9]{11}$'
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
    ruc = btrim(p_ruc),
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

-- 3. Stricter validation in save checks and verification
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
declare
  v_app public.clinic_applications%rowtype;
  v_has_sunat_doc boolean;
  v_has_sunarp_doc boolean;
  v_has_cmvp_doc boolean;
begin
  perform private.require_active_review_admin();

  select * into v_app from public.clinic_applications where id = p_application_id;
  if v_app.id is null then
    raise exception using errcode = 'P0002', message = 'Solicitud no encontrada';
  end if;

  -- Verify prerequisite data & documents if verification checkbox is asserted
  if p_sunat_verified then
    if v_app.ruc is null or v_app.ruc !~ '^[0-9]{11}$' then
      raise exception using errcode = '22023', message = 'No puedes verificar SUNAT sin un RUC válido de 11 dígitos.';
    end if;
    select exists (
      select 1 from private.clinic_application_documents
      where application_id = p_application_id and document_type in ('sunat_ruc', 'other')
    ) into v_has_sunat_doc;
    if not v_has_sunat_doc then
      raise exception using errcode = '22023', message = 'No puedes verificar SUNAT sin la Ficha RUC adjunta.';
    end if;
  end if;

  if p_cmvp_verified then
    if v_app.veterinarian_name is null or v_app.veterinarian_license is null then
      raise exception using errcode = '22023', message = 'No puedes verificar CMVP sin nombre de veterinario y colegiatura.';
    end if;
    select exists (
      select 1 from private.clinic_application_documents
      where application_id = p_application_id and document_type in ('cmvp_license', 'other')
    ) into v_has_cmvp_doc;
    if not v_has_cmvp_doc then
      raise exception using errcode = '22023', message = 'No puedes verificar CMVP sin la constancia de colegiatura adjunta.';
    end if;
  end if;

  if p_sunarp_verified and p_sunarp_required then
    if v_app.legal_representative_name is null or coalesce(btrim(p_sunarp_entry), '') = '' then
      raise exception using errcode = '22023', message = 'No puedes verificar SUNARP sin representante legal y partida/asiento.';
    end if;
    select exists (
      select 1 from private.clinic_application_documents
      where application_id = p_application_id and document_type in ('sunarp_power', 'rep_identity', 'other')
    ) into v_has_sunarp_doc;
    if not v_has_sunarp_doc then
      raise exception using errcode = '22023', message = 'No puedes verificar SUNARP sin documento de poder o DNI adjunto.';
    end if;
  end if;

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

-- 4. Secure RPC for applicant to read their own application details
create or replace function public.vetia_get_my_clinic_application_details(p_application_id uuid)
returns table (
  legal_name text,
  ruc text,
  address text,
  legal_representative_name text,
  representative_document text,
  veterinarian_name text,
  veterinarian_license text
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

  return query
  select
    a.legal_name,
    a.ruc,
    a.address,
    a.legal_representative_name,
    d.representative_document,
    a.veterinarian_name,
    a.veterinarian_license
  from public.clinic_applications a
  left join private.clinic_application_private_details d on d.application_id = a.id
  where a.id = p_application_id and a.applicant_user_id = v_user_id;
end;
$$;

revoke all on function public.vetia_get_my_clinic_application_details(uuid) from public, anon, authenticated, service_role;
grant execute on function public.vetia_get_my_clinic_application_details(uuid) to authenticated;

revoke all on function public.vetia_complete_clinic_application(uuid,text,text,text,text,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.vetia_complete_clinic_application(uuid,text,text,text,text,text,text,text) to authenticated;

commit;
