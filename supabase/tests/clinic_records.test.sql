begin;
select plan(34);
insert into auth.users(id,aud,role,email,email_confirmed_at) values
  ('a3000000-0000-4000-8000-000000000001','authenticated','authenticated','records-fixture-1@example.test',now()),
  ('a3000000-0000-4000-8000-000000000002','authenticated','authenticated','records-fixture-2@example.test',now()),
  ('a3000000-0000-4000-8000-000000000003','authenticated','authenticated','records-fixture-3@example.test',now());
insert into auth.sessions(id,user_id) values
  ('b3000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001'),
  ('b3000000-0000-4000-8000-000000000002','a3000000-0000-4000-8000-000000000002'),
  ('b3000000-0000-4000-8000-000000000003','a3000000-0000-4000-8000-000000000003');
insert into private.platform_admins(user_id) values ('a3000000-0000-4000-8000-000000000003');
insert into public.clinic_applications(id,applicant_user_id,business_name,city,contact_name,contact_email,contact_phone,submission_status,reviewed_at) values
  ('c3000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001','Records fixture','Ica','Fixture','records-fixture@example.test','555123456','approved',now()),
  ('c3000000-0000-4000-8000-000000000002','a3000000-0000-4000-8000-000000000002','Records fixture','Ica','Fixture','records-fixture@example.test','555123456','approved',now());
insert into public.clinics(id,application_id,slug,name,city,approved_at,lifecycle_status) values
  ('d3000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000001','records-fixture-1','Records fixture','Ica',now(),'active'),
  ('d3000000-0000-4000-8000-000000000002','c3000000-0000-4000-8000-000000000002','records-fixture-2','Records fixture','Ica',now(),'active');
insert into public.clinic_memberships(clinic_id,user_id,role,status) values
  ('d3000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001','clinic_staff','active'),
  ('d3000000-0000-4000-8000-000000000002','a3000000-0000-4000-8000-000000000002','clinic_admin','active');

