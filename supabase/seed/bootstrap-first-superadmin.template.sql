-- Run once by the project owner in the Supabase SQL Editor after creating and
-- confirming the intended Auth user. Replace the placeholder with that exact
-- verified email. Never make this an application endpoint or run it in CI.
begin;
do $bootstrap$
declare
  v_email text := lower(btrim('REPLACE_WITH_CONFIRMED_ADMIN_EMAIL'));
  v_user_id uuid;
begin
  if v_email = 'replace_with_confirmed_admin_email' or position('@' in v_email) < 2 then
    raise exception 'Set the exact confirmed admin email before running this one-time bootstrap';
  end if;
  if exists (select 1 from private.platform_admins) then
    raise exception 'A platform administrator already exists; bootstrap is one-time only';
  end if;
  select id into v_user_id from auth.users
    where lower(email) = v_email and email_confirmed_at is not null;
  if v_user_id is null then
    raise exception 'No confirmed Auth account matches the supplied email';
  end if;
  insert into private.platform_admins (user_id) values (v_user_id);
  insert into private.audit_events (actor_user_id, actor_type, action, entity_type, entity_id, metadata)
    values (null, 'bootstrap', 'platform_admin_bootstrap', 'platform_admin', v_user_id,
      jsonb_build_object('target_user_id', v_user_id));
end;
$bootstrap$;
commit;
