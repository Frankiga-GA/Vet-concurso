begin;

-- Policies keep their existing dependency on this function and its owner.
create or replace function private.is_clinic_member(p_clinic_id uuid, p_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    join public.clinics c on c.id = m.clinic_id
    where m.clinic_id = p_clinic_id
      and c.lifecycle_status = 'active'
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and (p_roles is null or m.role::text = any(p_roles))
  );
$$;

revoke all on function private.is_clinic_member(uuid, text[])
  from public, anon, authenticated, service_role;
grant execute on function private.is_clinic_member(uuid, text[]) to authenticated;

-- Stored policies can invoke the resolved helper without granting schema USAGE.
revoke all on schema private from public, anon, authenticated, service_role;
revoke all on private.platform_admins, private.clinic_invitations,
  private.owners, private.pets, private.owner_client_links, private.clinic_pet_links,
  private.audit_events, private.outbox_events, private.application_reviews
  from public, anon, authenticated, service_role;

-- Preserve authenticated column grants and the record policies established
-- in clinic_records. Remove broad table grants inherited from platform defaults.
revoke all on public.profiles, public.clinic_applications, public.clinics,
  public.clinic_memberships, public.clinic_clients, public.clinic_patients
  from public, anon, service_role;
revoke select on public.clinic_clients, public.clinic_patients from authenticated;
grant select (clinic_id, id, full_name, phone, email, created_at, updated_at)
  on public.clinic_clients to authenticated;
grant select (clinic_id, id, clinic_client_id, name, species, breed, sex, birth_date,
  status, created_at, updated_at) on public.clinic_patients to authenticated;

commit;
