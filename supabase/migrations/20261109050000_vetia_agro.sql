-- VetIA Agro: Módulo de gestión para explotaciones y animales de producción (bovinos, porcinos, ovinos, caprinos y aves)
-- Mantiene intacto el sistema de mascotas privadas y clínicas sin interferir en esquemas existentes.

begin;

-- 1. Tabla de explotaciones agropecuarias (predios, establos, granjas, fundos)
create table private.agro_farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references private.owners(id) on delete cascade,
  name text not null,
  holding_type text not null default 'mixto',
  department text not null default 'Ica',
  province text not null default 'Chincha',
  district text not null,
  address_reference text,
  senasa_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agro_farms_name_length check (char_length(name) between 2 and 160),
  constraint agro_farms_holding_type check (holding_type in ('lecheria', 'engorde', 'porcicola', 'avicola', 'ovino_caprino', 'mixto', 'traspatio')),
  constraint agro_farms_province check (province in ('Chincha', 'Pisco', 'Ica', 'Palpa', 'Nasca')),
  constraint agro_farms_district_length check (char_length(district) between 2 and 100),
  constraint agro_farms_senasa_code_length check (senasa_code is null or char_length(senasa_code) <= 50)
);

create index agro_farms_owner_idx on private.agro_farms (owner_id, created_at desc);

-- 2. Tabla de animales individuales y lotes productivos
create table private.agro_herds (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references private.agro_farms(id) on delete cascade,
  species text not null,
  record_type text not null default 'lote',
  identifier text not null,
  head_count integer not null default 1,
  breed text,
  production_purpose text,
  location_in_farm text,
  health_status text not null default 'aparentemente_sano',
  vaccines_applied text,
  deworming_applied text,
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agro_herds_species check (species in ('bovino', 'porcino', 'ovino', 'caprino', 'ave')),
  constraint agro_herds_record_type check (record_type in ('individual', 'lote')),
  constraint agro_herds_identifier_length check (char_length(identifier) between 1 and 120),
  constraint agro_herds_head_count check (head_count >= 1),
  constraint agro_herds_health_status check (health_status in ('aparentemente_sano', 'en_tratamiento', 'en_observacion', 'cuarentena'))
);

create index agro_herds_farm_idx on private.agro_herds (farm_id, created_at desc);

-- 3. Funciones RPC seguras para usuarios autenticados

