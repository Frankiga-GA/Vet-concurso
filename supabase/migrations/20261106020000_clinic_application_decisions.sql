begin;

-- Written only by a trusted operator after checking the applicant's authority.
create table private.clinic_application_representations (
  application_id uuid primary key references public.clinic_applications(id) on delete restrict,
  applicant_user_id uuid not null references auth.users(id) on delete restrict,
  verified_by uuid not null references auth.users(id) on delete restrict,
  verified_at timestamptz not null default now(),
  evidence_reference text not null check (char_length(btrim(evidence_reference)) between 1 and 240),
  revoked_at timestamptz check (revoked_at >= verified_at),
  check (verified_by <> applicant_user_id)
);
alter table private.clinic_application_representations enable row level security;
revoke all on private.clinic_application_representations from public, anon, authenticated, service_role;

-- Older history rows need no receipt. New receipts live with their review.
alter table private.application_reviews
  add column operation_id uuid,
  add column expected_reviewed_at timestamptz,
  add column visible_message text,
  add column resulting_status public.application_status,
  add column resulting_clinic_id uuid references public.clinics(id) on delete restrict,
  add constraint application_reviews_receipt_consistency check (
    (operation_id is null and expected_reviewed_at is null and visible_message is null
      and resulting_status is null and resulting_clinic_id is null)
    or (operation_id is not null and resulting_status is not null and (
      (action = 'approve' and resulting_status = 'approved' and resulting_clinic_id is not null)
      or (action in ('request_information', 'reject') and resulting_clinic_id is null
        and visible_message is not null and visible_message ~ '[^[:space:]]'
        and ((action = 'request_information' and resulting_status = 'needs_information')
          or (action = 'reject' and resulting_status = 'rejected')))
    ))
  );

create unique index application_reviews_reviewer_operation_uidx
  on private.application_reviews (reviewer_user_id, operation_id)
  where operation_id is not null;

-- Runs as the RPC owner. Auth claims come from the validated Data API request.
create function private.require_active_review_admin()
returns void
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  v_claims jsonb := auth.jwt();
  v_actor uuid := auth.uid();
  v_session_id text := v_claims ->> 'session_id';
  v_now timestamptz := clock_timestamp();
begin
  if v_actor is null or not private.is_platform_admin()
    or not exists (select 1 from auth.users u where u.id = v_actor and u.email_confirmed_at is not null)
  then
    raise exception using errcode = '42501', message = 'Confirmed platform administrator with AAL2 required';
  end if;

  if not coalesce(jsonb_typeof(v_claims -> 'exp') = 'number', false)
    or not coalesce(v_session_id ~ '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$', false)
  then
    raise exception using errcode = 'PT401', message = 'Active administrative session required';
  end if;
  if (v_claims ->> 'exp')::numeric <= extract(epoch from v_now)
    or not exists (select 1 from auth.sessions s where s.id = v_session_id::uuid
      and s.user_id = v_actor and (s.not_after is null or s.not_after > v_now))
  then
    raise exception using errcode = 'PT401', message = 'Active administrative session required';
  end if;
end;
$$;
revoke all on function private.require_active_review_admin() from public, anon, authenticated, service_role;

