-- Run only on a disposable Supabase database with pgTAP.
begin;
select plan(40);

insert into auth.users (id, aud, role, email, email_confirmed_at)
values
  ('a1100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'decisions-owner@example.test', now()),
  ('a1100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'decisions-admin@example.test', now()),
  ('a1100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'decisions-other@example.test', now()),
  ('a1100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'decisions-unconfirmed@example.test', null);
insert into private.platform_admins (user_id) values ('a1100000-0000-4000-8000-000000000002'), ('a1100000-0000-4000-8000-000000000004');
insert into auth.sessions (id, user_id, not_after)
values ('a5500000-0000-4000-8000-000000000002', 'a1100000-0000-4000-8000-000000000002', null),
       ('a5500000-0000-4000-8000-000000000003', 'a1100000-0000-4000-8000-000000000003', null);

insert into public.clinic_applications (id, applicant_user_id, business_name, city, contact_name, contact_email, contact_phone)
values ('a2200000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001', 'Test clinic 1', 'Chincha', 'Test contact', 'unrelated@example.test', '999111222'),
       ('a2200000-0000-4000-8000-000000000002', 'a1100000-0000-4000-8000-000000000001', 'Test clinic 2', 'Chincha', 'Test contact', 'unrelated@example.test', '999111222'),
       ('a2200000-0000-4000-8000-000000000003', 'a1100000-0000-4000-8000-000000000001', 'Test clinic 3', 'Chincha', 'Test contact', 'unrelated@example.test', '999111222'),
       ('a2200000-0000-4000-8000-000000000004', 'a1100000-0000-4000-8000-000000000003', 'Test clinic 4', 'Chincha', 'Test contact', 'unrelated@example.test', '999111222');
insert into private.clinic_application_representations (application_id, applicant_user_id, verified_by, evidence_reference)
values ('a2200000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000002', 'test-evidence-1'),
       ('a2200000-0000-4000-8000-000000000004', 'a1100000-0000-4000-8000-000000000003', 'a1100000-0000-4000-8000-000000000002', 'test-evidence-4'),
       ('a2200000-0000-4000-8000-000000000003', 'a1100000-0000-4000-8000-000000000003', 'a1100000-0000-4000-8000-000000000002', 'test-evidence-wrong-account');
insert into private.clinic_application_representations (
  application_id, applicant_user_id, verified_by, evidence_reference, revoked_at
) values ('a2200000-0000-4000-8000-000000000002', 'a1100000-0000-4000-8000-000000000001',
  'a1100000-0000-4000-8000-000000000002', 'test-evidence-revoked', now());

insert into public.clinic_applications (id, applicant_user_id, business_name, city, contact_name,
  contact_email, contact_phone, submission_status, reviewed_at)
values ('a2200000-0000-4000-8000-000000000005', 'a1100000-0000-4000-8000-000000000003',
  'Other tenant', 'Ica', 'Other contact', 'other@example.test', '999111222', 'approved', now());
insert into public.clinics (id, application_id, slug, name, city, lifecycle_status, approved_at)
values ('a4400000-0000-4000-8000-000000000001', 'a2200000-0000-4000-8000-000000000005',
  'test-other-tenant', 'Other tenant', 'Ica', 'active', now());
insert into public.clinic_memberships (clinic_id, user_id, role, status)
values ('a4400000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000003', 'clinic_admin', 'active');

-- Force a late failure after clinic, membership, application and review writes.
create function private.test_reject_decision_audit() returns trigger language plpgsql as $trigger$
begin
  if new.metadata ->> 'operation_id' = 'a3300000-0000-4000-8000-000000000008' then
    raise exception using errcode = '23505', message = 'Injected unrelated unique violation',
      constraint = 'test_unrelated_unique';
  end if;
  raise exception 'Injected audit failure';
end;
$trigger$;
create trigger test_reject_decision_audit before insert on private.audit_events
  for each row when (new.entity_id = 'a2200000-0000-4000-8000-000000000004'::uuid)
  execute function private.test_reject_decision_audit();

select ok(not has_function_privilege('anon',
  'public.vetia_review_clinic_application(uuid,uuid,timestamptz,text,text,text)', 'EXECUTE'), 'anon cannot execute');
select ok(not has_table_privilege('authenticated', 'private.clinic_application_representations', 'INSERT'), 'no client evidence writes');
select ok(not has_table_privilege('authenticated', 'public.clinic_applications', 'UPDATE'), 'no direct application updates');
select ok(not has_function_privilege('service_role',
  'public.vetia_review_clinic_application(uuid,uuid,timestamptz,text,text,text)', 'EXECUTE'), 'service role cannot execute directly');
select ok(not has_function_privilege('authenticated', 'private.require_active_review_admin()', 'EXECUTE'), 'guard is private');
select throws_ok($$
  insert into private.application_reviews (application_id, reviewer_user_id, action, operation_id, resulting_status)
  values ('a2200000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000002', 'approve',
    'a3300000-0000-4000-8000-000000000007', 'approved')
$$, '23514', null, 'approval receipt requires a resulting clinic');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'a1100000-0000-4000-8000-000000000001', 'role', 'authenticated',
  'session_id', 'a5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + 3600,
  'aal', 'aal2', 'amr', jsonb_build_array(jsonb_build_object('method', 'totp',
  'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, '42501', 'Confirmed platform administrator with AAL2 required', 'denies unconfirmed admin and AAL1');
select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'a1100000-0000-4000-8000-000000000004', 'role', 'authenticated',
  'session_id', 'a5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + 3600,
  'aal', 'aal2', 'amr', jsonb_build_array(jsonb_build_object('method', 'totp',
  'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, '42501', 'Confirmed platform administrator with AAL2 required', 'denies unconfirmed admin and AAL1');
select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'a1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'session_id', 'a5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + 3600,
  'aal', 'aal1', 'amr', jsonb_build_array(jsonb_build_object('method', 'totp',
  'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, '42501', 'Confirmed platform administrator with AAL2 required', 'denies unconfirmed admin and AAL1');
select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'a1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'session_id', 'a5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + 3600,
  'aal', 'aal2', 'amr', jsonb_build_array(jsonb_build_object('method', 'totp',
  'timestamp', floor(extract(epoch from clock_timestamp())) - 601)))::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, '42501',
  'Recent TOTP verification required', 'stale TOTP is denied even with a valid AAL2 session');
select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'a1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'session_id', 'a5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + 3600,
  'aal', 'aal2', 'amr', jsonb_build_array(jsonb_build_object('method', 'totp',
  'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000002', 'a3300000-0000-4000-8000-000000000002', null, 'approve', null, null)$$, 'PT409',
  'Applicant representation has not been verified', 'revoked evidence cannot approve');
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000002', 'a3300000-0000-4000-8000-000000000002', null, 'request_information', null, null)$$, '22023', null, 'request_information is refused with 22023');
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000003', 'a3300000-0000-4000-8000-000000000003', null, 'reject', null, null)$$, '22023', null, 'reject is refused with 22023');
select is(public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000002', 'a3300000-0000-4000-8000-000000000002', null, 'request_information', 'Falta acreditar la representación', 'Nota interna') ->> 'status',
  'needs_information', 'information request saves the visible message');
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000003', 'a3300000-0000-4000-8000-000000000003', null, 'approve', null, null)$$, 'PT409', 'Applicant representation has not been verified', 'different account in the evidence cannot approve');
select is(public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000003', 'a3300000-0000-4000-8000-000000000003', null, 'reject', 'Datos insuficientes', null) ->> 'status', 'rejected', 'rejection with a message succeeds');
select set_config('request.jwt.claims', (current_setting('request.jwt.claims')::jsonb - 'amr')::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, '42501', 'Recent TOTP verification required', 'missing AMR is denied');
select set_config('request.jwt.claims', (current_setting('request.jwt.claims')::jsonb || '{"amr":{"method":"totp"}}')::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, '42501', 'Recent TOTP verification required', 'non-array AMR is denied');
select set_config('request.jwt.claims', (current_setting('request.jwt.claims')::jsonb || '{"amr":[{"method":"totp","timestamp":"bad"}]}')::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, '42501', 'Recent TOTP verification required', 'nonnumeric AMR timestamp is denied');
select set_config('request.jwt.claims', (current_setting('request.jwt.claims')::jsonb || '{"exp":0}')::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, 'PT401', 'Active administrative session required', 'expired JWT is denied by SQL guard');
select set_config('request.jwt.claims', (current_setting('request.jwt.claims')::jsonb || jsonb_build_object(
  'exp', floor(extract(epoch from clock_timestamp())) + 3600, 'session_id', 'a5500000-0000-4000-8000-000000000003'))::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, 'PT401', 'Active administrative session required', 'session must belong to the reviewer');
select set_config('request.jwt.claims', (current_setting('request.jwt.claims')::jsonb ||
  '{"session_id":"a5500000-0000-4000-8000-000000000009"}')::text, true);
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, 'PT401', 'Active administrative session required', 'removed session is denied even with an unexpired token');
select set_config('request.jwt.claims', (current_setting('request.jwt.claims')::jsonb || jsonb_build_object(
  'session_id', 'a5500000-0000-4000-8000-000000000002', 'amr', jsonb_build_array(jsonb_build_object(
    'method', 'totp', 'timestamp', floor(extract(epoch from clock_timestamp()))))))::text, true);
select is(public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null) ->> 'status', 'approved', 'verified representation and recent TOTP allow approval');
select is(public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null), public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null), 'exact retries return the original receipt');
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000001', null, 'reject', 'Different intent', null)$$, 'PT409', 'Review operation key already used with different input', 'same key cannot change the decision');
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000002', 'a3300000-0000-4000-8000-000000000001', null, 'approve', null, null)$$, 'PT409',
  'Review operation key already used with different input', 'same key cannot move to another application');
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000005', null, 'reject', 'Stale decision', null)$$, 'PT409', null, 'reject is refused with PT409');
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000004', 'a3300000-0000-4000-8000-000000000004', null, 'approve', null, null)$$, 'P0001', 'Injected audit failure', 'audit failure aborts approval');
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000004', 'a3300000-0000-4000-8000-000000000008', null, 'approve', null, null)$$, '23505',
  'Injected unrelated unique violation', 'unrelated unique violation is not mapped to an operation key conflict');

select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'a1100000-0000-4000-8000-000000000003', 'role', 'authenticated',
  'session_id', 'a5500000-0000-4000-8000-000000000003', 'exp', floor(extract(epoch from clock_timestamp())) + 3600,
  'aal', 'aal2', 'amr', jsonb_build_array(jsonb_build_object('method', 'totp',
  'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select is((select count(*)::integer from public.clinic_applications where id = 'a2200000-0000-4000-8000-000000000001'), 0, 'another applicant cannot see this application');
select throws_ok($$select public.vetia_review_clinic_application('a2200000-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-000000000006', null, 'approve', null, null)$$, '42501', 'Confirmed platform administrator with AAL2 required', 'ordinary user cannot decide another applicant''s request');
select throws_ok($$select internal_notes from private.application_reviews$$, '42501', null, 'ordinary user cannot read internal notes');
select throws_ok($$select evidence_reference from private.clinic_application_representations$$, '42501', null, 'ordinary user cannot read evidence');
select is((select count(*)::integer from public.clinic_memberships
  where clinic_id = 'a4400000-0000-4000-8000-000000000001'), 1, 'other clinic admin can see their own membership');
select is((select count(*)::integer from public.clinic_memberships
  where clinic_id <> 'a4400000-0000-4000-8000-000000000001'), 0, 'other clinic admin cannot see the new pending membership');

reset role;
select ok(exists (
  select 1 from public.clinic_applications a join private.application_reviews r on r.application_id = a.id
  where a.id = 'a2200000-0000-4000-8000-000000000002'
    and a.decision_message = 'Falta acreditar la representación' and r.internal_notes = 'Nota interna'
), 'public message and internal note are kept separate');
select is((select count(*)::integer from public.clinics c join public.clinic_memberships m on m.clinic_id = c.id
  where c.application_id = 'a2200000-0000-4000-8000-000000000001' and c.lifecycle_status = 'pending_activation'
    and c.profile_status = 'incomplete' and c.publication_status = 'unpublished'
    and m.user_id = 'a1100000-0000-4000-8000-000000000001' and m.role = 'clinic_admin' and m.status = 'pending'),
  1, 'exactly one unpublished pending clinic and verified applicant membership exist');
select is((select count(*)::integer from private.application_reviews r
  where r.application_id in ('a2200000-0000-4000-8000-000000000001', 'a2200000-0000-4000-8000-000000000002', 'a2200000-0000-4000-8000-000000000003')
    and (select count(*) from private.audit_events e
      where e.entity_id = r.application_id and e.entity_type = 'clinic_application'
        and e.metadata ->> 'review_id' = r.id::text and e.actor_user_id = r.reviewer_user_id
        and e.action = 'clinic_application.' || r.action) = 1),
  3, 'each decision has exactly one matching audit event');
select is((select count(*)::integer from private.audit_events
  where entity_type = 'clinic_application' and entity_id in ('a2200000-0000-4000-8000-000000000001', 'a2200000-0000-4000-8000-000000000002', 'a2200000-0000-4000-8000-000000000003')),
  3, 'no extra audit events were written');
select ok(
  (select submission_status = 'submitted' and reviewed_at is null from public.clinic_applications where id = 'a2200000-0000-4000-8000-000000000004')
  and not exists (select 1 from public.clinics where application_id = 'a2200000-0000-4000-8000-000000000004')
  and not exists (select 1 from private.application_reviews where application_id = 'a2200000-0000-4000-8000-000000000004'),
  'late failure rolls back application, clinic, membership and review');

select * from finish();
rollback;
