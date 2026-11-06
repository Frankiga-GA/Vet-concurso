begin;
select plan(24);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'clinic_applications', 'applications table exists');
select has_table('public', 'clinics', 'clinics table exists');
select has_table('public', 'clinic_memberships', 'memberships table exists');
select has_table('public', 'clinic_clients', 'clinic clients table exists');
select has_table('public', 'clinic_patients', 'clinic patients table exists');
select has_pk('public', 'clinic_clients', array['clinic_id', 'id'], 'clinic clients have tenant composite primary key');
select has_pk('public', 'clinic_patients', array['clinic_id', 'id'], 'clinic patients have tenant composite primary key');
select has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE', 'authenticated can edit profile display name');
select isnt(has_column_privilege('authenticated', 'public.profiles', 'user_id', 'UPDATE'), true, 'authenticated cannot edit profile identity');
select isnt(has_table_privilege('authenticated', 'private.owners', 'SELECT'), true, 'authenticated has no direct owners table access');
select isnt(has_table_privilege('authenticated', 'private.pets', 'SELECT'), true, 'authenticated has no direct pets table access');
select isnt(has_table_privilege('anon', 'private.outbox_events', 'SELECT'), true, 'anonymous has no outbox access');
select isnt(has_function_privilege('anon', 'public.vetia_is_platform_admin()', 'EXECUTE'), true, 'anonymous cannot inspect admin membership');

-- Create isolated fixtures as the migration/test owner, then exercise actual RLS.
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'clinic-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'clinic-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'admin@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb);

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
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.clinic_clients), 1, 'clinic A sees only its client row');
select is((select count(*)::integer from public.clinic_clients where clinic_id = '40000000-0000-4000-8000-000000000002'), 0, 'clinic A cannot read clinic B by identifier');
select throws_ok('select * from private.owners', '42501', null, 'authenticated cannot query private owners directly');
select is((select count(*)::integer from public.vetia_list_my_pets()), 1, 'owner RPC returns own global pets');
select throws_ok(
  $$insert into public.clinic_clients (clinic_id,id,full_name,phone)
    values ('40000000-0000-4000-8000-000000000002',gen_random_uuid(),'Cross tenant','999000000')$$,
  '42501', null, 'clinic A cannot insert a row into clinic B');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.clinic_clients), 1, 'clinic B sees only its client row');
select is((select count(*)::integer from public.vetia_list_my_pets()), 0, 'owner B cannot read owner A pets through RPC');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.clinic_memberships), 0, 'superadmin at AAL1 receives no global membership rows');
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal2"}', true);
select is((select count(*)::integer from public.clinic_memberships), 2, 'superadmin at AAL2 can read authorized membership administration');

select * from finish();
rollback;
