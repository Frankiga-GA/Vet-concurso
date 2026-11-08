begin;
select plan(36);
insert into private.appointment_intake_key (key_digest)
values (sha256(convert_to(repeat('a',64),'UTF8')))
on conflict (singleton) do update set key_digest=excluded.key_digest;

insert into auth.users (id,aud,role,email,email_confirmed_at) values
  ('c1100000-0000-4000-8000-000000000001','authenticated','authenticated','appt-fixture-1@example.test',now()),
  ('c1100000-0000-4000-8000-000000000002','authenticated','authenticated','appt-fixture-2@example.test',now()),
  ('c1100000-0000-4000-8000-000000000003','authenticated','authenticated','appt-fixture-3@example.test',now()),
  ('c1100000-0000-4000-8000-000000000004','authenticated','authenticated','appt-fixture-4@example.test',now());
insert into auth.sessions (id,user_id) values ('c5500000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000001'),('c5500000-0000-4000-8000-000000000002','c1100000-0000-4000-8000-000000000002'),('c5500000-0000-4000-8000-000000000003','c1100000-0000-4000-8000-000000000003'),('c5500000-0000-4000-8000-000000000004','c1100000-0000-4000-8000-000000000004');
insert into public.clinic_applications (id,applicant_user_id,business_name,city,contact_name,contact_email,contact_phone,submission_status,reviewed_at)
values ('c2200000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000001','Clinic 1','Chincha','Private applicant','not-public-1@example.test','999111222','approved',now()),
       ('c2200000-0000-4000-8000-000000000002','c1100000-0000-4000-8000-000000000002','Clinic 2','Ica','Private applicant','not-public-2@example.test','999111222','approved',now()),
       ('c2200000-0000-4000-8000-000000000003','c1100000-0000-4000-8000-000000000001','Clinic 3','Chincha','Private applicant','not-public-3@example.test','999111222','approved',now()),
       ('c2200000-0000-4000-8000-000000000004','c1100000-0000-4000-8000-000000000001','Clinic 4','Chincha','Private applicant','not-public-4@example.test','999111222','approved',now()),
       ('c2200000-0000-4000-8000-000000000005','c1100000-0000-4000-8000-000000000001','Clinic 5','Chincha','Private applicant','not-public-5@example.test','999111222','submitted',null);
insert into public.clinics (id,application_id,slug,name,city,address,phone,approved_at,lifecycle_status,profile_status,publication_status)
values ('c4400000-0000-4000-8000-000000000001','c2200000-0000-4000-8000-000000000001','appt-fixture-1','Clinic 1','Chincha','Public address','555111222',now(),'active','complete','published'),
       ('c4400000-0000-4000-8000-000000000002','c2200000-0000-4000-8000-000000000002','appt-fixture-2','Clinic 2','Ica','Public address','555111222',now(),'active','complete','published'),
       ('c4400000-0000-4000-8000-000000000003','c2200000-0000-4000-8000-000000000003','appt-fixture-3','Clinic 3','Chincha','Public address','555111222',now(),'active','complete','unpublished'),
       ('c4400000-0000-4000-8000-000000000004','c2200000-0000-4000-8000-000000000004','appt-fixture-4','Clinic 4','Chincha','Public address','555111222',now(),'suspended','complete','unpublished'),
       ('c4400000-0000-4000-8000-000000000005','c2200000-0000-4000-8000-000000000005','appt-fixture-5','Clinic 5','Chincha','Public address','555111222',now(),'active','complete','published');
insert into public.clinic_memberships (clinic_id,user_id,role,status) values
  ('c4400000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000001','clinic_admin','active'),('c4400000-0000-4000-8000-000000000002','c1100000-0000-4000-8000-000000000002','clinic_staff','active'),
  ('c4400000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000003','clinic_staff','pending'),('c4400000-0000-4000-8000-000000000004','c1100000-0000-4000-8000-000000000004','clinic_admin','active');

update public.clinics set description = 'Fixture for routine veterinary care',
  services = array['Consulta'], opening_hours = '[{"day":1,"start":"09:00","end":"17:00"}]'
where slug like 'appt-fixture-%';

