begin;

create table private.clinic_activation_receipts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique,
  admin_user_id uuid not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  operation_id uuid not null,
  expected_reviewed_at timestamptz not null,
  activated_at timestamptz not null,
  unique (actor_user_id, operation_id),
  foreign key (clinic_id, admin_user_id)
    references public.clinic_memberships (clinic_id, user_id) on delete restrict,
  check (actor_user_id <> admin_user_id)
);
alter table private.clinic_activation_receipts enable row level security;
revoke all on private.clinic_activation_receipts from public, anon, authenticated, service_role;

create function private.require_clinic_activation_admin()
returns void
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  v_amr jsonb := auth.jwt() -> 'amr';
  v_epoch numeric;
begin
  perform private.require_active_review_admin();
  if not exists (
    select 1 from auth.users u where u.id = auth.uid() and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= clock_timestamp())
  ) then
    raise exception using errcode = '42501', message = 'Active platform administrator required';
  end if;

  v_epoch := extract(epoch from clock_timestamp());
  if not exists (
    select 1 from jsonb_array_elements(
      case when jsonb_typeof(v_amr) = 'array' then v_amr else '[]'::jsonb end
    ) as amr(entry)
    where entry ->> 'method' = 'totp'
      and case when jsonb_typeof(entry -> 'timestamp') = 'number'
        then (entry ->> 'timestamp')::numeric between v_epoch - 600 and v_epoch
        else false end
  ) then
    raise exception using errcode = '42501', message = 'Recent TOTP verification required';
  end if;
end;
$$;
revoke all on function private.require_clinic_activation_admin() from public, anon, authenticated, service_role;

create function public.vetia_activate_clinic(
  p_clinic_id uuid,
  p_expected_reviewed_at timestamptz,
  p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_application_id uuid;
  v_application public.clinic_applications%rowtype;
  v_clinic public.clinics%rowtype;
  v_member public.clinic_memberships%rowtype;
  v_receipt private.clinic_activation_receipts%rowtype;
begin
  perform private.require_clinic_activation_admin();
  if p_clinic_id is null or p_expected_reviewed_at is null or p_operation_id is null then
    raise exception using errcode = '22023', message = 'Clinic, expected review and operation key required';
  end if;

  -- Order: operation key, application, clinic, representation, applicant, membership.
  -- The application lock serializes approval and manual evidence changes for this tenant.
  perform pg_advisory_xact_lock(hashtextextended(
    'vetia:clinic-activation:' || v_actor::text || ':' || p_operation_id::text, 0));
  perform private.require_clinic_activation_admin();

  select r.* into v_receipt from private.clinic_activation_receipts r
    where r.actor_user_id = v_actor and r.operation_id = p_operation_id;
  if found then
    if row(v_receipt.clinic_id, v_receipt.expected_reviewed_at)
      is distinct from row(p_clinic_id, p_expected_reviewed_at)
    then
      raise exception using errcode = 'PT409', message = 'Activation operation key already used with different input';
    end if;
  else
    select c.application_id into v_application_id from public.clinics c where c.id = p_clinic_id;
    if not found then
      raise exception using errcode = 'P0002', message = 'Clinic not found';
    end if;

    select a.* into v_application from public.clinic_applications a
      where a.id = v_application_id for update;
    select c.* into v_clinic from public.clinics c
      where c.id = p_clinic_id and c.application_id = v_application_id for update;
    if v_application.id is null or v_clinic.id is null
      or v_application.submission_status <> 'approved'
      or v_application.reviewed_at is distinct from p_expected_reviewed_at
      or v_clinic.approved_at is distinct from v_application.reviewed_at
      or v_clinic.lifecycle_status <> 'pending_activation'
      or v_clinic.profile_status <> 'incomplete'
      or v_clinic.publication_status <> 'unpublished'
    then
      raise exception using errcode = 'PT409', message = 'Clinic or approval revision is not eligible for activation';
    end if;
    if v_actor = v_application.applicant_user_id then
      raise exception using errcode = '42501', message = 'Self-activation is not allowed';
    end if;

    perform 1 from private.clinic_application_representations r
      where r.application_id = v_application.id and r.applicant_user_id = v_application.applicant_user_id
        and r.revoked_at is null and r.verified_at <= clock_timestamp()
      for share;
    if not found then
      raise exception using errcode = 'PT409', message = 'Applicant representation is not valid for activation';
    end if;

    perform 1 from auth.users u where u.id = v_application.applicant_user_id
      and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= clock_timestamp())
      for share;
    if not found then
      raise exception using errcode = 'PT409', message = 'Applicant account is not eligible for activation';
    end if;

    select m.* into v_member from public.clinic_memberships m
      where m.clinic_id = p_clinic_id and m.user_id = v_application.applicant_user_id
      for update;
    if v_member.user_id is null or v_member.role <> 'clinic_admin' or v_member.status <> 'pending'
      or exists (
        select 1 from public.clinic_memberships m where m.clinic_id = p_clinic_id
          and m.user_id <> v_member.user_id
          and (m.status = 'active' or (m.role = 'clinic_admin' and m.status <> 'revoked'))
      )
    then
      raise exception using errcode = 'PT409', message = 'Expected first pending clinic administrator not found';
    end if;

    perform private.require_clinic_activation_admin();
    update public.clinics set lifecycle_status = 'active' where id = p_clinic_id;
    update public.clinic_memberships set status = 'active'
      where clinic_id = p_clinic_id and user_id = v_member.user_id;

    insert into private.clinic_activation_receipts (
      clinic_id, admin_user_id, actor_user_id, operation_id, expected_reviewed_at, activated_at
    ) values (
      p_clinic_id, v_member.user_id, v_actor, p_operation_id, p_expected_reviewed_at, clock_timestamp()
    ) returning * into v_receipt;

    insert into private.audit_events (
      actor_user_id, actor_type, clinic_id, action, entity_type, entity_id, metadata, created_at
    ) values (
      v_actor, 'user', p_clinic_id, 'clinic.activate', 'clinic', p_clinic_id,
      jsonb_build_object('receipt_id', v_receipt.id, 'operation_id', p_operation_id,
        'application_id', v_application.id, 'admin_user_id', v_member.user_id,
        'previous_lifecycle_status', 'pending_activation', 'lifecycle_status', 'active',
        'previous_membership_status', 'pending', 'membership_status', 'active'),
      v_receipt.activated_at
    );
  end if;

  return jsonb_build_object('receipt_id', v_receipt.id, 'clinic_id', v_receipt.clinic_id,
    'admin_user_id', v_receipt.admin_user_id, 'activated_at', v_receipt.activated_at,
    'lifecycle_status', 'active', 'membership_status', 'active',
    'profile_status', 'incomplete', 'publication_status', 'unpublished');
end;
$$;
revoke all on function public.vetia_activate_clinic(uuid, timestamptz, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.vetia_activate_clinic(uuid, timestamptz, uuid) to authenticated;

commit;
