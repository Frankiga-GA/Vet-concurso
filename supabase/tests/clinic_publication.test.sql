begin;
select plan(33);
insert into auth.users(id,aud,role,email,email_confirmed_at) values
  ('a2000000-0000-4000-8000-000000000001','authenticated','authenticated','publication-fixture-1@example.test',now()),
  ('a2000000-0000-4000-8000-000000000002','authenticated','authenticated','publication-fixture-2@example.test',now()),
  ('a2000000-0000-4000-8000-000000000003','authenticated','authenticated','publication-fixture-3@example.test',now());
insert into private.platform_admins(user_id) values ('a2000000-0000-4000-8000-000000000001');
insert into auth.sessions(id,user_id) values ('b2000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000001'),('b2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000002');
insert into public.clinic_applications(id,applicant_user_id,business_name,city,contact_name,contact_email,contact_phone,submission_status,reviewed_at) values
  ('c2000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000002','Publication fixture','Ica','Fixture','publication-fixture@example.test','555123456','approved','2026-11-06T02:00:00Z'),
  ('c2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000002','Publication fixture','Ica','Fixture','publication-fixture@example.test','555123456','approved','2026-11-06T02:00:00Z'),
  ('c2000000-0000-4000-8000-000000000003','a2000000-0000-4000-8000-000000000002','Publication fixture','Ica','Fixture','publication-fixture@example.test','555123456','approved','2026-11-06T02:00:00Z'),
  ('c2000000-0000-4000-8000-000000000004','a2000000-0000-4000-8000-000000000002','Publication fixture','Ica','Fixture','publication-fixture@example.test','555123456','approved','2026-11-06T02:00:00Z'),
  ('c2000000-0000-4000-8000-000000000005','a2000000-0000-4000-8000-000000000002','Publication fixture','Ica','Fixture','publication-fixture@example.test','555123456','approved','2026-11-06T02:00:00Z'),
  ('c2000000-0000-4000-8000-000000000006','a2000000-0000-4000-8000-000000000002','Publication fixture','Ica','Fixture','publication-fixture@example.test','555123456','approved','2026-11-06T02:00:00Z'),
  ('c2000000-0000-4000-8000-000000000007','a2000000-0000-4000-8000-000000000002','Publication fixture','Ica','Fixture','publication-fixture@example.test','555123456','approved','2026-11-06T02:00:00Z');
insert into public.clinics(id,application_id,slug,name,city,approved_at,lifecycle_status,profile_status,address,phone,description,services,opening_hours) values
  ('d2000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000001','publication-fixture-1','Publication fixture','Ica','2026-11-06T02:00:00Z','active','complete','Fixture address','555123456','Fixture veterinary care',array['Consulta'],'[{"day":1,"start":"09:00","end":"17:00"}]'),
  ('d2000000-0000-4000-8000-000000000002','c2000000-0000-4000-8000-000000000002','publication-fixture-2','Publication fixture','Ica','2026-11-06T02:00:00Z','active','complete','Fixture address','555123456','Fixture veterinary care',array['Consulta'],'[]'),
  ('d2000000-0000-4000-8000-000000000003','c2000000-0000-4000-8000-000000000003','publication-fixture-3','Publication fixture','Ica','2026-11-06T02:00:00Z','active','complete','Fixture address','555123456','Fixture veterinary care',array['Consulta'],'[{"day":1,"start":"09:00","end":"17:00"}]'),
  ('d2000000-0000-4000-8000-000000000004','c2000000-0000-4000-8000-000000000004','publication-fixture-4','Publication fixture','Ica','2026-11-06T02:00:00Z','active','complete','Fixture address','555123456','Fixture veterinary care',array['Consulta'],'[{"day":1,"start":"09:00","end":"17:00"}]'),
  ('d2000000-0000-4000-8000-000000000005','c2000000-0000-4000-8000-000000000005','publication-fixture-5','Publication fixture','Ica','2026-11-06T02:00:00Z','active','complete','Fixture address','555123456','Fixture veterinary care',array['Consulta'],'[{"day":1,"start":"09:00","end":"17:00"}]'),
  ('d2000000-0000-4000-8000-000000000006','c2000000-0000-4000-8000-000000000006','publication-fixture-6','Publication fixture','Ica','2026-11-06T02:00:00Z','suspended','complete','Fixture address','555123456','Fixture veterinary care',array['Consulta'],'[{"day":1,"start":"09:00","end":"17:00"}]'),
  ('d2000000-0000-4000-8000-000000000007','c2000000-0000-4000-8000-000000000007','publication-fixture-7','Publication fixture','Ica','2026-11-06T02:00:00Z','active','complete','Fixture address','555123456','Fixture veterinary care',array['Consulta'],'[{"day":1,"start":"09:00","end":"17:00"}]');
