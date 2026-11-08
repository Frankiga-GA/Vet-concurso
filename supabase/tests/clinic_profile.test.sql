begin;
select plan(26);
insert into auth.users(id,aud,role,email,email_confirmed_at) values
  ('d1000000-0000-4000-8000-000000000001','authenticated','authenticated','profile-fixture-1@example.test',now()),
  ('d1000000-0000-4000-8000-000000000002','authenticated','authenticated','profile-fixture-2@example.test',now()),
  ('d1000000-0000-4000-8000-000000000003','authenticated','authenticated','profile-fixture-3@example.test',now());
insert into auth.sessions(id,user_id) values
  ('b1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000002'),
  ('b1000000-0000-4000-8000-000000000003','d1000000-0000-4000-8000-000000000003');
insert into public.clinic_applications(id,applicant_user_id,business_name,city,contact_name,contact_email,contact_phone,submission_status,reviewed_at) values
  ('e1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','Profile fixture','Ica','Fixture','profile-fixture@example.test','555123456','approved',now()),
  ('e1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000001','Profile fixture','Ica','Fixture','profile-fixture@example.test','555123456','approved',now()),
  ('e1000000-0000-4000-8000-000000000003','d1000000-0000-4000-8000-000000000001','Profile fixture','Ica','Fixture','profile-fixture@example.test','555123456','approved',now()),
  ('e1000000-0000-4000-8000-000000000004','d1000000-0000-4000-8000-000000000001','Profile fixture','Ica','Fixture','profile-fixture@example.test','555123456','approved',now());
insert into public.clinics(id,application_id,slug,name,city,approved_at,lifecycle_status,profile_status,publication_status) values
  ('f1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','profile-fixture-1','Profile fixture','Ica',now(),'active','incomplete','unpublished'),
  ('f1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000002','profile-fixture-2','Profile fixture','Ica',now(),'active','incomplete','unpublished'),
  ('f1000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000003','profile-fixture-3','Profile fixture','Ica',now(),'suspended','incomplete','unpublished'),
  ('f1000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000004','profile-fixture-4','Profile fixture','Ica',now(),'active','complete','published');
insert into public.clinic_memberships(clinic_id,user_id,role,status) values
  ('f1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','clinic_admin','active'),
  ('f1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002','clinic_staff','active'),
  ('f1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000003','clinic_admin','suspended'),
  ('f1000000-0000-4000-8000-000000000003','d1000000-0000-4000-8000-000000000001','clinic_admin','active'),
  ('f1000000-0000-4000-8000-000000000004','d1000000-0000-4000-8000-000000000001','clinic_admin','active');

