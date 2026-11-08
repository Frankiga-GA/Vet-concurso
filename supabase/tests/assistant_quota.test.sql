begin;
select plan(12);

select ok(not has_table_privilege('anon','private.assistant_gateway','SELECT'),'gateway digest is private');
select ok(not has_table_privilege('authenticated','private.assistant_quota','SELECT'),'quota buckets are private');
select ok(not has_function_privilege('service_role','public.vetia_reserve_assistant_turn(text,text)','EXECUTE'),'service role is not the gateway');
select ok((select relrowsecurity from pg_class where oid='private.assistant_quota'::regclass),'quota table has RLS');

insert into private.assistant_gateway(key_digest) values (sha256(convert_to(repeat('a',64),'UTF8')))
on conflict (singleton) do update set key_digest=excluded.key_digest;
delete from private.assistant_quota where bucket in ('global',repeat('b',64),repeat('c',64));
set local role anon;
select throws_ok($$select public.vetia_reserve_assistant_turn(repeat('0',64),repeat('b',64))$$,
  '42501','Assistant gateway unavailable','direct API call with wrong key rejected');
select throws_ok($$select public.vetia_reserve_assistant_turn(repeat('a',64),'raw-ip')$$,
  '42501','Assistant gateway unavailable','raw IP or invalid bucket rejected');
select ok((select bool_and(public.vetia_reserve_assistant_turn(repeat('a',64),repeat('b',64))) from generate_series(1,6)),
  'six reservations accepted for a bucket');
select is(public.vetia_reserve_assistant_turn(repeat('a',64),repeat('b',64)),false,'seventh reservation blocked');
select is(public.vetia_reserve_assistant_turn(repeat('a',64),repeat('c',64)),true,'distinct bucket can reserve');
reset role;
select is((select used from private.assistant_quota where bucket='global'),7,'rejections do not consume daily allowance');
update private.assistant_quota set used=120 where bucket='global';
set local role anon;
select is(public.vetia_reserve_assistant_turn(repeat('a',64),repeat('c',64)),false,'global ceiling applies across buckets');
reset role;
select is((select used from private.assistant_quota where bucket=repeat('c',64)),1,'global ceiling leaves the bucket unchanged');
select * from finish();
rollback;