create function public.vetia_review_clinic_application(
  p_application_id uuid,
  p_operation_id uuid,
  p_expected_reviewed_at timestamptz,
  p_action text,
  p_visible_message text default null,
  p_internal_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_message text := nullif(regexp_replace(p_visible_message, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
  v_notes text := nullif(regexp_replace(p_internal_notes, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
  v_application public.clinic_applications%rowtype;
  v_prior private.application_reviews%rowtype;
  v_status public.application_status;
  v_clinic_id uuid;
  v_review_id uuid;
  v_now timestamptz;
  v_epoch numeric;
  v_amr jsonb := auth.jwt() -> 'amr';
begin
  perform private.require_active_review_admin();

  if p_application_id is null or p_operation_id is null or p_action is null
    or p_action not in ('request_information', 'approve', 'reject')
    or char_length(v_message) > 2000 or char_length(v_notes) > 4000
    or (p_action in ('request_information', 'reject') and v_message is null)
  then
    raise exception using errcode = '22023', message = 'Invalid review input';
  end if;

  -- Lock the operation before the application, including retries across different applications.
  -- Hash collisions only serialize unrelated requests. The receipt comparison uses the full key.
  perform pg_advisory_xact_lock(hashtextextended(
    'vetia:clinic-review:' || v_actor::text || ':' || p_operation_id::text, 0));
  select a.* into v_application from public.clinic_applications a
    where a.id = p_application_id for update;
  perform private.require_active_review_admin();
  if v_application.id is null then
    raise exception using errcode = 'P0002', message = 'Application not found';
  end if;
  if v_application.applicant_user_id = v_actor then
    raise exception using errcode = '42501', message = 'Self-review is not allowed';
  end if;

  select r.* into v_prior from private.application_reviews r
    where r.reviewer_user_id = v_actor and r.operation_id = p_operation_id;
  if found then
    if row(v_prior.application_id, v_prior.action, v_prior.expected_reviewed_at,
           v_prior.visible_message, v_prior.internal_notes)
      is distinct from row(p_application_id, p_action, p_expected_reviewed_at, v_message, v_notes)
    then
      raise exception using errcode = 'PT409', message = 'Review operation key already used with different input';
    end if;
    -- A receipt is a read. A retry after the step-up window cannot perform a new approval.
    return jsonb_build_object('application_id', v_prior.application_id, 'review_id', v_prior.id,
      'status', v_prior.resulting_status, 'clinic_id', v_prior.resulting_clinic_id,
      'reviewed_at', v_prior.created_at);
  end if;

  if v_application.reviewed_at is distinct from p_expected_reviewed_at
    or v_application.submission_status not in ('submitted', 'needs_information')
    or (v_application.submission_status = 'needs_information' and p_action = 'request_information')
  then
    raise exception using errcode = 'PT409', message = 'Application changed or transition not allowed';
  end if;

  if p_action = 'approve' then
    -- Lock the evidence row so revocation cannot interleave with the approval.
    perform 1 from private.clinic_application_representations r
      where r.application_id = p_application_id and r.applicant_user_id = v_application.applicant_user_id
        and r.revoked_at is null and r.verified_at <= clock_timestamp()
      for share;
    if not found or not exists (
      select 1 from auth.users u where u.id = v_application.applicant_user_id and u.email_confirmed_at is not null
    ) then
      raise exception using errcode = 'PT409', message = 'Applicant representation has not been verified';
    end if;

    perform private.require_active_review_admin();
    v_now := clock_timestamp();
    v_epoch := extract(epoch from v_now);
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

    insert into public.clinics (
      application_id, slug, name, city, lifecycle_status, profile_status,
      publication_status, approved_at, approved_by
    ) values (
      p_application_id, 'clinica-' || p_application_id::text, v_application.business_name, v_application.city,
      'pending_activation', 'incomplete', 'unpublished', v_now, v_actor
    ) returning id into v_clinic_id;

    insert into public.clinic_memberships (clinic_id, user_id, role, status, invited_by)
      values (v_clinic_id, v_application.applicant_user_id, 'clinic_admin', 'pending', v_actor);
    v_status := 'approved';
  elsif p_action = 'reject' then
    v_status := 'rejected';
  else
    v_status := 'needs_information';
  end if;
  v_now := coalesce(v_now, clock_timestamp());

  update public.clinic_applications set submission_status = v_status, decision_message = v_message,
    reviewed_by = v_actor, reviewed_at = v_now where id = p_application_id;

  insert into private.application_reviews (
    application_id, reviewer_user_id, action, internal_notes, created_at,
    operation_id, expected_reviewed_at, visible_message, resulting_status, resulting_clinic_id
  ) values (
    p_application_id, v_actor, p_action, v_notes, v_now,
    p_operation_id, p_expected_reviewed_at, v_message, v_status, v_clinic_id
  ) returning id into v_review_id;

  insert into private.audit_events (
    actor_user_id, actor_type, clinic_id, action, entity_type, entity_id, metadata, created_at
  ) values (
    v_actor, 'user', v_clinic_id, 'clinic_application.' || p_action, 'clinic_application',
    p_application_id, jsonb_build_object('review_id', v_review_id, 'operation_id', p_operation_id,
      'previous_status', v_application.submission_status, 'new_status', v_status), v_now
  );

  return jsonb_build_object('application_id', p_application_id, 'review_id', v_review_id,
    'status', v_status, 'clinic_id', v_clinic_id, 'reviewed_at', v_now);
end;
$$;

revoke all on function public.vetia_review_clinic_application(uuid, uuid, timestamptz, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.vetia_review_clinic_application(uuid, uuid, timestamptz, text, text, text)
  to authenticated;

commit;
