-- Support Google OAuth metadata while preserving manual registration and strict profile constraints
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_first_name text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'given_name'), '')
  );
  v_last_name text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'family_name'), '')
  );
  v_display_name text := coalesce(
    nullif(concat_ws(' ', v_first_name, v_last_name), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), '')
  );
begin
  -- Validate against profiles table constraints (first_name 2..80, last_name 2..120, display_name max 120)
  if v_first_name is not null and (char_length(v_first_name) < 2 or char_length(v_first_name) > 80) then
    v_first_name := null;
  end if;
  if v_last_name is not null and (char_length(v_last_name) < 2 or char_length(v_last_name) > 120) then
    v_last_name := null;
  end if;
  if v_display_name is not null and char_length(v_display_name) > 120 then
    v_display_name := substr(v_display_name, 1, 120);
  end if;

  insert into public.profiles (user_id, display_name, first_name, last_name)
  values (new.id, v_display_name, v_first_name, v_last_name)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated, service_role;