select ok(not has_function_privilege('anon','public.vetia_search_clinic_clients(uuid,text)','EXECUTE'),'anonymous search disabled');
select ok(not has_function_privilege('service_role','public.vetia_create_clinic_client(uuid,uuid,text,text,text,boolean)','EXECUTE'),'service role has no create access');
select ok(not has_any_column_privilege('authenticated','public.clinic_clients','INSERT'),'client insert limited to RPC');
select ok(not has_any_column_privilege('authenticated','public.clinic_patients','UPDATE'),'patient update not exposed');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub','a3000000-0000-4000-8000-000000000001','role','authenticated','aal','aal1','session_id','b3000000-0000-4000-8000-000000000001')::text,true);
select ok(public.vetia_can_manage_clinic_records('d3000000-0000-4000-8000-000000000001'),'clinic staff may manage own records');
select is(public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','Fixture Owner','999 111 222','fixture@example.test',false),'e3000000-0000-4000-8000-000000000001'::uuid,'staff creates own client');
select is(public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','Fixture Owner','999 111 222','fixture@example.test',false),'e3000000-0000-4000-8000-000000000001'::uuid,'client retry returns same record');
select throws_ok($$select public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','Different Owner','999 111 222','fixture@example.test',false)$$,'PT409','Clinic record key already used','changed payload on same ID rejected');
select throws_ok($$select public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000002','fixture owner','999111222','fixture@example.test',false)$$,'PT409','Similar clinic client exists','normalized probable client duplicate warned');
select is(public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000002','Different Owner','999 111 222','fixture@example.test',false),'e3000000-0000-4000-8000-000000000002'::uuid,'shared household phone allowed');
select is(public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000003','fixture owner','999111222','fixture@example.test',true),'e3000000-0000-4000-8000-000000000003'::uuid,'confirmed similar client allowed');
select throws_ok($$select public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000004','Invalid Phone','ABC','fixture@example.test',false)$$,'22023','Invalid clinic client','SQL validates contact format');
select throws_ok($$select public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000002','e3000000-0000-4000-8000-000000000001','Fixture Owner','999 111 222','fixture@example.test',false)$$,'42501','Clinic records access denied','foreign clinic create denied');
select is(public.vetia_create_clinic_patient('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000001','Luna','Gato',null,'female',null,false),'f3000000-0000-4000-8000-000000000001'::uuid,'patient created against local client');
select is(public.vetia_create_clinic_patient('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000001','Luna','Gato',null,'female',null,false),'f3000000-0000-4000-8000-000000000001'::uuid,'patient retry returns same record');
select throws_ok($$select public.vetia_create_clinic_patient('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000002','luna','Gato',null,'female',null,false)$$,'PT409','Similar clinic patient exists','same owner, name and species warned');
select is(public.vetia_create_clinic_patient('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000002','f3000000-0000-4000-8000-000000000002','Luna','Gato',null,'female',null,false),'f3000000-0000-4000-8000-000000000002'::uuid,'same patient name allowed for another client');
select is(public.vetia_create_clinic_patient('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000003','luna','Gato',null,'female',null,true),'f3000000-0000-4000-8000-000000000003'::uuid,'confirmed similar patient allowed');
select throws_ok($$select public.vetia_create_clinic_patient('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000004','Tomorrow','Gato',null,'female',current_date+2,false)$$,'22023','Invalid clinic patient','SQL rejects future birth date');
select is((select count(*)::integer from public.vetia_search_clinic_clients('d3000000-0000-4000-8000-000000000001','Luna')),2,'patient search returns matching owners without duplicates');
select is((select count(*)::integer from public.vetia_search_clinic_clients('d3000000-0000-4000-8000-000000000001','%')),0,'search treats wildcards as literal');
select set_config('request.jwt.claims',jsonb_build_object('sub','a3000000-0000-4000-8000-000000000002','role','authenticated','aal','aal1','session_id','b3000000-0000-4000-8000-000000000002')::text,true);
select is((select count(*)::integer from public.clinic_clients where clinic_id='d3000000-0000-4000-8000-000000000001'),0,'other clinic cannot read direct client API');
select is((select count(*)::integer from public.clinic_patients where clinic_id='d3000000-0000-4000-8000-000000000001'),0,'other clinic cannot read direct patient API');
select is((select count(*)::integer from public.vetia_search_clinic_clients('d3000000-0000-4000-8000-000000000001','Luna')),0,'other clinic cannot search');
select throws_ok($$select public.vetia_create_clinic_patient('d3000000-0000-4000-8000-000000000002','e3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000004','Luna','Gato',null,'female',null,false)$$,'PT404','Clinic client not found','patient cannot attach foreign client');
select is(public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000002','e3000000-0000-4000-8000-000000000001','Fixture Owner','999 111 222','fixture@example.test',false),'e3000000-0000-4000-8000-000000000001'::uuid,'same data permitted in distinct tenant');
select set_config('request.jwt.claims',jsonb_build_object('sub','a3000000-0000-4000-8000-000000000003','role','authenticated','aal','aal2','session_id','b3000000-0000-4000-8000-000000000003')::text,true);
select is((select count(*)::integer from public.clinic_clients),0,'platform role alone cannot access local clinical data');
select set_config('request.jwt.claims',jsonb_build_object('sub','a3000000-0000-4000-8000-000000000001','role','authenticated','aal','aal1','session_id','b3000000-0000-4000-8000-000000000009')::text,true);
select is((select count(*)::integer from public.clinic_clients),0,'missing session hides records');
select throws_ok($$select public.vetia_create_clinic_patient('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000004','Luna','Gato',null,'female',null,false)$$,'42501','Clinic records access denied','missing session cannot create patient');
reset role;
update public.clinic_memberships set status='suspended' where clinic_id='d3000000-0000-4000-8000-000000000001' and user_id='a3000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub','a3000000-0000-4000-8000-000000000001','role','authenticated','aal','aal1','session_id','b3000000-0000-4000-8000-000000000001')::text,true);
select ok(not public.vetia_can_manage_clinic_records('d3000000-0000-4000-8000-000000000001'),'suspended membership cannot access editor');
reset role;
update public.clinic_memberships set status='active' where clinic_id='d3000000-0000-4000-8000-000000000001' and user_id='a3000000-0000-4000-8000-000000000001';
update public.clinics set lifecycle_status='suspended' where id='d3000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub','a3000000-0000-4000-8000-000000000001','role','authenticated','aal','aal1','session_id','b3000000-0000-4000-8000-000000000001')::text,true);
select is((select count(*)::integer from public.vetia_search_clinic_clients('d3000000-0000-4000-8000-000000000001','')),0,'suspended clinic cannot search');
select throws_ok($$select public.vetia_create_clinic_client('d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000004','Fixture Owner','999 111 222','fixture@example.test',false)$$,'42501','Clinic records access denied','suspended clinic cannot create');
reset role;
select is((select count(*)::integer from private.audit_events where clinic_id='d3000000-0000-4000-8000-000000000001' and action in ('clinic.client_create','clinic.patient_create')),6,'only original writes audited');
select ok(not exists (select 1 from private.audit_events where clinic_id in ('d3000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000002') and (metadata <> '{}' or reason is not null)),'audit contains only operational IDs');
select * from finish();
rollback;
