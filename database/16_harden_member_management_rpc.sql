-- Phase 11 stabilization: harden member-management RPCs against ambiguous-column errors
-- Run once after database/14_member_reviewer_workflow.sql and database/15_fix_member_email_rpc.sql if already applied.
-- This migration replaces only the member-management RPC functions.
-- It does not delete data, change membership rows, or alter core tables.
--
-- Why this migration exists:
-- Earlier RPC versions used RETURNS TABLE, which creates output variables such as
-- organization_id, user_id, role, and email inside PL/pgSQL. Those names can conflict
-- with table column names in INSERT/UPDATE/ON CONFLICT/RETURN QUERY statements.
-- This version returns JSONB and fully qualifies all table columns with aliases.

begin;

-- Drop first because PostgreSQL cannot change a function return type with CREATE OR REPLACE.
drop function if exists public.get_organization_members(uuid);
drop function if exists public.add_organization_member_by_email(uuid, text, text);
drop function if exists public.update_organization_member_role(uuid, uuid, text);
drop function if exists public.remove_organization_member(uuid, uuid);

-- Keep this helper explicit and alias-safe.
create or replace function public.has_org_role(
  p_organization_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.role = any(p_roles)
  );
$$;

create or replace function public.get_organization_members(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_members jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.is_org_member(p_organization_id) then
    raise exception 'You do not have access to this workspace.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'membership_id', ranked_members.membership_id,
        'organization_id', ranked_members.organization_id,
        'user_id', ranked_members.user_id,
        'role', ranked_members.role,
        'email', ranked_members.email,
        'full_name', ranked_members.full_name,
        'created_at', ranked_members.created_at
      )
      order by ranked_members.role_rank asc, ranked_members.created_at asc
    ),
    '[]'::jsonb
  )
  into v_members
  from (
    select
      om.id as membership_id,
      om.organization_id as organization_id,
      om.user_id as user_id,
      om.role as role,
      pr.email as email,
      pr.full_name as full_name,
      om.created_at as created_at,
      case om.role
        when 'admin' then 1
        when 'coordinator' then 2
        when 'reviewer' then 3
        else 4
      end as role_rank
    from public.organization_members as om
    left join public.profiles as pr
      on pr.id = om.user_id
    where om.organization_id = p_organization_id
  ) as ranked_members;

  return v_members;
end;
$$;

create or replace function public.add_organization_member_by_email(
  p_organization_id uuid,
  p_email text,
  p_role text default 'reviewer'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_email text := lower(trim(coalesce(p_email, '')));
  v_clean_role text := lower(trim(coalesce(p_role, 'reviewer')));
  v_target_user_id uuid;
  v_existing_membership_id uuid;
  v_saved_membership_id uuid;
  v_member jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.has_org_role(p_organization_id, array['admin']) then
    raise exception 'Only workspace admins can add members.';
  end if;

  if v_clean_email = '' then
    raise exception 'Member email is required.';
  end if;

  if v_clean_role not in ('admin', 'coordinator', 'reviewer') then
    raise exception 'Invalid workspace role.';
  end if;

  select pr.id
  into v_target_user_id
  from public.profiles as pr
  where lower(coalesce(pr.email, '')) = v_clean_email
  limit 1;

  if v_target_user_id is null then
    raise exception 'No signed-up user was found for this email. Ask the person to sign up first, then add them again.';
  end if;

  select om.id
  into v_existing_membership_id
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.user_id = v_target_user_id
  limit 1;

  if v_existing_membership_id is not null then
    if v_target_user_id = auth.uid() then
      raise exception 'You are already a member of this workspace.';
    end if;

    update public.organization_members as om
    set role = v_clean_role
    where om.id = v_existing_membership_id
      and om.organization_id = p_organization_id
    returning om.id into v_saved_membership_id;
  else
    insert into public.organization_members (
      organization_id,
      user_id,
      role
    )
    values (
      p_organization_id,
      v_target_user_id,
      v_clean_role
    )
    returning id into v_saved_membership_id;
  end if;

  select jsonb_build_object(
    'membership_id', om.id,
    'organization_id', om.organization_id,
    'user_id', om.user_id,
    'role', om.role,
    'email', pr.email,
    'full_name', pr.full_name,
    'created_at', om.created_at
  )
  into v_member
  from public.organization_members as om
  left join public.profiles as pr
    on pr.id = om.user_id
  where om.id = v_saved_membership_id
    and om.organization_id = p_organization_id;

  return v_member;
end;
$$;

create or replace function public.update_organization_member_role(
  p_organization_id uuid,
  p_membership_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_role text := lower(trim(coalesce(p_role, 'reviewer')));
  v_target_user_id uuid;
  v_current_role text;
  v_admin_count integer;
  v_member jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.has_org_role(p_organization_id, array['admin']) then
    raise exception 'Only workspace admins can update member roles.';
  end if;

  if v_clean_role not in ('admin', 'coordinator', 'reviewer') then
    raise exception 'Invalid workspace role.';
  end if;

  select om.user_id, om.role
  into v_target_user_id, v_current_role
  from public.organization_members as om
  where om.id = p_membership_id
    and om.organization_id = p_organization_id
  limit 1;

  if v_target_user_id is null then
    raise exception 'Workspace member was not found.';
  end if;

  if v_target_user_id = auth.uid() then
    raise exception 'You cannot change your own workspace role here.';
  end if;

  if v_current_role = 'admin' and v_clean_role <> 'admin' then
    select count(*)
    into v_admin_count
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.role = 'admin';

    if v_admin_count <= 1 then
      raise exception 'Keep at least one admin in the workspace.';
    end if;
  end if;

  update public.organization_members as om
  set role = v_clean_role
  where om.id = p_membership_id
    and om.organization_id = p_organization_id;

  select jsonb_build_object(
    'membership_id', om.id,
    'organization_id', om.organization_id,
    'user_id', om.user_id,
    'role', om.role,
    'email', pr.email,
    'full_name', pr.full_name,
    'created_at', om.created_at
  )
  into v_member
  from public.organization_members as om
  left join public.profiles as pr
    on pr.id = om.user_id
  where om.id = p_membership_id
    and om.organization_id = p_organization_id;

  return v_member;
end;
$$;

create or replace function public.remove_organization_member(
  p_organization_id uuid,
  p_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user_id uuid;
  v_target_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.has_org_role(p_organization_id, array['admin']) then
    raise exception 'Only workspace admins can remove members.';
  end if;

  select om.user_id, om.role
  into v_target_user_id, v_target_role
  from public.organization_members as om
  where om.id = p_membership_id
    and om.organization_id = p_organization_id
  limit 1;

  if v_target_user_id is null then
    raise exception 'Workspace member was not found.';
  end if;

  if v_target_user_id = auth.uid() then
    raise exception 'You cannot remove yourself from the workspace.';
  end if;

  if v_target_role = 'admin' then
    raise exception 'Admin members must be changed to another role before removal.';
  end if;

  delete from public.organization_members as om
  where om.id = p_membership_id
    and om.organization_id = p_organization_id;
end;
$$;

grant execute on function public.get_organization_members(uuid) to authenticated;
grant execute on function public.add_organization_member_by_email(uuid, text, text) to authenticated;
grant execute on function public.update_organization_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_organization_member(uuid, uuid) to authenticated;

commit;

-- Optional verification query for SQL Editor after running this migration:
-- select routine_name, data_type
-- from information_schema.routines
-- where routine_schema = 'public'
--   and routine_name in (
--     'get_organization_members',
--     'add_organization_member_by_email',
--     'update_organization_member_role',
--     'remove_organization_member'
--   )
-- order by routine_name;
