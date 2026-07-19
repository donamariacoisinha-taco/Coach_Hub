begin;

-- Authorization data lives outside public.profiles so athletes can update their
-- own training profile without ever being able to grant themselves privileges.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table if not exists public.user_access (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  suspension_reason text,
  suspended_at timestamptz,
  suspended_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint user_access_suspension_state check (
    (status = 'active' and suspended_at is null and suspended_by is null)
    or status = 'suspended'
  )
);

comment on table public.user_access is
  'Server-side source of truth for role, subscription plan and account status.';

-- Preserve the only trusted authorization signal that existed before this
-- migration. Premium had no server-side column and therefore safely defaults
-- to free until an administrator explicitly grants it.
insert into public.user_access (user_id, role, plan, status)
select
  p.id,
  case when coalesce(p.is_admin, false) then 'admin' else 'user' end,
  'free',
  'active'
from public.profiles p
on conflict (user_id) do nothing;

create or replace function private.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_access ua
    where ua.user_id = (select auth.uid())
      and ua.role = 'admin'
      and ua.status = 'active'
  );
$$;

create or replace function private.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_access ua
    where ua.user_id = (select auth.uid())
      and ua.status = 'active'
  );
$$;

revoke all on function private.current_user_is_admin() from public, anon;
revoke all on function private.current_user_is_active() from public, anon;
grant execute on function private.current_user_is_admin() to authenticated, service_role;
grant execute on function private.current_user_is_active() to authenticated, service_role;

-- Keep the legacy helper name for existing RLS policies, but make the private
-- access table its source of truth. This wrapper does not bypass RLS itself.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.current_user_is_admin();
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

alter table public.user_access enable row level security;

drop policy if exists user_access_select on public.user_access;
create policy user_access_select
on public.user_access
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_user_is_admin())
);

-- Direct writes are intentionally not granted. Privileged changes must go
-- through the audited admin_update_user_access RPC below.
revoke insert, update, delete on public.user_access from anon, authenticated;
grant select on public.user_access to authenticated;
grant all on public.user_access to service_role;

create table if not exists public.user_access_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null,
  target_user_id uuid not null,
  previous_access jsonb not null,
  new_access jsonb not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.user_access_audit enable row level security;

drop policy if exists user_access_audit_admin_select on public.user_access_audit;
create policy user_access_audit_admin_select
on public.user_access_audit
for select
to authenticated
using ((select private.current_user_is_admin()));

revoke insert, update, delete on public.user_access_audit from anon, authenticated;
grant select on public.user_access_audit to authenticated;
grant all on public.user_access_audit to service_role;

create or replace function private.ensure_user_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_access (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.ensure_user_access() from public, anon, authenticated;

drop trigger if exists ensure_user_access_after_profile_insert on public.profiles;
create trigger ensure_user_access_after_profile_insert
after insert on public.profiles
for each row execute function private.ensure_user_access();

create or replace function public.admin_update_user_access(
  p_user_id uuid,
  p_role text default null,
  p_plan text default null,
  p_status text default null,
  p_reason text default null
)
returns public.user_access
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_before public.user_access;
  v_after public.user_access;
  v_next_role text;
  v_next_plan text;
  v_next_status text;
  v_active_admins integer;
begin
  if v_actor is null or not private.current_user_is_admin() then
    raise exception 'administrator privileges required' using errcode = '42501';
  end if;

  select * into v_before
  from public.user_access
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'user access record not found' using errcode = 'P0002';
  end if;

  v_next_role := coalesce(p_role, v_before.role);
  v_next_plan := coalesce(p_plan, v_before.plan);
  v_next_status := coalesce(p_status, v_before.status);

  if v_next_role not in ('user', 'admin') then
    raise exception 'invalid role';
  end if;
  if v_next_plan not in ('free', 'premium') then
    raise exception 'invalid plan';
  end if;
  if v_next_status not in ('active', 'suspended') then
    raise exception 'invalid account status';
  end if;

  if p_user_id = v_actor and (v_next_role <> 'admin' or v_next_status <> 'active') then
    raise exception 'administrators cannot demote or suspend their own account';
  end if;

  if v_before.role = 'admin'
     and v_before.status = 'active'
     and (v_next_role <> 'admin' or v_next_status <> 'active') then
    select count(*) into v_active_admins
    from public.user_access
    where role = 'admin' and status = 'active';

    if v_active_admins <= 1 then
      raise exception 'the last active administrator cannot be removed or suspended';
    end if;
  end if;

  update public.user_access
  set
    role = v_next_role,
    plan = v_next_plan,
    status = v_next_status,
    suspension_reason = case when v_next_status = 'suspended' then nullif(trim(p_reason), '') else null end,
    suspended_at = case when v_next_status = 'suspended' then coalesce(suspended_at, now()) else null end,
    suspended_by = case when v_next_status = 'suspended' then v_actor else null end,
    updated_at = now()
  where user_id = p_user_id
  returning * into v_after;

  -- Compatibility mirror only. Authorization never reads this legacy column.
  update public.profiles
  set is_admin = (v_after.role = 'admin'), updated_at = now()
  where id = p_user_id;

  insert into public.user_access_audit (
    actor_user_id,
    target_user_id,
    previous_access,
    new_access,
    reason
  ) values (
    v_actor,
    p_user_id,
    to_jsonb(v_before),
    to_jsonb(v_after),
    nullif(trim(p_reason), '')
  );

  return v_after;
end;
$$;

revoke all on function public.admin_update_user_access(uuid, text, text, text, text) from public, anon;
grant execute on function public.admin_update_user_access(uuid, text, text, text, text) to authenticated, service_role;

-- Existing profile policies were accumulated over several ad-hoc scripts and
-- some still authorize by hard-coded email. Replace them with one policy per
-- operation backed by user_access.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_row.policyname);
  end loop;
end;
$$;

alter table public.profiles enable row level security;

create policy profiles_select
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_is_admin())
);

create policy profiles_insert
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
  and coalesce(is_admin, false) = false
);

create or replace function private.guard_profile_authorization_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.current_user_is_admin()
     and new.is_admin is distinct from old.is_admin then
    raise exception 'authorization fields cannot be changed through profiles'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_profile_authorization_columns() from public, anon, authenticated;

drop trigger if exists guard_profile_authorization_columns_before_update on public.profiles;
create trigger guard_profile_authorization_columns_before_update
before update on public.profiles
for each row execute function private.guard_profile_authorization_columns();

create policy profiles_owner_update
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
);

create policy profiles_admin_update
on public.profiles
for update
to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create policy profiles_admin_delete
on public.profiles
for delete
to authenticated
using ((select private.current_user_is_admin()));

grant select, insert, update, delete on public.profiles to authenticated;

-- Suspension is enforced at the database boundary for every RLS-enabled,
-- user-owned table. The profile/access rows remain readable so the app can
-- render the blocked-account screen and allow sign-out.
do $$
declare
  table_row record;
begin
  for table_row in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity
      and a.attname = 'user_id'
      and not a.attisdropped
      and c.relname not in ('user_access', 'user_access_audit')
  loop
    execute format(
      'drop policy if exists account_must_be_active on %I.%I',
      table_row.schema_name,
      table_row.table_name
    );
    execute format(
      'create policy account_must_be_active on %I.%I as restrictive for all to authenticated using ((select private.current_user_is_active())) with check ((select private.current_user_is_active()))',
      table_row.schema_name,
      table_row.table_name
    );
  end loop;
end;
$$;

-- Trigger-only function: it must not be callable as a public RPC.
revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

commit;
