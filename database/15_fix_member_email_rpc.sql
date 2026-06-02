-- Phase 11 stabilization: fix member-management RPC ambiguity
-- Run once after database/14_member_reviewer_workflow.sql.
-- This migration replaces only the member RPC functions with alias-safe versions.
-- It does not delete data, change tables, or modify existing memberships.

begin;

create or replace function public.get_organization_members(p_organization_id uuid)
returns table (
  membership_id uuid,
  organization_id uuid,
  user_id uuid,
  role text,
  email text,
  full_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.is_org_member(p_organization_id) then
    raise exception 'You do not have access to this workspace.';
  end if;

  return query
  select
    om.id as membership_id,
    om.organization_id as organization_id,
    om.user_id as user_id,
    om.role as role,
    pr.email as email,
    pr.full_name as full_name,
    om.created_at as created_at
  from public.organization_members as om
  left join public.profiles as pr on pr.id = om.user_id
  where om.organization_id = p_organization_id
  order by
    case om.role when 'admin' then 1 when 'coordinator' then 2 else 3 end,
    om.created_at asc;
end;
$$;

create or replace function public.add_organization_member_by_email(
  p_organization_id uuid,
  p_email text,
  p_role text default 'reviewer'
)
returns table (
  membership_id uuid,
  organization_id uuid,
  user_id uuid,
  role text,
  email text,
  full_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_email text := lower(trim(coalesce(p_email, '')));
  clean_role text := lower(trim(coalesce(p_role, 'reviewer')));
  target_user_id uuid;
  target_email text;
  target_full_name text;
  target_membership_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.has_org_role(p_organization_id, array['admin']) then
    raise exception 'Only workspace admins can add members.';
  end if;

  if clean_email = '' then
    raise exception 'Member email is required.';
  end if;

  if clean_role not in ('admin', 'coordinator', 'reviewer') then
    raise exception 'Invalid workspace role.';
  end if;

  select pr.id, pr.email, pr.full_name
  into target_user_id, target_email, target_full_name
  from public.profiles as pr
  where lower(pr.email) = clean_email
  limit 1;

  if target_user_id is null then
    raise exception 'No signed-up user was found for this email. Ask the person to sign up first, then add them again.';
  end if;

  insert into public.organization_members as om (organization_id, user_id, role)
  values (p_organization_id, target_user_id, clean_role)
  on conflict (organization_id, user_id) do update
  set role = excluded.role
  where om.user_id <> auth.uid()
  returning om.id into target_membership_id;

  if target_membership_id is null then
    select om.id
    into target_membership_id
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.user_id = target_user_id
    limit 1;
  end if;

  return query
  select
    om.id as membership_id,
    om.organization_id as organization_id,
    om.user_id as user_id,
    om.role as role,
    target_email as email,
    target_full_name as full_name,
    om.created_at as created_at
  from public.organization_members as om
  where om.id = target_membership_id;
end;
$$;

create or replace function public.update_organization_member_role(
  p_organization_id uuid,
  p_membership_id uuid,
  p_role text
)
returns table (
  membership_id uuid,
  organization_id uuid,
  user_id uuid,
  role text,
  email text,
  full_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_role text := lower(trim(coalesce(p_role, 'reviewer')));
  target_user_id uuid;
  admin_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.has_org_role(p_organization_id, array['admin']) then
    raise exception 'Only workspace admins can update member roles.';
  end if;

  if clean_role not in ('admin', 'coordinator', 'reviewer') then
    raise exception 'Invalid workspace role.';
  end if;

  select om.user_id
  into target_user_id
  from public.organization_members as om
  where om.id = p_membership_id
    and om.organization_id = p_organization_id;

  if target_user_id is null then
    raise exception 'Workspace member was not found.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot change your own workspace role here.';
  end if;

  if clean_role <> 'admin' then
    select count(*)
    into admin_count
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.role = 'admin';

    if admin_count <= 1 and exists (
      select 1
      from public.organization_members as om
      where om.id = p_membership_id
        and om.organization_id = p_organization_id
        and om.role = 'admin'
    ) then
      raise exception 'Keep at least one admin in the workspace.';
    end if;
  end if;

  update public.organization_members as om
  set role = clean_role
  where om.id = p_membership_id
    and om.organization_id = p_organization_id;

  return query
  select
    om.id as membership_id,
    om.organization_id as organization_id,
    om.user_id as user_id,
    om.role as role,
    pr.email as email,
    pr.full_name as full_name,
    om.created_at as created_at
  from public.organization_members as om
  left join public.profiles as pr on pr.id = om.user_id
  where om.id = p_membership_id
    and om.organization_id = p_organization_id;
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
  target_user_id uuid;
  target_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.has_org_role(p_organization_id, array['admin']) then
    raise exception 'Only workspace admins can remove members.';
  end if;

  select om.user_id, om.role
  into target_user_id, target_role
  from public.organization_members as om
  where om.id = p_membership_id
    and om.organization_id = p_organization_id;

  if target_user_id is null then
    raise exception 'Workspace member was not found.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot remove yourself from the workspace.';
  end if;

  if target_role = 'admin' then
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
