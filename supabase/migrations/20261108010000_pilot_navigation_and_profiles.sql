begin;

-- Reuse the directory eligibility view. Only the public profile fields are returned.
create function public.vetia_directory_profiles(p_city text, p_slug text, p_service text)
returns table (
  id uuid, slug text, name text, city text, address text, phone text,
  description text, services text[], hours jsonb
)
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select d.id, d.slug, d.name, d.city, d.address, d.phone, d.description, c.services, c.opening_hours
  from private.public_clinic_directory d
  join public.clinics c on c.id = d.id
  where (p_city is null or d.city = p_city)
    and (p_slug is null or d.slug = p_slug)
    and (nullif(btrim(p_service), '') is null or exists (
      select 1 from unnest(c.services) as s(service)
      where strpos(lower(s.service), lower(btrim(p_service))) > 0
    ))
  order by d.name, d.id;
$$;
revoke all on function public.vetia_directory_profiles(text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.vetia_directory_profiles(text,text,text) to anon, authenticated;

create function public.vetia_my_operational_clinics(p_clinic_id uuid)
returns table (clinic_id uuid, name text, role text)
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select c.id, c.name, m.role::text
  from public.clinic_memberships m
  join public.clinics c on c.id = m.clinic_id
  where m.user_id = auth.uid()
    and (p_clinic_id is null or c.id = p_clinic_id)
    and m.status = 'active'
    and m.role in ('clinic_admin','clinic_staff')
    and c.lifecycle_status = 'active'
    and private.has_appointment_session()
  order by c.name, c.id;
$$;
revoke all on function public.vetia_my_operational_clinics(uuid) from public, anon, authenticated, service_role;
grant execute on function public.vetia_my_operational_clinics(uuid) to authenticated;

create function public.vetia_my_owner_profile()
returns table (full_name text, phone text)
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select o.full_name, o.phone from private.owners o
  where o.user_id = auth.uid() and private.has_appointment_session();
$$;
revoke all on function public.vetia_my_owner_profile() from public, anon, authenticated, service_role;
grant execute on function public.vetia_my_owner_profile() to authenticated;

create function public.vetia_update_my_pet(
  p_pet_id uuid, p_name text, p_species text, p_breed text, p_sex text, p_birth_date date
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_pet_id uuid;
begin
  if not private.has_appointment_session() then
    raise exception using errcode = '42501', message = 'Confirmed session required';
  end if;
  if char_length(btrim(p_breed)) > 120
    or nullif(btrim(p_sex), '') not in ('Hembra','Macho') then
    raise exception using errcode = '22023', message = 'Invalid pet details';
  end if;

  update private.pets p set name = btrim(p_name), species = btrim(p_species),
    breed = nullif(btrim(p_breed), ''), sex = nullif(btrim(p_sex), ''), birth_date = p_birth_date
  from private.owners o
  where p.id = p_pet_id and o.id = p.owner_id and o.user_id = auth.uid()
  returning p.id into v_pet_id;

  if v_pet_id is null then
    raise exception using errcode = 'PT404', message = 'Pet not found';
  end if;
  return v_pet_id;
end;
$$;
revoke all on function public.vetia_update_my_pet(uuid,text,text,text,text,date) from public, anon, authenticated, service_role;
grant execute on function public.vetia_update_my_pet(uuid,text,text,text,text,date) to authenticated;

commit;