select ok(not has_function_privilege('anon','public.vetia_get_clinic_profile(uuid)','EXECUTE'),'anon cannot read profile');
select ok(not has_function_privilege('service_role','public.vetia_save_clinic_profile(uuid,integer,text,text,text,text,text,text[],jsonb)','EXECUTE'),'service role cannot save profile');
select ok(not has_any_column_privilege('authenticated','public.clinics','UPDATE'),'no direct update grant');
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub','d1000000-0000-4000-8000-000000000001','role','authenticated','session_id','b1000000-0000-4000-8000-000000000001')::text,true);
select is(public.vetia_get_clinic_profile('f1000000-0000-4000-8000-000000000001')->>'revision','0','admin reads own clinic');
select is(public.vetia_get_clinic_profile('f1000000-0000-4000-8000-000000000002'),null::jsonb,'other tenant profile hidden');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000002',0,'Clínica de prueba',null,'Ica',null,null,'{}','[]')$$,'42501','Clinic profile access denied','other tenant cannot be edited');
select is(jsonb_array_length(public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',0,'Clínica de prueba',null,'Ica',null,null,'{}','[]')->'missing'),5,'draft lists missing fields');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',0,'Clínica de prueba',null,'Ica',null,null,'{}','[]')$$,'PT409','Clinic profile is published or has changed','stale revision cannot overwrite a draft');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',1,'Clínica de prueba',null,'Ica','incorrecto',null,'{}','[]')$$,'22023','Invalid clinic profile','bad phone rejected in database');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',1,'Clínica de prueba',null,'Ica',null,null,array['Consulta','consulta'],'[]')$$,'22023','Invalid clinic profile','duplicate services rejected');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',1,'Clínica de prueba',null,'Ica',null,null,'{}','[{"day":1,"start":"09:00","end":"12:00"},{"day":1,"start":"11:00","end":"18:00"}]')$$,'22023','Overlapping opening hours','overlap rejected');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',1,'Clínica de prueba',null,'Ica',null,null,'{}','[{"day":1,"start":"25:00","end":"18:00"}]')$$,'22023','Invalid opening hours','invalid time rejected');
select is(jsonb_array_length(public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',1,'Clínica de prueba','Dirección ficticia 123','Ica','+51999999999','Atención general veterinaria',array['Consulta'],'[{"day":1,"start":"09:00","end":"12:00"},{"day":1,"start":"12:00","end":"18:00"}]')->'missing'),0,'valid adjacent intervals complete profile');
select set_config('request.jwt.claims', jsonb_build_object('sub','d1000000-0000-4000-8000-000000000002','role','authenticated','session_id','b1000000-0000-4000-8000-000000000002')::text,true);
select is(public.vetia_get_clinic_profile('f1000000-0000-4000-8000-000000000001'),null::jsonb,'staff cannot read editor');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',2,'Clínica de prueba',null,'Ica',null,null,'{}','[]')$$,'42501','Clinic profile access denied','staff cannot save');
select set_config('request.jwt.claims', jsonb_build_object('sub','d1000000-0000-4000-8000-000000000003','role','authenticated','session_id','b1000000-0000-4000-8000-000000000003')::text,true);
select is(public.vetia_get_clinic_profile('f1000000-0000-4000-8000-000000000001'),null::jsonb,'suspended admin cannot read editor');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',2,'Clínica de prueba',null,'Ica',null,null,'{}','[]')$$,'42501','Clinic profile access denied','suspended admin cannot save');
select set_config('request.jwt.claims', jsonb_build_object('sub','d1000000-0000-4000-8000-000000000001','role','authenticated','session_id','b1000000-0000-4000-8000-000000000001')::text,true);
select is(public.vetia_get_clinic_profile('f1000000-0000-4000-8000-000000000003'),null::jsonb,'suspended clinic cannot read editor');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000003',0,'Clínica de prueba',null,'Ica',null,null,'{}','[]')$$,'42501','Clinic profile access denied','suspended clinic cannot save');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000004',0,'Clínica de prueba',null,'Ica',null,null,'{}','[]')$$,'PT409','Clinic profile is published or has changed','published clinic cannot be changed from editor');
reset role;
update public.clinics set lifecycle_status='pending_activation' where id='f1000000-0000-4000-8000-000000000002';
insert into public.clinic_memberships(clinic_id,user_id,role,status)
values ('f1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000001','clinic_admin','active');
set local role authenticated;
select is(public.vetia_get_clinic_profile('f1000000-0000-4000-8000-000000000002'),null::jsonb,'pending activation hides editor even with active membership');
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000002',0,'Clínica de prueba',null,'Ica',null,null,'{}','[]')$$,'42501','Clinic profile access denied','profile edit cannot activate clinic');
select set_config('request.jwt.claims','{"sub":"d1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select throws_ok($$select public.vetia_save_clinic_profile('f1000000-0000-4000-8000-000000000001',2,'Clínica de prueba',null,'Ica',null,null,'{}','[]')$$,'42501','Clinic profile access denied','missing session rejected');
reset role;
select is((select profile_status::text from public.clinics where id='f1000000-0000-4000-8000-000000000001'),'complete','profile status stored');
select is((select lifecycle_status::text || '/' || publication_status::text from public.clinics where id='f1000000-0000-4000-8000-000000000001'),'active/unpublished','save preserves activation and publication');
select is((select count(*)::integer from private.audit_events where clinic_id='f1000000-0000-4000-8000-000000000001' and action='clinic.profile_saved'),2,'only committed edits are audited');
select * from finish();
rollback;