insert into public.clinic_memberships(clinic_id,user_id,role,status) values
  ('d2000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000002','clinic_admin','active'),
  ('d2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000002','clinic_admin','active'),
  ('d2000000-0000-4000-8000-000000000003','a2000000-0000-4000-8000-000000000002','clinic_admin','active'),
  ('d2000000-0000-4000-8000-000000000004','a2000000-0000-4000-8000-000000000002','clinic_admin','active'),
  ('d2000000-0000-4000-8000-000000000005','a2000000-0000-4000-8000-000000000002','clinic_admin','active'),
  ('d2000000-0000-4000-8000-000000000006','a2000000-0000-4000-8000-000000000002','clinic_admin','active'),
  ('d2000000-0000-4000-8000-000000000007','a2000000-0000-4000-8000-000000000002','clinic_admin','active');
insert into private.clinic_application_representations(application_id,applicant_user_id,verified_by,evidence_reference,revoked_at) values
  ('c2000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','local-fixture-representation',null),
  ('c2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','local-fixture-representation',null),
  ('c2000000-0000-4000-8000-000000000003','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','local-fixture-representation',now()),
  ('c2000000-0000-4000-8000-000000000004','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','e2e-ficticia-solo-prueba:fixture',null),
  ('c2000000-0000-4000-8000-000000000005','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','local-fixture-representation',null),
  ('c2000000-0000-4000-8000-000000000006','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','local-fixture-representation',null),
  ('c2000000-0000-4000-8000-000000000007','a2000000-0000-4000-8000-000000000003','a2000000-0000-4000-8000-000000000001','local-fixture-representation',null);
insert into private.clinic_activation_receipts(clinic_id,admin_user_id,actor_user_id,operation_id,expected_reviewed_at,activated_at) values
  ('d2000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','2026-11-06T02:00:00Z',now()),
  ('d2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000002','2026-11-06T02:00:00Z',now()),
  ('d2000000-0000-4000-8000-000000000003','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000003','2026-11-06T02:00:00Z',now()),
  ('d2000000-0000-4000-8000-000000000004','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000004','2026-11-06T02:00:00Z',now()),
  ('d2000000-0000-4000-8000-000000000006','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000006','2026-11-06T02:00:00Z',now()),
  ('d2000000-0000-4000-8000-000000000007','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000007','2026-11-06T02:00:00Z',now());

