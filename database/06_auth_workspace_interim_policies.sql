-- Niswarth AI Phase 7B
-- Interim policies for auth and workspace setup.
-- Run this after 04_auth_org_foundation.sql and before testing the auth UI.
-- This file is additive and does not remove old public demo policies yet.

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;

-- Profiles: a signed-in user can read and update their own profile.
drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile"
on profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
on profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Organizations: a signed-in user can read organizations they belong to.
drop policy if exists "Members can read organizations" on organizations;
create policy "Members can read organizations"
on organizations for select
to authenticated
using (public.is_org_member(id));

-- Organization members: a signed-in user can read their own memberships.
drop policy if exists "Users can read own memberships" on organization_members;
create policy "Users can read own memberships"
on organization_members for select
to authenticated
using (user_id = auth.uid());

-- Keep grants explicit for authenticated app usage.
grant usage on schema public to authenticated;
grant select, update on profiles to authenticated;
grant select on organizations to authenticated;
grant select on organization_members to authenticated;
grant execute on function public.create_workspace_with_starter_data(text, text) to authenticated;
grant execute on function public.current_user_organization_ids() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
