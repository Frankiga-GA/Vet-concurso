begin;
select plan(39);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'clinic_applications', 'applications table exists');
select has_table('public', 'clinics', 'clinics table exists');
select has_table('public', 'clinic_memberships', 'memberships table exists');
select has_table('public', 'clinic_clients', 'clinic clients table exists');
select has_table('public', 'clinic_patients', 'clinic patients table exists');
select col_is_pk('public', 'clinic_clients', array['clinic_id', 'id']::name[], 'clinic clients have tenant composite primary key');
select col_is_pk('public', 'clinic_patients', array['clinic_id', 'id']::name[], 'clinic patients have tenant composite primary key');
select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'), 'authenticated can edit profile display name');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'user_id', 'UPDATE'), 'authenticated cannot edit profile identity');
select ok(not has_table_privilege('authenticated', 'private.owners', 'SELECT'), 'authenticated has no direct owners table access');
select ok(not has_table_privilege('authenticated', 'private.pets', 'SELECT'), 'authenticated has no direct pets table access');
select ok(not has_table_privilege('anon', 'private.outbox_events', 'SELECT'), 'anonymous has no outbox access');
select ok(not has_function_privilege('anon', 'public.vetia_is_platform_admin()', 'EXECUTE'), 'anonymous cannot inspect admin membership');
select ok(not has_schema_privilege('authenticated', 'private', 'USAGE'), 'authenticated cannot resolve private objects directly');
select ok(has_function_privilege('authenticated', 'private.is_clinic_member(uuid,text[])', 'EXECUTE'), 'policy retains execute privilege on its private helper');
select ok(not has_column_privilege('authenticated', 'public.clinic_applications', 'reviewed_by', 'SELECT'), 'reviewer identity is not granted');
select ok(not has_column_privilege('authenticated', 'public.clinic_patients', 'clinic_client_id', 'UPDATE'), 'patient cannot be reassigned directly');
select ok(not has_table_privilege('authenticated', 'public.clinic_patients', 'SELECT'), 'patient reads use column grants');
select ok(not has_table_privilege('service_role', 'public.clinic_patients', 'SELECT'), 'service role has no general patient table grant');

-- Create isolated fixtures as the migration/test owner, then exercise actual RLS.
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'clinic-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'clinic-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'admin@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb);

insert into auth.sessions(id,user_id) values
  ('90000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002');

insert into public.clinic_applications (id, submission_key, applicant_user_id, business_name, city,
  contact_name, contact_email, contact_phone, submission_status, reviewed_at)
values
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Clínica A', 'Ica', 'Admin A', 'a@example.test', '999111111', 'approved', now()),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Clínica B', 'Pisco', 'Admin B', 'b@example.test', '999222222', 'approved', now());
insert into public.clinics (id, application_id, slug, name, city, lifecycle_status,
  profile_status, publication_status, approved_at)
values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'clinica-a', 'Clínica A', 'Ica', 'active', 'complete', 'published', now()),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'clinica-b', 'Clínica B', 'Pisco', 'active', 'complete', 'published', now());
insert into public.clinic_memberships (clinic_id, user_id, role, status)
values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'clinic_admin', 'active'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'clinic_admin', 'active');
insert into private.platform_admins (user_id) values ('10000000-0000-4000-8000-000000000003');
insert into public.clinic_clients (clinic_id, id, full_name, phone)
values
  ('40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'Cliente A', '999111111'),
  ('40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', 'Cliente B', '999222222');
insert into public.clinic_patients (clinic_id, id, clinic_client_id, name, species)
values ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'Michi A', 'gato');
insert into private.owners (id, user_id, full_name, email)
values ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Propietario A', 'clinic-a@example.test');
insert into private.pets (id, owner_id, name, species)
values ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'Michi', 'gato');

select throws_ok(
  $$insert into public.clinic_patients (clinic_id,id,clinic_client_id,name,species)
    values ('40000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','Cruce','perro')$$,
  '23503', null, 'composite foreign key rejects a patient linked to another clinic client');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1","session_id":"90000000-0000-4000-8000-000000000001"}', true);
select is((select count(*)::integer from public.clinic_clients), 1, 'clinic A sees only its client row');
select is((select count(*)::integer from public.clinic_clients where clinic_id = '40000000-0000-4000-8000-000000000002'), 0, 'clinic A cannot read clinic B by identifier');
select throws_ok('select * from private.owners', '42501', null, 'authenticated cannot query private owners directly');
select is((select count(*)::integer from public.vetia_list_my_pets()), 1, 'owner RPC returns own global pets');
select throws_ok(
  $$insert into public.clinic_clients (clinic_id,id,full_name,phone)
    values ('40000000-0000-4000-8000-000000000002',gen_random_uuid(),'Cross tenant','999000000')$$,
  '42501', null, 'clinic A cannot insert a row into clinic B');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1","session_id":"90000000-0000-4000-8000-000000000002"}', true);
select is((select count(*)::integer from public.clinic_clients), 1, 'clinic B sees only its client row');
select is((select count(*)::integer from public.vetia_list_my_pets()), 0, 'owner B cannot read owner A pets through RPC');
select is((select count(*)::integer from public.clinic_patients), 0, 'clinic B cannot see clinic A patients');

reset role;
update public.clinics set lifecycle_status = 'suspended', publication_status = 'withdrawn'
where id = '40000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1","session_id":"90000000-0000-4000-8000-000000000001"}', true);
select is((select count(*)::integer from public.clinic_memberships), 1, 'member retains access to own membership when clinic is suspended');
select is((select count(*)::integer from public.clinic_clients), 0, 'suspension hides local clients');
select is((select count(*)::integer from public.clinic_patients), 0, 'suspension hides local patients');
select throws_ok(
  $$insert into public.clinic_clients (clinic_id, full_name, phone)
    values ('40000000-0000-4000-8000-000000000001', 'Blocked client', '999000000')$$,
  '42501', null, 'suspension blocks client inserts');
select throws_ok(
  $$insert into public.clinic_patients (clinic_id, clinic_client_id, name, species)
    values ('40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Blocked patient','dog')$$,
  '42501', null, 'suspension blocks patient inserts');
select throws_ok($$update public.clinic_clients set full_name = 'Blocked update'$$,
  '42501', null, 'application roles cannot update client rows directly');
select throws_ok($$update public.clinic_patients set name = 'Blocked update'$$,
  '42501', null, 'application roles cannot update patient rows directly');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select ok(public.vetia_is_platform_admin(), 'AAL1 admin can discover own role for MFA enrollment');
select is((select count(*)::integer from public.clinic_memberships), 0, 'superadmin at AAL1 receives no global membership rows');
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal2"}', true);
select is((select count(*)::integer from public.clinic_memberships), 2, 'superadmin at AAL2 can read authorized membership administration');

select * from finish();
rollback;
