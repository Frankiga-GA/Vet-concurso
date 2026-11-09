-- Soporte para modalidad de cuenta: 'mascotas' o 'agro'
-- Permite que los usuarios elijan su enfoque al registrarse y puedan cambiarlo desde su perfil sin perder datos.

begin;

-- 1. Agregar columna account_type a public.profiles
alter table public.profiles
  add column if not exists account_type text not null default 'mascotas',
  drop constraint if exists profiles_account_type_check,
  add constraint profiles_account_type_check check (account_type in ('mascotas', 'agro'));

-- 2. Eliminar funciones anteriores para poder cambiar firma y tipo de retorno
drop function if exists public.vetia_my_profile();
drop function if exists public.vetia_update_my_profile(text, text, text, text);
drop function if exists public.vetia_update_my_profile(text, text, text, text, text);

-- 3. Actualizar función de consulta de perfil
create function public.vetia_my_profile()
returns table (
  first_name text,
  last_name text,
  phone text,
  city text,
  account_type text
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null
  ) then
    raise exception using errcode = '28000', message = 'Confirmed email required';
  end if;

  return query
    select 
      p.first_name,
      p.last_name,
      p.phone,
      p.city,
      coalesce(p.account_type, u.raw_user_meta_data->>'account_type', 'mascotas') as account_type
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    where u.id = auth.uid();
end;
$$;

-- 4. Actualizar función de guardado de perfil con parámetro de modalidad
create function public.vetia_update_my_profile(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_city text,
  p_account_type text default 'mascotas'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_first_name text := nullif(btrim(p_first_name), '');
  v_last_name text := nullif(btrim(p_last_name), '');
  v_phone text := nullif(regexp_replace(btrim(p_phone), '[ ()-]', '', 'g'), '');
  v_city text := nullif(btrim(p_city), '');
  v_account_type text := coalesce(nullif(btrim(p_account_type), ''), 'mascotas');
begin
  if auth.uid() is null or not exists (
    select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null
  ) then
    raise exception using errcode = '28000', message = 'Confirmed email required';
  end if;

  if coalesce(char_length(v_first_name), 0) not between 2 and 80
    or coalesce(char_length(v_last_name), 0) not between 2 and 120
    or v_city not in ('Chincha', 'Pisco', 'Ica')
    or (v_phone is not null and v_phone !~ '^\+?[0-9]{6,15}$')
    or v_account_type not in ('mascotas', 'agro')
  then
    raise exception using errcode = '22023', message = 'Invalid profile details';
  end if;

  insert into public.profiles (user_id, first_name, last_name, display_name, phone, city, account_type)
    values (auth.uid(), v_first_name, v_last_name, v_first_name || ' ' || v_last_name, v_phone, v_city, v_account_type)
  on conflict (user_id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    phone = excluded.phone,
    city = excluded.city,
    account_type = excluded.account_type;

  -- Mantener sincronizado el metadata del usuario en auth
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'account_type', v_account_type,
    'first_name', v_first_name,
    'last_name', v_last_name
  )
  where id = auth.uid();
end;
$$;

revoke all on function public.vetia_my_profile() from public, anon, authenticated, service_role;
revoke all on function public.vetia_update_my_profile(text,text,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.vetia_my_profile() to authenticated;
grant execute on function public.vetia_update_my_profile(text,text,text,text,text) to authenticated;

commit;
