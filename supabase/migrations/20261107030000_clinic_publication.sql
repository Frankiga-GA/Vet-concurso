begin;

alter table public.clinics add column publication_revision integer not null default 0
  check (publication_revision >= 0);

create table private.clinic_publication_receipts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  operation_id uuid not null,
  profile_revision integer not null check (profile_revision >= 0),
  publication_revision integer not null check (publication_revision > 0),
  previous_status public.clinic_publication_status not null,
  resulting_status public.clinic_publication_status not null,
  reason text not null check (char_length(reason) between 5 and 500),
  created_at timestamptz not null default clock_timestamp(),
  unique (actor_user_id, operation_id),
  unique (clinic_id, publication_revision),
  check ((previous_status in ('unpublished','withdrawn') and resulting_status = 'published')
    or (previous_status = 'published' and resulting_status = 'withdrawn'))
);
alter table private.clinic_publication_receipts enable row level security;
revoke all on private.clinic_publication_receipts from public, anon, authenticated, service_role;

-- Completeness is evaluated against stored fields, not only the legacy state flag.
create function private.clinic_public_profile_complete(p_clinic public.clinics)
returns boolean language sql stable security invoker
set search_path = pg_catalog, pg_temp
as $$
  select p_clinic.profile_status = 'complete'
    and private.clinic_profile_snapshot(p_clinic)->'missing' = '[]'::jsonb;
$$;
revoke all on function private.clinic_public_profile_complete(public.clinics)
  from public, anon, authenticated, service_role;

create or replace view private.public_clinic_directory as
select c.id, c.slug, c.name, c.city, c.address, c.phone, c.description
from public.clinics c join public.clinic_applications a on a.id = c.application_id
where a.submission_status = 'approved' and c.approved_at is not null
  and c.lifecycle_status = 'active' and c.publication_status = 'published'
  and private.clinic_public_profile_complete(c);

create function public.vetia_get_clinic_publication(p_application_id uuid)
returns jsonb language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select private.clinic_profile_snapshot(c) || jsonb_build_object(
    'clinicId', c.id, 'lifecycle', c.lifecycle_status,
    'publicationRevision', c.publication_revision,
    'complete', private.clinic_public_profile_complete(c)
  )
  from public.clinics c where c.application_id = p_application_id
    and private.is_platform_admin() and private.has_appointment_session();
$$;
revoke all on function public.vetia_get_clinic_publication(uuid) from public, anon, authenticated, service_role;
grant execute on function public.vetia_get_clinic_publication(uuid) to authenticated;

create function private.decide_clinic_publication(
  p_clinic_id uuid, p_profile_revision integer, p_publication_revision integer,
  p_operation_id uuid, p_reason text, p_publish boolean
)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_application_id uuid;
  v_application public.clinic_applications%rowtype;
  v_clinic public.clinics%rowtype;
  v_receipt private.clinic_publication_receipts%rowtype;
  v_target public.clinic_publication_status := case when p_publish then 'published' else 'withdrawn' end;
  v_reason text := btrim(p_reason);
