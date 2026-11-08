begin;

create table private.assistant_gateway (
  singleton boolean primary key default true check (singleton),
  key_digest bytea not null check (octet_length(key_digest) = 32)
);
create table private.assistant_quota (
  bucket text not null check (bucket = 'global' or bucket ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  expires_at timestamptz not null check (expires_at > window_start),
  used integer not null check (used between 1 and 120),
  primary key (bucket, window_start)
);
create index assistant_quota_expiry_idx on private.assistant_quota (expires_at);
alter table private.assistant_gateway enable row level security;
alter table private.assistant_quota enable row level security;
revoke all on private.assistant_gateway, private.assistant_quota from public, anon, authenticated, service_role;

create function public.vetia_reserve_assistant_turn(p_gateway_key text, p_bucket text)
returns boolean language plpgsql security definer set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz;
  v_hour timestamptz;
  v_day timestamptz;
begin
  if p_gateway_key is null or p_gateway_key !~ '^[a-f0-9]{64}$'
    or p_bucket is null or p_bucket !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '42501', message = 'Assistant gateway unavailable';
  end if;
  -- The singleton serializes quota reservations across web instances.
  perform 1 from private.assistant_gateway where singleton
    and key_digest = sha256(convert_to(p_gateway_key, 'UTF8')) for update;
  if not found then
    raise exception using errcode = '42501', message = 'Assistant gateway unavailable';
  end if;
  v_now := clock_timestamp();
  v_hour := date_trunc('hour', v_now, 'UTC');
  v_day := date_trunc('day', v_now, 'UTC');
  delete from private.assistant_quota where expires_at <= v_now;
  if exists (select 1 from private.assistant_quota where
      (bucket = 'global' and window_start = v_day and used >= 120)
      or (bucket = p_bucket and window_start = v_hour and used >= 6)) then
    return false;
  end if;
  insert into private.assistant_quota(bucket,window_start,expires_at,used)
    values ('global',v_day,v_day + interval '24 hours',1), (p_bucket,v_hour,v_hour + interval '1 hour',1)
    on conflict (bucket,window_start) do update set used = assistant_quota.used + 1;
  return true;
end;
$$;
revoke all on function public.vetia_reserve_assistant_turn(text,text) from public, anon, authenticated, service_role;
grant execute on function public.vetia_reserve_assistant_turn(text,text) to anon, authenticated;

commit;