select ok(not has_table_privilege('anon','public.appointments','SELECT'),'anonymous cannot read appointment table');
select ok(not has_any_column_privilege('authenticated','public.appointments','UPDATE'),'members cannot update appointments directly');
select ok(not has_column_privilege('authenticated','public.appointments','request_key','SELECT'),'intake key for retries is private');
select ok(not has_table_privilege('authenticated','private.appointment_intake_key','SELECT'),'gateway digest is private');
select ok(not has_function_privilege('anon','public.vetia_confirm_appointment(uuid,uuid,timestamptz)','EXECUTE'),'anonymous cannot execute confirmation');
select ok(not has_function_privilege('service_role','public.vetia_request_appointment(text,uuid,uuid,text,text,text,timestamptz)','EXECUTE'),'service role is not the intake gateway');

set local role anon;
select is((select count(*)::integer from public.vetia_public_clinics() d where d.slug like 'appt-fixture-%'),2,'only approved active complete published clinics are visible');
select is((select count(*)::integer from public.vetia_public_clinics('Ica','appt-fixture-2')),1,'filters city and slug');
select ok((select not (to_jsonb(d) ?| array['email','application_id','contact_email','approved_by']) from public.vetia_public_clinics(null,'appt-fixture-1') d),'public projection omits private fields');
select throws_ok($$select * from public.appointments$$,'42501',null,'anon cannot read requests');
select throws_ok($$select public.vetia_request_appointment(repeat('b',64),'c6600000-0000-4000-8000-000000000001','c4400000-0000-4000-8000-000000000001','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz)$$,'42501','Appointment intake unavailable','direct public call cannot bypass gateway');
select throws_ok($$select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000001','c4400000-0000-4000-8000-000000000003','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz)$$,'PT409','Clinic is not accepting public requests','unpublished clinic cannot receive requests');
select throws_ok($$select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000001','c4400000-0000-4000-8000-000000000005','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz)$$,'PT409','Clinic is not accepting public requests','unapproved application cannot receive requests');
select throws_ok($$select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000001','c4400000-0000-4000-8000-000000000001','Owner Fixture','bad-phone','Routine care',(current_date + 2)::timestamptz)$$,'22023','Invalid appointment request','SQL validates contact data');
select throws_ok($$select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000001','c4400000-0000-4000-8000-000000000001','Owner Fixture','+51999999999','Routine care',(now()-interval '1 day'))$$,'22023','Invalid appointment preference','SQL rejects past preference');
select set_config('vetia.test_reference',public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000001','c4400000-0000-4000-8000-000000000001','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz)::text,true);
select is(public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000001','c4400000-0000-4000-8000-000000000001','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz)::text,current_setting('vetia.test_reference'),'same payload and key returns same reference');
select throws_ok($$select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000001','c4400000-0000-4000-8000-000000000002','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz)$$,'PT409','Request key already used','request key cannot be reused for another clinic');
select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000002','c4400000-0000-4000-8000-000000000002','Owner Fixture','+51988888888','Routine care',(current_date + 2)::timestamptz);
select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000003','c4400000-0000-4000-8000-000000000001','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz);
select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000004','c4400000-0000-4000-8000-000000000001','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz);
select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000005','c4400000-0000-4000-8000-000000000001','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz);
select throws_ok($$select public.vetia_request_appointment(repeat('a',64),'c6600000-0000-4000-8000-000000000006','c4400000-0000-4000-8000-000000000001','Owner Fixture','+51999999999','Routine care',(current_date + 2)::timestamptz)$$,'PT429','Appointment intake rate limit reached','fifth request by same phone is rate limited');

reset role;
select set_config('vetia.test_appointment',(select id::text from public.appointments where request_key='c6600000-0000-4000-8000-000000000001'),true);
select set_config('vetia.test_failed_audit',(select id::text from public.appointments where request_key='c6600000-0000-4000-8000-000000000003'),true);
create function private.test_fail_appointment_audit() returns trigger language plpgsql as $$
begin
  if new.action = 'appointment.confirm' and new.entity_id::text = current_setting('vetia.test_failed_audit',true) then
    raise exception 'Injected appointment audit failure';
  end if;
  return new;
