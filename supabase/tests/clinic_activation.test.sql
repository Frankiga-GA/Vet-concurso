-- Run on Supabase local; all fixtures and trigger changes roll back.
begin;
select plan(37);

insert into auth.users (id, aud, role, email, email_confirmed_at, banned_until)
values ('b1100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'activation-1@example.test', now(), null),
       ('b1100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'activation-2@example.test', now(), null),
       ('b1100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'activation-3@example.test', now(), null),
       ('b1100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'activation-4@example.test', null, null),
       ('b1100000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'activation-5@example.test', now(), now() + interval '1 day');
insert into private.platform_admins (user_id) values ('b1100000-0000-4000-8000-000000000002'), ('b1100000-0000-4000-8000-000000000004');
insert into auth.sessions (id, user_id, not_after)
values ('b5500000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000001', null), ('b5500000-0000-4000-8000-000000000002', 'b1100000-0000-4000-8000-000000000002', null), ('b5500000-0000-4000-8000-000000000003', 'b1100000-0000-4000-8000-000000000003', null), ('b5500000-0000-4000-8000-000000000004', 'b1100000-0000-4000-8000-000000000004', null);

insert into public.clinic_applications (id, applicant_user_id, business_name, city, contact_name,
  contact_email, contact_phone, submission_status, reviewed_at, reviewed_by)
values ('b2200000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000001', 'Activation fixture 1', 'Chincha', 'Contact', 'activation@example.test', '999111222', 'approved', '2026-11-06T02:00:00.123456Z', 'b1100000-0000-4000-8000-000000000002'),
       ('b2200000-0000-4000-8000-000000000002', 'b1100000-0000-4000-8000-000000000001', 'Activation fixture 2', 'Chincha', 'Contact', 'activation@example.test', '999111222', 'approved', '2026-11-06T02:00:00.123456Z', 'b1100000-0000-4000-8000-000000000002'),
       ('b2200000-0000-4000-8000-000000000003', 'b1100000-0000-4000-8000-000000000001', 'Activation fixture 3', 'Chincha', 'Contact', 'activation@example.test', '999111222', 'approved', '2026-11-06T02:00:00.123456Z', 'b1100000-0000-4000-8000-000000000002'),
       ('b2200000-0000-4000-8000-000000000004', 'b1100000-0000-4000-8000-000000000001', 'Activation fixture 4', 'Chincha', 'Contact', 'activation@example.test', '999111222', 'submitted', null, null),
       ('b2200000-0000-4000-8000-000000000005', 'b1100000-0000-4000-8000-000000000001', 'Activation fixture 5', 'Chincha', 'Contact', 'activation@example.test', '999111222', 'approved', '2026-11-06T02:00:00.123456Z', 'b1100000-0000-4000-8000-000000000002'),
       ('b2200000-0000-4000-8000-000000000006', 'b1100000-0000-4000-8000-000000000001', 'Activation fixture 6', 'Chincha', 'Contact', 'activation@example.test', '999111222', 'approved', '2026-11-06T02:00:00.123456Z', 'b1100000-0000-4000-8000-000000000002'),
       ('b2200000-0000-4000-8000-000000000007', 'b1100000-0000-4000-8000-000000000005', 'Activation fixture 7', 'Chincha', 'Contact', 'activation@example.test', '999111222', 'approved', '2026-11-06T02:00:00.123456Z', 'b1100000-0000-4000-8000-000000000002'),
       ('b2200000-0000-4000-8000-000000000008', 'b1100000-0000-4000-8000-000000000002', 'Activation fixture 8', 'Chincha', 'Contact', 'activation@example.test', '999111222', 'approved', '2026-11-06T02:00:00.123456Z', 'b1100000-0000-4000-8000-000000000002');
insert into public.clinics (id, application_id, slug, name, city, approved_at, lifecycle_status)
values ('b4400000-0000-4000-8000-000000000001', 'b2200000-0000-4000-8000-000000000001', 'activation-fixture-1', 'Activation fixture 1', 'Chincha', '2026-11-06T02:00:00.123456Z', 'pending_activation'),
       ('b4400000-0000-4000-8000-000000000002', 'b2200000-0000-4000-8000-000000000002', 'activation-fixture-2', 'Activation fixture 2', 'Chincha', '2026-11-06T02:00:00.123456Z', 'pending_activation'),
       ('b4400000-0000-4000-8000-000000000003', 'b2200000-0000-4000-8000-000000000003', 'activation-fixture-3', 'Activation fixture 3', 'Chincha', '2026-11-06T02:00:00.123456Z', 'pending_activation'),
       ('b4400000-0000-4000-8000-000000000004', 'b2200000-0000-4000-8000-000000000004', 'activation-fixture-4', 'Activation fixture 4', 'Chincha', null, 'pending_activation'),
       ('b4400000-0000-4000-8000-000000000005', 'b2200000-0000-4000-8000-000000000005', 'activation-fixture-5', 'Activation fixture 5', 'Chincha', '2026-11-06T02:00:00.123456Z', 'pending_activation'),
       ('b4400000-0000-4000-8000-000000000006', 'b2200000-0000-4000-8000-000000000006', 'activation-fixture-6', 'Activation fixture 6', 'Chincha', '2026-11-06T02:00:00.123456Z', 'active'),
       ('b4400000-0000-4000-8000-000000000007', 'b2200000-0000-4000-8000-000000000007', 'activation-fixture-7', 'Activation fixture 7', 'Chincha', '2026-11-06T02:00:00.123456Z', 'pending_activation'),
       ('b4400000-0000-4000-8000-000000000008', 'b2200000-0000-4000-8000-000000000008', 'activation-fixture-8', 'Activation fixture 8', 'Chincha', '2026-11-06T02:00:00.123456Z', 'pending_activation');
insert into public.clinic_memberships (clinic_id, user_id, role, status)
values ('b4400000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000001', 'clinic_admin', 'pending'),
       ('b4400000-0000-4000-8000-000000000002', 'b1100000-0000-4000-8000-000000000001', 'clinic_admin', 'pending'),
       ('b4400000-0000-4000-8000-000000000003', 'b1100000-0000-4000-8000-000000000003', 'clinic_admin', 'pending'),
       ('b4400000-0000-4000-8000-000000000004', 'b1100000-0000-4000-8000-000000000001', 'clinic_admin', 'pending'),
       ('b4400000-0000-4000-8000-000000000005', 'b1100000-0000-4000-8000-000000000001', 'clinic_admin', 'pending'),
       ('b4400000-0000-4000-8000-000000000006', 'b1100000-0000-4000-8000-000000000001', 'clinic_admin', 'pending'),
       ('b4400000-0000-4000-8000-000000000007', 'b1100000-0000-4000-8000-000000000005', 'clinic_admin', 'pending'),
       ('b4400000-0000-4000-8000-000000000008', 'b1100000-0000-4000-8000-000000000002', 'clinic_admin', 'pending');
insert into private.clinic_application_representations (
  application_id, applicant_user_id, verified_by, evidence_reference, revoked_at
)
values ('b2200000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000002', 'activation-test-1', null),
       ('b2200000-0000-4000-8000-000000000002', 'b1100000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000002', 'activation-test-2', now()),
       ('b2200000-0000-4000-8000-000000000003', 'b1100000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000002', 'activation-test-3', null),
       ('b2200000-0000-4000-8000-000000000004', 'b1100000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000002', 'activation-test-4', null),
       ('b2200000-0000-4000-8000-000000000005', 'b1100000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000002', 'activation-test-5', null),
       ('b2200000-0000-4000-8000-000000000006', 'b1100000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000002', 'activation-test-6', null),
       ('b2200000-0000-4000-8000-000000000007', 'b1100000-0000-4000-8000-000000000005', 'b1100000-0000-4000-8000-000000000002', 'activation-test-7', null);

create function private.test_fail_activation_audit() returns trigger language plpgsql as $test$
begin
  raise exception 'Injected activation audit failure';
end;
$test$;
create trigger test_fail_activation_audit before insert on private.audit_events
  for each row when (new.action = 'clinic.activate' and new.entity_id = 'b4400000-0000-4000-8000-000000000005'::uuid)
  execute function private.test_fail_activation_audit();

select ok(has_function_privilege('authenticated', 'public.vetia_activate_clinic(uuid,timestamptz,uuid)', 'EXECUTE'), 'authenticated may invoke activation guard');
select ok(not has_function_privilege('anon', 'public.vetia_activate_clinic(uuid,timestamptz,uuid)', 'EXECUTE'), 'anon cannot execute activation');
select ok(not has_function_privilege('service_role', 'public.vetia_activate_clinic(uuid,timestamptz,uuid)', 'EXECUTE'), 'service role cannot execute activation');
select ok(not has_function_privilege('authenticated', 'private.require_clinic_activation_admin()', 'EXECUTE'), 'activation helper is internal');
select ok(not has_table_privilege('authenticated', 'private.clinic_activation_receipts', 'SELECT'), 'receipts stay private');
select ok(not has_column_privilege('authenticated', 'public.clinic_memberships', 'status', 'UPDATE'), 'cannot directly change membership status');
select ok(not has_column_privilege('authenticated', 'public.clinics', 'lifecycle_status', 'UPDATE'), 'cannot directly activate clinic');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000001', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000001', 'exp', floor(extract(epoch from clock_timestamp())) + (3600), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, '42501', 'Confirmed platform administrator with AAL2 required', 'ordinary user cannot self-activate with AAL2');
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000003', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000003', 'exp', floor(extract(epoch from clock_timestamp())) + (3600), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, '42501', 'Confirmed platform administrator with AAL2 required', 'ordinary user cannot activate another clinic');
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000004', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000004', 'exp', floor(extract(epoch from clock_timestamp())) + (3600), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, '42501', 'Confirmed platform administrator with AAL2 required', 'unconfirmed platform administrator is denied');
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'aal', 'aal1', 'session_id', 'b5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + (3600), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, '42501', 'Confirmed platform administrator with AAL2 required', 'AAL1 platform administrator is denied');
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000003', 'exp', floor(extract(epoch from clock_timestamp())) + (3600), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, 'PT401', 'Active administrative session required', 'session must belong to the administrator');
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000009', 'exp', floor(extract(epoch from clock_timestamp())) + (3600), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, 'PT401', 'Active administrative session required', 'missing or signed-out session is denied');
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + (-1), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, 'PT401', 'Active administrative session required', 'expired JWT is denied');
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + (3600))::text, true);
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, '42501', 'Recent TOTP verification required', 'AAL2 without TOTP AMR is denied');
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + (3600), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 601)))::text, true);
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, '42501', 'Recent TOTP verification required', 'stale TOTP is denied');
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000002', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000002', 'exp', floor(extract(epoch from clock_timestamp())) + (3600), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select throws_ok($$select public.vetia_activate_clinic(null, '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, '22023', 'Clinic, expected review and operation key required', 'missing clinic identifier is rejected');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000009', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, 'P0002', 'Clinic not found', 'unknown clinic identifier is rejected');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123455Z', 'b3300000-0000-4000-8000-000000000001')$$, 'PT409', 'Clinic or approval revision is not eligible for activation', 'stale review is rejected');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000002', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000002')$$, 'PT409', 'Applicant representation is not valid for activation', 'revoked evidence is denied');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000003', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000003')$$, 'PT409', 'Expected first pending clinic administrator not found', 'another users pending membership cannot be activated');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000004', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000004')$$, 'PT409', 'Clinic or approval revision is not eligible for activation', 'submitted application is not eligible');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000006', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000006')$$, 'PT409', 'Clinic or approval revision is not eligible for activation', 'already active clinic is not eligible');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000007', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000007')$$, 'PT409', 'Applicant account is not eligible for activation', 'blocked applicant is not eligible');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000008', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000008')$$, '42501', 'Self-activation is not allowed', 'superadministrator cannot activate own membership');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000005', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000005')$$, 'P0001', 'Injected activation audit failure', 'audit failure aborts activation');
select is(public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001') ->> 'admin_user_id', 'b1100000-0000-4000-8000-000000000001'::text, 'eligible activation derives the correct user');
select is(public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001'), public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001'), 'same actor key and input return an identical receipt');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000002', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000001')$$, 'PT409', 'Activation operation key already used with different input', 'same key cannot activate a different clinic');
select throws_ok($$select public.vetia_activate_clinic('b4400000-0000-4000-8000-000000000001', '2026-11-06T02:00:00.123456Z', 'b3300000-0000-4000-8000-000000000009')$$, 'PT409', 'Clinic or approval revision is not eligible for activation', 'a new operation cannot activate twice');

