begin;
select plan(13);

insert into auth.users(id,aud,role,email,email_confirmed_at) values
  ('15000000-0000-4000-8000-000000000001','authenticated','authenticated','pilot-navigation-a@example.test',now()),
  ('15000000-0000-4000-8000-000000000002','authenticated','authenticated','pilot-navigation-b@example.test',now());
insert into auth.sessions(id,user_id) values
  ('25000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001'),
  ('25000000-0000-4000-8000-000000000002','15000000-0000-4000-8000-000000000002');
insert into public.clinic_applications(id,applicant_user_id,business_name,city,contact_name,contact_email,contact_phone,submission_status,reviewed_at)
values ('35000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001','VetIA Fixture','Ica','Fixture','contact@example.test','999000001','approved',now());
insert into public.clinics(id,application_id,slug,name,city,address,phone,description,services,opening_hours,lifecycle_status,profile_status,publication_status,approved_at)
values ('45000000-0000-4000-8000-000000000001','35000000-0000-4000-8000-000000000001','pilot-navigation-fixture','VetIA Fixture','Ica','Dirección ficticia','999000001','Clínica ficticia de prueba',
  array['Vacunación'],'[{"day":1,"start":"09:00","end":"18:00"}]','active','complete','published',now());
insert into public.clinic_memberships(clinic_id,user_id,role,status) values
  ('45000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001','clinic_staff','active');
insert into private.owners(id,user_id,full_name,phone,email) values
  ('55000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001','Owner A','999000001','pilot-navigation-a@example.test');
insert into private.pets(id,owner_id,name,species) values
  ('65000000-0000-4000-8000-000000000001','55000000-0000-4000-8000-000000000001','Pet A','Perro');

select ok(not has_function_privilege('anon','public.vetia_my_operational_clinics(uuid)','execute'),'anonymous cannot inspect memberships');
select ok(not has_function_privilege('anon','public.vetia_my_owner_profile()','execute'),'anonymous cannot inspect owner profile');
select ok(not has_function_privilege('service_role','public.vetia_update_my_pet(uuid,text,text,text,text,date)','execute'),'service role has no pet update grant');
set local role anon;
select is((select services[1] from public.vetia_directory_profiles('Ica','pilot-navigation-fixture','VACUN')), 'Vacunación','public service filter uses eligible profile');
select is((select hours->0->>'start' from public.vetia_directory_profiles('Ica','pilot-navigation-fixture',null)), '09:00','public hours are exposed');
select is((select count(*)::int from public.vetia_directory_profiles(null,'pilot-navigation-fixture','%')), 0,'service filter treats wildcard characters literally');
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"15000000-0000-4000-8000-000000000001","session_id":"25000000-0000-4000-8000-000000000001"}',true);
select is((select name from public.vetia_my_operational_clinics('45000000-0000-4000-8000-000000000001')), 'VetIA Fixture','clinic staff can identify their clinic');
select is((select full_name from public.vetia_my_owner_profile()), 'Owner A','owner sees their own profile');
select is(public.vetia_update_my_pet('65000000-0000-4000-8000-000000000001','Pet actualizado','Perro',null,null,null), '65000000-0000-4000-8000-000000000001'::uuid,'owner can update their own pet');
select set_config('request.jwt.claims','{"sub":"15000000-0000-4000-8000-000000000002","session_id":"25000000-0000-4000-8000-000000000002"}',true);
select is((select count(*)::int from public.vetia_my_operational_clinics('45000000-0000-4000-8000-000000000001')), 0,'outsider cannot identify another operational clinic');
select throws_ok($$select public.vetia_update_my_pet('65000000-0000-4000-8000-000000000001','Pet ajeno','Perro',null,null,null)$$, 'PT404', 'Pet not found','another account cannot update a pet');
reset role;
update public.clinics set lifecycle_status='suspended',publication_status='withdrawn' where id='45000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"15000000-0000-4000-8000-000000000001","session_id":"25000000-0000-4000-8000-000000000001"}',true);
select is((select count(*)::int from public.vetia_my_operational_clinics(null)), 0,'suspended clinics are excluded even for staff');
set local role anon;
select is((select count(*)::int from public.vetia_directory_profiles(null,'pilot-navigation-fixture',null)), 0,'withdrawn profile and schedule are no longer public');
reset role;
select * from finish();
rollback;