end;
$$;
create trigger test_fail_appointment_audit before insert on private.audit_events
for each row execute function private.test_fail_appointment_audit();
set local role authenticated;
select set_config('request.jwt.claim.sub','c1100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims',jsonb_build_object('sub','c1100000-0000-4000-8000-000000000002','session_id','c5500000-0000-4000-8000-000000000002','role','authenticated')::text,true);
select is((select count(*)::integer from public.appointments where clinic_id='c4400000-0000-4000-8000-000000000001'),0,'other clinic cannot read contact or reason');
select is((select count(*)::integer from public.appointments where clinic_id='c4400000-0000-4000-8000-000000000002'),1,'staff can read its own queue');
select throws_ok($$select public.vetia_confirm_appointment('c4400000-0000-4000-8000-000000000001',current_setting('vetia.test_appointment')::uuid,(current_date + 3)::timestamptz)$$,'42501','Clinic membership required','other clinic cannot confirm foreign appointment');
select throws_ok($$select public.vetia_confirm_appointment('c4400000-0000-4000-8000-000000000002',current_setting('vetia.test_appointment')::uuid,(current_date + 3)::timestamptz)$$,'P0002','Appointment not found','foreign ID cannot be paired with own clinic');
select set_config('request.jwt.claim.sub','c1100000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims',jsonb_build_object('sub','c1100000-0000-4000-8000-000000000003','session_id','c5500000-0000-4000-8000-000000000003','role','authenticated')::text,true);
select is((select count(*)::integer from public.appointments where clinic_id='c4400000-0000-4000-8000-000000000001'),0,'pending member cannot read appointments');
select set_config('request.jwt.claim.sub','c1100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims',jsonb_build_object('sub','c1100000-0000-4000-8000-000000000001','session_id','c5500000-0000-4000-8000-000000000009','role','authenticated')::text,true);
select is((select count(*)::integer from public.appointments where clinic_id='c4400000-0000-4000-8000-000000000001'),0,'expired or signed-out session cannot read');
select throws_ok($$select public.vetia_confirm_appointment('c4400000-0000-4000-8000-000000000001',current_setting('vetia.test_appointment')::uuid,(current_date + 3)::timestamptz)$$,'42501','Clinic membership required','signed-out token cannot confirm');
select set_config('request.jwt.claim.sub','c1100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims',jsonb_build_object('sub','c1100000-0000-4000-8000-000000000001','session_id','c5500000-0000-4000-8000-000000000001','role','authenticated')::text,true);
select is((select count(*)::integer from public.appointments where clinic_id='c4400000-0000-4000-8000-000000000001'),4,'clinic sees own requests without duplicates');
select throws_ok($$select public.vetia_confirm_appointment('c4400000-0000-4000-8000-000000000001',current_setting('vetia.test_appointment')::uuid,null)$$,'22023','Invalid agreed time','explicit agreed time required');
select is(public.vetia_confirm_appointment('c4400000-0000-4000-8000-000000000001',current_setting('vetia.test_appointment')::uuid,(current_date + 3)::timestamptz)::text,current_setting('vetia.test_reference'),'own clinic confirms with agreed time');
select is(public.vetia_confirm_appointment('c4400000-0000-4000-8000-000000000001',current_setting('vetia.test_appointment')::uuid,(current_date + 3)::timestamptz)::text,current_setting('vetia.test_reference'),'confirmation replay is idempotent');
select throws_ok($$select public.vetia_confirm_appointment('c4400000-0000-4000-8000-000000000001',current_setting('vetia.test_appointment')::uuid,(current_date + 4)::timestamptz)$$,'PT409','Appointment already confirmed','different time cannot overwrite a confirmation');
select throws_ok($$select public.vetia_confirm_appointment('c4400000-0000-4000-8000-000000000001',current_setting('vetia.test_failed_audit')::uuid,(current_date + 3)::timestamptz)$$,'P0001','Injected appointment audit failure','audit failure aborts confirmation');
select is((select status from public.appointments where id=current_setting('vetia.test_failed_audit')::uuid),'pending','audit failure leaves request pending');
reset role;
select is((select count(*)::integer from private.audit_events where action='appointment.confirm' and entity_id=current_setting('vetia.test_appointment')::uuid),1,'confirmation and replay leave exactly one audit');
select ok(exists (select 1 from public.appointments where id=current_setting('vetia.test_appointment')::uuid and clinic_id='c4400000-0000-4000-8000-000000000001' and agreed_at=(current_date + 3)::timestamptz and confirmed_by='c1100000-0000-4000-8000-000000000001' and confirmed_at is not null and status='confirmed'),'confirmation records who and when with agreed time');
update public.clinics set lifecycle_status='suspended',publication_status='withdrawn'
where id='c4400000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select count(*)::integer from public.appointments where clinic_id='c4400000-0000-4000-8000-000000000001'),0,'suspension hides appointment data despite active membership');
select throws_ok($$select public.vetia_confirm_appointment('c4400000-0000-4000-8000-000000000001',current_setting('vetia.test_failed_audit')::uuid,(current_date + 3)::timestamptz)$$,'42501','Clinic membership required','suspension blocks appointment confirmation');
select * from finish();
rollback;
