begin;

create function private.can_manage_clinic_records(p_clinic_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select private.has_appointment_session() and exists (
    select 1 from public.clinic_memberships m join public.clinics c on c.id = m.clinic_id
    where m.clinic_id = p_clinic_id and m.user_id = auth.uid() and m.status = 'active'
      and m.role in ('clinic_admin','clinic_staff') and c.lifecycle_status = 'active'
  );
$$;
revoke all on function private.can_manage_clinic_records(uuid) from public, anon, authenticated, service_role;
grant execute on function private.can_manage_clinic_records(uuid) to authenticated;

create function public.vetia_can_manage_clinic_records(p_clinic_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$ select private.can_manage_clinic_records(p_clinic_id); $$;
revoke all on function public.vetia_can_manage_clinic_records(uuid) from public, anon, authenticated, service_role;
grant execute on function public.vetia_can_manage_clinic_records(uuid) to authenticated;

alter policy clinic_clients_select_tenant on public.clinic_clients
  using (private.can_manage_clinic_records(clinic_id));
alter policy clinic_patients_select_tenant on public.clinic_patients
  using (private.can_manage_clinic_records(clinic_id));
drop policy clinic_clients_insert_tenant on public.clinic_clients;
drop policy clinic_clients_update_tenant on public.clinic_clients;
drop policy clinic_patients_insert_tenant on public.clinic_patients;
drop policy clinic_patients_update_tenant on public.clinic_patients;
revoke select, insert, update, delete on public.clinic_clients, public.clinic_patients
  from public, anon, authenticated, service_role;
grant select (clinic_id,id,full_name,phone,email,created_at,updated_at) on public.clinic_clients to authenticated;
grant select (clinic_id,id,clinic_client_id,name,species,breed,sex,birth_date,status,created_at,updated_at)
  on public.clinic_patients to authenticated;
revoke insert (clinic_id, id, full_name, phone, email), update (full_name, phone, email)
  on public.clinic_clients from authenticated;
revoke insert (clinic_id, id, clinic_client_id, name, species, breed, sex, birth_date, status),
  update (name, species, breed, sex, birth_date, status) on public.clinic_patients from authenticated;

create function public.vetia_search_clinic_clients(p_clinic_id uuid, p_query text)
returns table(id uuid, full_name text, phone text)
language sql stable security invoker set search_path = pg_catalog, pg_temp
as $$
  select c.id, c.full_name, c.phone from public.clinic_clients c
  where c.clinic_id = p_clinic_id and char_length(p_query) <= 120
    and (p_query = '' or strpos(lower(c.full_name), lower(p_query)) > 0
      or strpos(c.phone, p_query) > 0 or strpos(lower(c.email), lower(p_query)) > 0
      or exists (select 1 from public.clinic_patients p
        where p.clinic_id = c.clinic_id and p.clinic_client_id = c.id
          and strpos(lower(p.name), lower(p_query)) > 0))
  order by lower(c.full_name), c.id limit 51;
$$;
revoke all on function public.vetia_search_clinic_clients(uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.vetia_search_clinic_clients(uuid,text) to authenticated;

create function private.lock_clinic_records_access(p_clinic_id uuid)
returns void language plpgsql security invoker set search_path = pg_catalog, pg_temp
as $$
begin
  if not private.can_manage_clinic_records(p_clinic_id) then
    raise exception using errcode = '42501', message = 'Clinic records access denied';
  end if;
  -- Serialize duplicate checks and prevent state changes until the insert commits.
  perform 1 from public.clinics where id = p_clinic_id and lifecycle_status = 'active' for update;
  if not found then raise exception using errcode = '42501', message = 'Clinic records access denied'; end if;
  perform 1 from public.clinic_memberships where clinic_id = p_clinic_id and user_id = auth.uid()
    and role in ('clinic_admin','clinic_staff') and status = 'active' for share;
  if not found or not private.has_appointment_session() then
    raise exception using errcode = '42501', message = 'Clinic records access denied';
  end if;
end;
$$;
revoke all on function private.lock_clinic_records_access(uuid) from public, anon, authenticated, service_role;

create function public.vetia_create_clinic_client(p_clinic_id uuid, p_id uuid, p_name text,
  p_phone text, p_email text, p_allow_similar boolean default false)
returns uuid language plpgsql security definer set search_path = pg_catalog, pg_temp
as $$
declare
  v_existing public.clinic_clients%rowtype;
  v_name text := btrim(p_name);
  v_phone text := regexp_replace(btrim(p_phone), '[ ()-]', '', 'g');
  v_email text := nullif(lower(btrim(p_email)), '');
begin
  perform private.lock_clinic_records_access(p_clinic_id);
  if p_id is null or v_name is null or char_length(v_name) not between 2 and 180
    or v_name ~ '[[:cntrl:]]' or v_phone is null or v_phone !~ '^\+?[0-9]{6,15}$'
    or (v_email is not null and (char_length(v_email) > 254
      or v_email !~ '^[^[:space:]@[:cntrl:]]+@[^[:space:]@[:cntrl:]]+\.[^[:space:]@[:cntrl:]]+$'))
  then raise exception using errcode = '22023', message = 'Invalid clinic client'; end if;

  select * into v_existing from public.clinic_clients where clinic_id = p_clinic_id and id = p_id;
  if found then
    if row(v_existing.full_name, v_existing.phone, v_existing.email) is distinct from row(v_name, v_phone, v_email)
    then raise exception using errcode = 'PT409', message = 'Clinic record key already used'; end if;
    return p_id;
  end if;
  if not coalesce(p_allow_similar, false) and exists (
    select 1 from public.clinic_clients where clinic_id = p_clinic_id and lower(full_name) = lower(v_name)
      and regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(v_phone, '[^0-9]', '', 'g')
  ) then raise exception using errcode = 'PT409', message = 'Similar clinic client exists'; end if;

  insert into public.clinic_clients(clinic_id,id,full_name,phone,email)
    values (p_clinic_id,p_id,v_name,v_phone,v_email);
  insert into private.audit_events(actor_user_id,actor_type,clinic_id,action,entity_type,entity_id)
    values (auth.uid(),'user',p_clinic_id,'clinic.client_create','clinic_client',p_id);
  return p_id;
end;
$$;

create function public.vetia_create_clinic_patient(p_clinic_id uuid, p_client_id uuid, p_id uuid,
  p_name text, p_species text, p_breed text, p_sex text, p_birth_date date, p_allow_similar boolean default false)
returns uuid language plpgsql security definer set search_path = pg_catalog, pg_temp
as $$
declare
  v_existing public.clinic_patients%rowtype;
  v_name text := btrim(p_name);
  v_species text := btrim(p_species);
  v_breed text := nullif(btrim(p_breed), '');
begin
  perform private.lock_clinic_records_access(p_clinic_id);
  if p_id is null or v_name is null or char_length(v_name) not between 1 and 120
    or v_species is null or char_length(v_species) not between 2 and 60
    or concat(v_name,v_species,v_breed) ~ '[[:cntrl:]]'
    or char_length(v_breed) > 120 or (p_sex is not null and p_sex not in ('male','female','unknown'))
    or (p_birth_date is not null and (p_birth_date < date '1900-01-01'
      or p_birth_date > (clock_timestamp() at time zone 'America/Lima')::date))
  then raise exception using errcode = '22023', message = 'Invalid clinic patient'; end if;
  if not exists (select 1 from public.clinic_clients where clinic_id = p_clinic_id and id = p_client_id)
  then raise exception using errcode = 'PT404', message = 'Clinic client not found'; end if;

  select * into v_existing from public.clinic_patients where clinic_id = p_clinic_id and id = p_id;
  if found then
    if row(v_existing.clinic_client_id,v_existing.name,v_existing.species,v_existing.breed,v_existing.sex,v_existing.birth_date)
      is distinct from row(p_client_id,v_name,v_species,v_breed,p_sex,p_birth_date)
    then raise exception using errcode = 'PT409', message = 'Clinic record key already used'; end if;
    return p_id;
  end if;
  if not coalesce(p_allow_similar, false) and exists (
    select 1 from public.clinic_patients where clinic_id = p_clinic_id and clinic_client_id = p_client_id
      and lower(name) = lower(v_name) and lower(species) = lower(v_species)
  ) then raise exception using errcode = 'PT409', message = 'Similar clinic patient exists'; end if;

  insert into public.clinic_patients(clinic_id,id,clinic_client_id,name,species,breed,sex,birth_date)
    values (p_clinic_id,p_id,p_client_id,v_name,v_species,v_breed,p_sex,p_birth_date);
  insert into private.audit_events(actor_user_id,actor_type,clinic_id,action,entity_type,entity_id)
    values (auth.uid(),'user',p_clinic_id,'clinic.patient_create','clinic_patient',p_id);
  return p_id;
end;
$$;
revoke all on function public.vetia_create_clinic_client(uuid,uuid,text,text,text,boolean),
  public.vetia_create_clinic_patient(uuid,uuid,uuid,text,text,text,text,date,boolean)
  from public, anon, authenticated, service_role;
grant execute on function public.vetia_create_clinic_client(uuid,uuid,text,text,text,boolean),
  public.vetia_create_clinic_patient(uuid,uuid,uuid,text,text,text,text,date,boolean) to authenticated;

commit;