select ok(not has_function_privilege('anon','public.vetia_publish_clinic(uuid,integer,integer,uuid,text)','EXECUTE'),'anonymous cannot publish');
select ok(not has_function_privilege('service_role','public.vetia_withdraw_clinic(uuid,integer,integer,uuid,text)','EXECUTE'),'service role cannot withdraw');
select ok(not has_function_privilege('authenticated','private.decide_clinic_publication(uuid,integer,integer,uuid,text,boolean)','EXECUTE'),'private helper is not callable');
select ok(not has_column_privilege('authenticated','public.clinics','publication_status','UPDATE'),'no direct publication update');
select ok(not has_table_privilege('authenticated','private.clinic_publication_receipts','SELECT'),'receipts are private');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub','a2000000-0000-4000-8000-000000000002','role','authenticated','aal','aal2','session_id','b2000000-0000-4000-8000-000000000002','exp',floor(extract(epoch from clock_timestamp()))+(3600),'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from clock_timestamp()))-(0))))::text,true);
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'42501',null,'common account cannot publish');
select is(public.vetia_get_clinic_publication('c2000000-0000-4000-8000-000000000001'),null::jsonb,'common account cannot read administrative projection');
select set_config('request.jwt.claims',jsonb_build_object('sub','a2000000-0000-4000-8000-000000000001','role','authenticated','aal','aal1','session_id','b2000000-0000-4000-8000-000000000001','exp',floor(extract(epoch from clock_timestamp()))+(3600),'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from clock_timestamp()))-(0))))::text,true);
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'42501',null,'AAL1 cannot publish');
select set_config('request.jwt.claims',jsonb_build_object('sub','a2000000-0000-4000-8000-000000000001','role','authenticated','aal','aal2','session_id','b2000000-0000-4000-8000-000000000001','exp',floor(extract(epoch from clock_timestamp()))+(3600),'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from clock_timestamp()))-(601))))::text,true);
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'42501','Recent TOTP verification required','expired TOTP cannot publish');
select set_config('request.jwt.claims',jsonb_build_object('sub','a2000000-0000-4000-8000-000000000001','role','authenticated','aal','aal2','session_id','b2000000-0000-4000-8000-000000000001','exp',floor(extract(epoch from clock_timestamp()))+(-1),'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from clock_timestamp()))-(0))))::text,true);
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'PT401','Active administrative session required','expired JWT cannot publish');
select set_config('request.jwt.claims',jsonb_build_object('sub','a2000000-0000-4000-8000-000000000001','role','authenticated','aal','aal2','session_id','b2000000-0000-4000-8000-000000000001','exp',floor(extract(epoch from clock_timestamp()))+(3600),'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from clock_timestamp()))-(0))))::text,true);
select is(public.vetia_get_clinic_publication('c2000000-0000-4000-8000-000000000001')->>'publication','unpublished','AAL2 admin sees publication state');
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000002',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'PT409','Clinic profile is not eligible for publication','complete status alone is insufficient');
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000003',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'PT409','Applicant representation is not valid for publication','revoked evidence blocks publication');
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000004',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'PT409','Applicant representation is not valid for publication','known fictional accreditation cannot publish');
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000005',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'PT409','Authorized clinic activation is required','activation receipt is required');
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000006',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'PT409','Clinic profile is not eligible for publication','suspended clinic cannot publish');
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000007',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'PT409','Applicant representation is not valid for publication','different applicant evidence cannot publish');
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',1,0,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'PT409','Clinic publication revision or status changed','stale profile revision cannot publish');
select set_config('vetia.pub_receipt',(public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')->>'receiptId'),true);
select is(public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',0,0,'e2000000-0000-4000-8000-000000000001','Verified test data')->>'receiptId',current_setting('vetia.pub_receipt'),'publish retry returns same receipt');
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',0,0,'e2000000-0000-4000-8000-000000000001','Different reason')$$,'PT409','Publication operation key already used','changed payload with same key rejected');
select throws_ok($$select public.vetia_withdraw_clinic('d2000000-0000-4000-8000-000000000001',0,1,'e2000000-0000-4000-8000-000000000001','Verified test data')$$,'PT409','Publication operation key already used','cannot reuse publish key to withdraw');
select is((select count(*)::integer from public.vetia_public_clinics(null,'publication-fixture-1')),1,'published clinic appears in directory');
reset role;
update private.clinic_application_representations set revoked_at=clock_timestamp() where application_id='c2000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub','a2000000-0000-4000-8000-000000000001','role','authenticated','aal','aal2','session_id','b2000000-0000-4000-8000-000000000001','exp',floor(extract(epoch from clock_timestamp()))+(3600),'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from clock_timestamp()))-(601))))::text,true);
select throws_ok($$select public.vetia_withdraw_clinic('d2000000-0000-4000-8000-000000000001',0,1,'e2000000-0000-4000-8000-000000000002','Verified test data')$$,'42501','Recent TOTP verification required','withdraw also requires recent TOTP');
select set_config('request.jwt.claims',jsonb_build_object('sub','a2000000-0000-4000-8000-000000000001','role','authenticated','aal','aal2','session_id','b2000000-0000-4000-8000-000000000001','exp',floor(extract(epoch from clock_timestamp()))+(3600),'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from clock_timestamp()))-(0))))::text,true);
select is(public.vetia_withdraw_clinic('d2000000-0000-4000-8000-000000000001',0,1,'e2000000-0000-4000-8000-000000000002','Verified test data')->>'publication','withdrawn','withdraw works with revoked representation');
select is(public.vetia_withdraw_clinic('d2000000-0000-4000-8000-000000000001',0,1,'e2000000-0000-4000-8000-000000000002','Verified test data')->>'publicationRevision','2','withdraw retry keeps same revision');
select is((select count(*)::integer from public.vetia_public_clinics(null,'publication-fixture-1')),0,'withdraw immediately hides directory record');
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',0,0,'e2000000-0000-4000-8000-000000000003','Verified test data')$$,'PT409','Clinic publication revision or status changed','stale publication revision cannot republish');
reset role;
select is((select count(*)::integer from private.clinic_publication_receipts where clinic_id='d2000000-0000-4000-8000-000000000001'),2,'one receipt per decision');
select is((select count(*)::integer from private.audit_events e join private.clinic_publication_receipts r on r.id::text=e.metadata->>'receipt_id' and e.clinic_id=r.clinic_id and e.actor_user_id=r.actor_user_id where e.clinic_id='d2000000-0000-4000-8000-000000000001'),2,'one linked audit per decision');
select is((select lifecycle_status::text||'/'||profile_status::text from public.clinics where id='d2000000-0000-4000-8000-000000000001'),'active/complete','decisions preserve lifecycle and profile');
update public.clinics set publication_status='published' where id='d2000000-0000-4000-8000-000000000002';
set local role anon;
select is((select count(*)::integer from public.vetia_public_clinics(null,'publication-fixture-2')),0,'legacy publication flag cannot expose an incomplete profile');
reset role;
create function pg_temp.reject_publication_audit() returns trigger language plpgsql as $$
begin
  if new.action = 'clinic.publish' then raise exception 'Injected publication audit failure'; end if;
  return new;
end;
$$;
create trigger reject_publication_audit before insert on private.audit_events
  for each row execute function pg_temp.reject_publication_audit();
update private.clinic_application_representations set revoked_at=null where application_id='c2000000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select public.vetia_publish_clinic('d2000000-0000-4000-8000-000000000001',0,2,
  'e2000000-0000-4000-8000-000000000003','Verified test data')$$,'P0001','Injected publication audit failure','audit failure aborts publication');
reset role;
select ok((select publication_status='withdrawn' and publication_revision=2 from public.clinics
  where id='d2000000-0000-4000-8000-000000000001')
  and not exists (select 1 from private.clinic_publication_receipts where operation_id='e2000000-0000-4000-8000-000000000003'),
  'audit failure preserves original state and leaves no receipt');
select * from finish();
rollback;