-- Listar explotaciones del usuario
create function public.vetia_list_my_agro_farms()
returns table (
  id uuid,
  name text,
  holding_type text,
  department text,
  province text,
  district text,
  address_reference text,
  senasa_code text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.name, f.holding_type, f.department, f.province, f.district, f.address_reference, f.senasa_code, f.created_at
  from private.agro_farms f
  join private.owners o on o.id = f.owner_id
  where o.user_id = (select auth.uid())
    and exists (select 1 from auth.users u where u.id = o.user_id and u.email_confirmed_at is not null)
  order by f.created_at desc;
$$;
revoke all on function public.vetia_list_my_agro_farms() from public, anon;
grant execute on function public.vetia_list_my_agro_farms() to authenticated;

-- Crear explotación
create function public.vetia_create_my_agro_farm(
  p_name text,
  p_holding_type text,
  p_province text,
  p_district text,
  p_department text default 'Ica',
  p_address_reference text default null,
  p_senasa_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_farm_id uuid;
begin
  if v_user_id is null or not exists (
    select 1 from auth.users u where u.id = v_user_id and u.email_confirmed_at is not null
  ) then
    raise exception using errcode = '28000', message = 'Confirmed account required';
  end if;

  select o.id into v_owner_id from private.owners o where o.user_id = v_user_id;
  if v_owner_id is null then
    -- Crear perfil de owner automáticamente si aún no existe
    insert into private.owners (user_id, full_name, email)
    select u.id, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), u.email
    from auth.users u
    where u.id = v_user_id
    returning id into v_owner_id;
  end if;

  insert into private.agro_farms (owner_id, name, holding_type, department, province, district, address_reference, senasa_code)
  values (
    v_owner_id,
    btrim(p_name),
    coalesce(nullif(btrim(p_holding_type), ''), 'mixto'),
    coalesce(nullif(btrim(p_department), ''), 'Ica'),
    coalesce(nullif(btrim(p_province), ''), 'Chincha'),
    btrim(p_district),
    nullif(btrim(p_address_reference), ''),
    nullif(btrim(p_senasa_code), '')
  )
  returning id into v_farm_id;

  return v_farm_id;
end;
$$;
revoke all on function public.vetia_create_my_agro_farm(text,text,text,text,text,text,text) from public, anon;
grant execute on function public.vetia_create_my_agro_farm(text,text,text,text,text,text,text) to authenticated;

-- Listar lotes o animales del usuario
create function public.vetia_list_my_agro_herds(p_farm_id uuid default null)
returns table (
  id uuid,
  farm_id uuid,
  farm_name text,
  species text,
  record_type text,
  identifier text,
  head_count integer,
  breed text,
  production_purpose text,
  location_in_farm text,
  health_status text,
  vaccines_applied text,
  deworming_applied text,
  observations text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select 
    h.id, h.farm_id, f.name as farm_name, h.species, h.record_type, h.identifier,
    h.head_count, h.breed, h.production_purpose, h.location_in_farm,
    h.health_status, h.vaccines_applied, h.deworming_applied, h.observations, h.created_at
  from private.agro_herds h
  join private.agro_farms f on f.id = h.farm_id
  join private.owners o on o.id = f.owner_id
  where o.user_id = (select auth.uid())
    and exists (select 1 from auth.users u where u.id = o.user_id and u.email_confirmed_at is not null)
    and (p_farm_id is null or h.farm_id = p_farm_id)
  order by h.created_at desc;
$$;
revoke all on function public.vetia_list_my_agro_herds(uuid) from public, anon;
grant execute on function public.vetia_list_my_agro_herds(uuid) to authenticated;

-- Registrar animal individual o lote
create function public.vetia_create_my_agro_herd(
  p_farm_id uuid,
  p_species text,
  p_identifier text,
  p_head_count integer default 1,
  p_record_type text default 'lote',
  p_breed text default null,
  p_production_purpose text default null,
  p_location_in_farm text default null,
  p_health_status text default 'aparentemente_sano',
  p_vaccines_applied text default null,
  p_deworming_applied text default null,
  p_observations text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_herd_id uuid;
begin
  if v_user_id is null or not exists (
    select 1 from auth.users u where u.id = v_user_id and u.email_confirmed_at is not null
  ) then
    raise exception using errcode = '28000', message = 'Confirmed account required';
  end if;

  -- Validar que la granja pertenezca al usuario
  if not exists (
    select 1
    from private.agro_farms f
    join private.owners o on o.id = f.owner_id
    where f.id = p_farm_id and o.user_id = v_user_id
  ) then
    raise exception using errcode = '42501', message = 'Farm not found or access denied';
  end if;

  insert into private.agro_herds (
    farm_id, species, identifier, head_count, record_type,
    breed, production_purpose, location_in_farm, health_status,
    vaccines_applied, deworming_applied, observations
  ) values (
    p_farm_id,
    btrim(p_species),
    btrim(p_identifier),
    greatest(coalesce(p_head_count, 1), 1),
    coalesce(nullif(btrim(p_record_type), ''), 'lote'),
    nullif(btrim(p_breed), ''),
    nullif(btrim(p_production_purpose), ''),
    nullif(btrim(p_location_in_farm), ''),
    coalesce(nullif(btrim(p_health_status), ''), 'aparentemente_sano'),
    nullif(btrim(p_vaccines_applied), ''),
    nullif(btrim(p_deworming_applied), ''),
    nullif(btrim(p_observations), '')
  )
  returning id into v_herd_id;

  return v_herd_id;
end;
$$;
revoke all on function public.vetia_create_my_agro_herd(uuid,text,text,integer,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.vetia_create_my_agro_herd(uuid,text,text,integer,text,text,text,text,text,text,text,text) to authenticated;

-- Eliminar lote o animal
create function public.vetia_delete_my_agro_herd(p_herd_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not exists (
    select 1 from auth.users u where u.id = v_user_id and u.email_confirmed_at is not null
  ) then
    raise exception using errcode = '28000', message = 'Confirmed account required';
  end if;

  delete from private.agro_herds h
  where h.id = p_herd_id
    and exists (
      select 1
      from private.agro_farms f
      join private.owners o on o.id = f.owner_id
      where f.id = h.farm_id and o.user_id = v_user_id
    );

  return found;
end;
$$;
revoke all on function public.vetia_delete_my_agro_herd(uuid) from public, anon;
grant execute on function public.vetia_delete_my_agro_herd(uuid) to authenticated;

commit;
