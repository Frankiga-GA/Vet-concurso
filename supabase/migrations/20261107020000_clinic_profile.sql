begin;

alter table public.clinics
  add column services text[] not null default '{}',
  add column opening_hours jsonb not null default '[]',
  add column profile_revision integer not null default 0 check (profile_revision >= 0);

create function private.clinic_profile_snapshot(p_clinic public.clinics)
returns jsonb language sql stable security invoker
set search_path = pg_catalog, pg_temp
as $$
  select jsonb_build_object(
    'name', p_clinic.name, 'address', p_clinic.address, 'city', p_clinic.city,
    'phone', p_clinic.phone, 'description', p_clinic.description,
    'services', p_clinic.services, 'hours', p_clinic.opening_hours,
    'revision', p_clinic.profile_revision, 'publication', p_clinic.publication_status,
    'missing', array_remove(array[
      case when char_length(btrim(p_clinic.name)) not between 2 and 120 then 'name' end,
      case when coalesce(char_length(btrim(p_clinic.address)), 0) not between 5 and 200 then 'address' end,
      case when p_clinic.city not in ('Chincha', 'Pisco', 'Ica') then 'city' end,
      case when coalesce(p_clinic.phone, '') !~ '^\+?[0-9]{6,15}$' then 'phone' end,
      case when coalesce(char_length(btrim(p_clinic.description)), 0) not between 10 and 1200 then 'description' end,
      case when cardinality(p_clinic.services) = 0 then 'services' end,
      case when jsonb_array_length(p_clinic.opening_hours) = 0 then 'hours' end
    ], null)
  );
$$;
revoke all on function private.clinic_profile_snapshot(public.clinics) from public, anon, authenticated, service_role;

create function public.vetia_get_clinic_profile(p_clinic_id uuid)
returns jsonb language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select private.clinic_profile_snapshot(c)
  from public.clinics c
  where c.id = p_clinic_id and c.lifecycle_status = 'active'
    and private.has_appointment_session()
    and private.is_clinic_member(c.id, array['clinic_admin']::text[]);
$$;
revoke all on function public.vetia_get_clinic_profile(uuid) from public, anon, authenticated, service_role;
grant execute on function public.vetia_get_clinic_profile(uuid) to authenticated;

create function public.vetia_save_clinic_profile(
  p_clinic_id uuid, p_revision integer, p_name text, p_address text, p_city text,
  p_phone text, p_description text, p_services text[], p_hours jsonb
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_clinic public.clinics%rowtype;
  v_snapshot jsonb;
begin
  if not private.has_appointment_session()
    or not private.is_clinic_member(p_clinic_id, array['clinic_admin']::text[]) then
    raise exception using errcode = '42501', message = 'Clinic profile access denied';
  end if;

  select * into v_clinic from public.clinics
  where id = p_clinic_id and lifecycle_status = 'active' for update;
  if not found then
    raise exception using errcode = '42501', message = 'Clinic profile access denied';
  end if;
  perform 1 from public.clinic_memberships
  where clinic_id = p_clinic_id and user_id = auth.uid()
    and role = 'clinic_admin' and status = 'active' for share;
  if not found or not private.has_appointment_session() then
    raise exception using errcode = '42501', message = 'Clinic profile access denied';
  end if;
  if v_clinic.publication_status = 'published' or v_clinic.profile_revision is distinct from p_revision then
    raise exception using errcode = 'PT409', message = 'Clinic profile is published or has changed';
  end if;

  if p_name is null or char_length(p_name) not between 2 and 120 or p_name <> btrim(p_name)
    or p_name ~ '[[:cntrl:]]'
    or p_city is null or p_city not in ('Chincha', 'Pisco', 'Ica')
    or (p_address is not null and (char_length(p_address) not between 5 and 200
        or p_address <> btrim(p_address) or p_address ~ '[[:cntrl:]]'))
    or (p_phone is not null and p_phone !~ '^\+?[0-9]{6,15}$')
    or (p_description is not null and (char_length(p_description) not between 10 and 1200
        or p_description <> btrim(p_description) or translate(p_description, chr(10), '') ~ '[[:cntrl:]]'))
    or p_services is null or cardinality(p_services) > 20
    or (cardinality(p_services) > 0 and array_ndims(p_services) <> 1)
    or p_hours is null or jsonb_typeof(p_hours) <> 'array'
  then
    raise exception using errcode = '22023', message = 'Invalid clinic profile';
  end if;
  if exists (select 1 from unnest(p_services) as s(label)
      where label is null or char_length(label) not between 2 and 80
        or label <> btrim(label) or label ~ '[[:cntrl:]]')
    or cardinality(p_services) <> (select count(distinct lower(label)) from unnest(p_services) as s(label))
    or jsonb_array_length(p_hours) > 28
  then
    raise exception using errcode = '22023', message = 'Invalid clinic profile';
  end if;
  if exists (select 1 from jsonb_array_elements(p_hours) as h(slot)
    where jsonb_typeof(slot) <> 'object'
      or not (slot ?& array['day','start','end'])
      or jsonb_typeof(slot->'day') <> 'number'
      or (slot->>'day') !~ '^[1-7]$'
      or jsonb_typeof(slot->'start') <> 'string'
      or jsonb_typeof(slot->'end') <> 'string'
      or (slot->>'start') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or (slot->>'end') !~ '^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$'
      or (slot->>'start') collate "C" >= (slot->>'end') collate "C")
  then
    raise exception using errcode = '22023', message = 'Invalid opening hours';
  end if;
  if exists (select 1 from jsonb_array_elements(p_hours) with ordinality a(slot, n)
    join jsonb_array_elements(p_hours) with ordinality b(slot, n) on a.n < b.n
    where a.slot->>'day' = b.slot->>'day'
      and (a.slot->>'start') collate "C" < (b.slot->>'end') collate "C"
      and (b.slot->>'start') collate "C" < (a.slot->>'end') collate "C")
  then
    raise exception using errcode = '22023', message = 'Overlapping opening hours';
  end if;

  v_clinic.name := p_name;
  v_clinic.address := p_address;
  v_clinic.city := p_city;
  v_clinic.phone := p_phone;
  v_clinic.description := p_description;
  v_clinic.services := p_services;
  v_clinic.opening_hours := (select coalesce(jsonb_agg(
    jsonb_build_object('day', slot->'day', 'start', slot->'start', 'end', slot->'end')
    order by slot->>'day', slot->>'start'), '[]'::jsonb) from jsonb_array_elements(p_hours) h(slot));
  v_snapshot := private.clinic_profile_snapshot(v_clinic);
  update public.clinics set name = v_clinic.name, address = v_clinic.address,
    city = v_clinic.city, phone = v_clinic.phone, description = v_clinic.description,
    services = v_clinic.services, opening_hours = v_clinic.opening_hours,
    profile_revision = v_clinic.profile_revision + 1,
    profile_status = case when jsonb_array_length(v_snapshot->'missing') = 0
      then 'complete'::public.clinic_profile_status else 'incomplete'::public.clinic_profile_status end
  where id = p_clinic_id returning * into v_clinic;
  insert into private.audit_events (actor_user_id, actor_type, clinic_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'user', p_clinic_id, 'clinic.profile_saved', 'clinic', p_clinic_id,
    jsonb_build_object('profile_status', v_clinic.profile_status));
  return private.clinic_profile_snapshot(v_clinic);
end;
$$;
revoke all on function public.vetia_save_clinic_profile(uuid,integer,text,text,text,text,text,text[],jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.vetia_save_clinic_profile(uuid,integer,text,text,text,text,text,text[],jsonb)
  to authenticated;

commit;