begin
  perform private.require_clinic_activation_admin();
  if p_clinic_id is null or p_profile_revision is null or p_profile_revision < 0
    or p_publication_revision is null or p_publication_revision not between 0 and 2147483646
    or p_operation_id is null or v_reason is null or char_length(v_reason) not between 5 and 500
    or translate(v_reason, chr(10), '') ~ '[[:cntrl:]]'
  then
    raise exception using errcode = '22023', message = 'Invalid publication decision';
  end if;

  -- Operation key, application, clinic, representation, applicant, membership.
  perform pg_advisory_xact_lock(hashtextextended(
    'vetia:clinic-publication:' || v_actor::text || ':' || p_operation_id::text, 0));
  perform private.require_clinic_activation_admin();
  select * into v_receipt from private.clinic_publication_receipts
    where actor_user_id = v_actor and operation_id = p_operation_id;
  if found then
    if row(v_receipt.clinic_id, v_receipt.profile_revision, v_receipt.publication_revision,
      v_receipt.resulting_status, v_receipt.reason)
      is distinct from row(p_clinic_id, p_profile_revision, p_publication_revision + 1, v_target, v_reason)
    then
      raise exception using errcode = 'PT409', message = 'Publication operation key already used';
    end if;
  else
    select application_id into v_application_id from public.clinics where id = p_clinic_id;
    if not found then raise exception using errcode = 'P0002', message = 'Clinic not found'; end if;
    select * into v_application from public.clinic_applications where id = v_application_id for update;
    select * into v_clinic from public.clinics
      where id = p_clinic_id and application_id = v_application_id for update;
    perform private.require_clinic_activation_admin();

    if v_clinic.id is null or v_clinic.publication_revision <> p_publication_revision
      or v_clinic.profile_revision <> p_profile_revision
      or (p_publish and v_clinic.publication_status not in ('unpublished','withdrawn'))
      or (not p_publish and v_clinic.publication_status <> 'published')
    then
      raise exception using errcode = 'PT409', message = 'Clinic publication revision or status changed';
    end if;

    if p_publish then
      if v_actor = v_application.applicant_user_id then
        raise exception using errcode = '42501', message = 'Self-publication is not allowed';
      end if;
      if v_application.submission_status <> 'approved' or v_application.reviewed_at is null
        or v_clinic.approved_at is distinct from v_application.reviewed_at
        or v_clinic.lifecycle_status <> 'active' or not private.clinic_public_profile_complete(v_clinic)
      then
        raise exception using errcode = 'PT409', message = 'Clinic profile is not eligible for publication';
      end if;
      perform 1 from private.clinic_application_representations
        where application_id = v_application_id and applicant_user_id = v_application.applicant_user_id
          and revoked_at is null and verified_at <= clock_timestamp()
          and lower(btrim(evidence_reference)) not like 'e2e-ficticia-solo-prueba:%'
        for share;
      if not found then
        raise exception using errcode = 'PT409', message = 'Applicant representation is not valid for publication';
      end if;
      perform 1 from auth.users where id = v_application.applicant_user_id
        and email_confirmed_at is not null and deleted_at is null
        and (banned_until is null or banned_until <= clock_timestamp()) for share;
      if not found then
        raise exception using errcode = 'PT409', message = 'Applicant account is not eligible for publication';
      end if;
      perform 1 from public.clinic_memberships m
        join private.clinic_activation_receipts a on a.clinic_id = m.clinic_id and a.admin_user_id = m.user_id
        where m.clinic_id = p_clinic_id and m.user_id = v_application.applicant_user_id
          and m.role = 'clinic_admin' and m.status = 'active'
          and a.expected_reviewed_at = v_application.reviewed_at for share of m;
      if not found then
        raise exception using errcode = 'PT409', message = 'Authorized clinic activation is required';
      end if;
    end if;

    perform private.require_clinic_activation_admin();
    update public.clinics set publication_status = v_target, publication_revision = p_publication_revision + 1
      where id = p_clinic_id;
    insert into private.clinic_publication_receipts (
      clinic_id, actor_user_id, operation_id, profile_revision, publication_revision,
      previous_status, resulting_status, reason
    ) values (
      p_clinic_id, v_actor, p_operation_id, p_profile_revision, p_publication_revision + 1,
      v_clinic.publication_status, v_target, v_reason
    ) returning * into v_receipt;
    insert into private.audit_events (actor_user_id, actor_type, clinic_id, action, entity_type, entity_id, reason, metadata)
    values (v_actor, 'user', p_clinic_id, case when p_publish then 'clinic.publish' else 'clinic.withdraw' end,
      'clinic', p_clinic_id, v_reason, jsonb_build_object('receipt_id', v_receipt.id,
        'profile_revision', p_profile_revision, 'publication_revision', v_receipt.publication_revision,
        'previous_status', v_receipt.previous_status, 'resulting_status', v_target));
  end if;
  return jsonb_build_object('receiptId', v_receipt.id, 'publication', v_receipt.resulting_status,
    'publicationRevision', v_receipt.publication_revision);
end;
$$;
revoke all on function private.decide_clinic_publication(uuid,integer,integer,uuid,text,boolean)
  from public, anon, authenticated, service_role;

create function public.vetia_publish_clinic(p_clinic_id uuid, p_profile_revision integer,
  p_publication_revision integer, p_operation_id uuid, p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, pg_temp
as $$ select private.decide_clinic_publication($1,$2,$3,$4,$5,true); $$;
create function public.vetia_withdraw_clinic(p_clinic_id uuid, p_profile_revision integer,
  p_publication_revision integer, p_operation_id uuid, p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, pg_temp
as $$ select private.decide_clinic_publication($1,$2,$3,$4,$5,false); $$;
revoke all on function public.vetia_publish_clinic(uuid,integer,integer,uuid,text),
  public.vetia_withdraw_clinic(uuid,integer,integer,uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.vetia_publish_clinic(uuid,integer,integer,uuid,text),
  public.vetia_withdraw_clinic(uuid,integer,integer,uuid,text) to authenticated;

commit;