reset role;
select ok(exists (
  select 1 from public.clinics c join public.clinic_memberships m on m.clinic_id = c.id
  where c.id = 'b4400000-0000-4000-8000-000000000001' and c.lifecycle_status = 'active' and c.profile_status = 'incomplete'
    and c.publication_status = 'unpublished' and m.user_id = 'b1100000-0000-4000-8000-000000000001'
    and m.role = 'clinic_admin' and m.status = 'active'
), 'activation leaves profile incomplete and publication private');
select is((select count(*)::integer from private.clinic_activation_receipts where clinic_id = 'b4400000-0000-4000-8000-000000000001'), 1, 'exactly one activation receipt');
select is((select count(*)::integer from private.audit_events e join private.clinic_activation_receipts r
  on r.id::text = e.metadata ->> 'receipt_id' and r.operation_id::text = e.metadata ->> 'operation_id'
  where e.entity_id = 'b4400000-0000-4000-8000-000000000001' and e.clinic_id = r.clinic_id and e.actor_user_id = r.actor_user_id
    and e.action = 'clinic.activate'), 1, 'audit is linked exactly once to the activation receipt');
select is((select count(*)::integer from private.audit_events where action = 'clinic.activate' and entity_id = 'b4400000-0000-4000-8000-000000000001'), 1, 'no extra activation audit events');
select ok(exists (
  select 1 from public.clinics c join public.clinic_memberships m on m.clinic_id = c.id
  where c.id = 'b4400000-0000-4000-8000-000000000005' and c.lifecycle_status = 'pending_activation' and m.status = 'pending'
) and not exists (select 1 from private.clinic_activation_receipts where clinic_id = 'b4400000-0000-4000-8000-000000000005')
  and not exists (select 1 from private.audit_events where entity_id = 'b4400000-0000-4000-8000-000000000005'), 'audit failure rolls back both transitions and the receipt');
select ok(exists (select 1 from public.clinic_memberships
  where clinic_id = 'b4400000-0000-4000-8000-000000000003' and user_id = 'b1100000-0000-4000-8000-000000000003' and status = 'pending'), 'wrong membership stays pending');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', 'b1100000-0000-4000-8000-000000000003', 'role', 'authenticated',
  'aal', 'aal2', 'session_id', 'b5500000-0000-4000-8000-000000000003', 'exp', floor(extract(epoch from clock_timestamp())) + (3600), 'amr', jsonb_build_array(jsonb_build_object('method','totp',
    'timestamp', floor(extract(epoch from clock_timestamp())) - 0)))::text, true);
select is((select count(*)::integer from public.clinic_memberships where clinic_id = 'b4400000-0000-4000-8000-000000000001'), 0, 'different tenant cannot see activated membership');

select * from finish();
rollback;
