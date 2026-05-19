-- Niswarth AI Phase 7A
-- Auth and organization workspace foundation.
-- Run this script before frontend auth integration.
-- It is additive: it does not remove the current demo/public RLS policies yet.

-- 1) User profiles linked to Supabase Auth users.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) NGO/foundation workspaces.
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) User membership in an organization.
-- Roles are stored now, but Phase 7 UI will initially use admin for the first creator.
create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'coordinator', 'reviewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- 4) Organization ownership columns for core workflow tables.
alter table campaigns add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table volunteers add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table field_updates add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table impact_reports add column if not exists organization_id uuid references organizations(id) on delete cascade;

-- 5) Useful indexes for organization-scoped reads.
create index if not exists idx_campaigns_organization_id on campaigns(organization_id);
create index if not exists idx_volunteers_organization_id on volunteers(organization_id);
create index if not exists idx_field_updates_organization_id on field_updates(organization_id);
create index if not exists idx_impact_reports_organization_id on impact_reports(organization_id);
create index if not exists idx_organization_members_user_id on organization_members(user_id);
create index if not exists idx_organization_members_org_id on organization_members(organization_id);

-- 6) Backfill old demo records into a legacy workspace.
-- This keeps existing records structurally valid while we transition to authenticated workspaces.
do $$
declare
  legacy_org_id uuid := '00000000-0000-4000-8000-000000000001';
begin
  insert into organizations (id, name, city, created_by)
  values (legacy_org_id, 'Legacy Demo Workspace', 'Demo', null)
  on conflict (id) do nothing;

  update campaigns
  set organization_id = legacy_org_id
  where organization_id is null;

  update volunteers
  set organization_id = legacy_org_id
  where organization_id is null;

  update field_updates fu
  set organization_id = c.organization_id
  from campaigns c
  where fu.campaign_id = c.id
    and fu.organization_id is null;

  update impact_reports ir
  set organization_id = c.organization_id
  from campaigns c
  where ir.campaign_id = c.id
    and ir.organization_id is null;
end $$;

-- 7) Updated-at trigger helper.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row execute function public.set_updated_at();

drop trigger if exists organizations_set_updated_at on organizations;
create trigger organizations_set_updated_at
before update on organizations
for each row execute function public.set_updated_at();

-- 8) Create a profile automatically when a Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 9) Membership helper used later by RLS policies.
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.current_user_organization_ids()
returns table (organization_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select om.organization_id
  from public.organization_members om
  where om.user_id = auth.uid();
$$;

-- 10) Starter data for a newly created NGO workspace.
create or replace function public.seed_organization_starter_data(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  education_campaign_id uuid;
  animal_campaign_id uuid;
  environment_campaign_id uuid;
  volunteer_1_id uuid;
  volunteer_2_id uuid;
  volunteer_3_id uuid;
begin
  insert into campaigns (organization_id, title, type, location, status, goal, start_date, end_date)
  values
    (p_organization_id, 'Weekend Learning Support', 'education', 'Pune', 'active', 'Support children with weekend learning sessions and stationery distribution.', current_date, current_date + interval '30 days'),
    (p_organization_id, 'Stray Care Drive', 'animal_welfare', 'Jaipur', 'active', 'Coordinate feeding, vaccination notes, and rescue follow-ups for stray animals.', current_date, current_date + interval '21 days'),
    (p_organization_id, 'Tree Plantation Drive', 'environment', 'Goa', 'planning', 'Plan plantation activity, volunteer assignment, and participation tracking.', current_date + interval '7 days', current_date + interval '45 days')
  returning id into education_campaign_id;

  -- The RETURNING clause above returns only the last row in some PostgreSQL contexts.
  -- Re-select explicitly to keep the function deterministic.
  select id into education_campaign_id
  from campaigns
  where organization_id = p_organization_id and title = 'Weekend Learning Support'
  order by created_at desc
  limit 1;

  select id into animal_campaign_id
  from campaigns
  where organization_id = p_organization_id and title = 'Stray Care Drive'
  order by created_at desc
  limit 1;

  select id into environment_campaign_id
  from campaigns
  where organization_id = p_organization_id and title = 'Tree Plantation Drive'
  order by created_at desc
  limit 1;

  insert into volunteers (organization_id, name, role, city, availability)
  values
    (p_organization_id, 'Aarav Mehta', 'Volunteer Lead', 'Pune', 'available'),
    (p_organization_id, 'Riya Sharma', 'Field Coordinator', 'Jaipur', 'available'),
    (p_organization_id, 'Kabir Rao', 'Documentation Volunteer', 'Goa', 'limited')
  returning id into volunteer_1_id;

  select id into volunteer_1_id from volunteers where organization_id = p_organization_id and name = 'Aarav Mehta' order by created_at desc limit 1;
  select id into volunteer_2_id from volunteers where organization_id = p_organization_id and name = 'Riya Sharma' order by created_at desc limit 1;
  select id into volunteer_3_id from volunteers where organization_id = p_organization_id and name = 'Kabir Rao' order by created_at desc limit 1;

  insert into campaign_volunteers (campaign_id, volunteer_id, assignment_role)
  values
    (education_campaign_id, volunteer_1_id, 'Session Lead'),
    (animal_campaign_id, volunteer_2_id, 'Field Coordinator'),
    (environment_campaign_id, volunteer_3_id, 'Documentation')
  on conflict (campaign_id, volunteer_id) do nothing;

  insert into field_updates (organization_id, campaign_id, update_text, location, submitted_by, evidence_type)
  values
    (p_organization_id, education_campaign_id, '32 students attended the weekend learning session.', 'Pune', 'Aarav Mehta', 'text'),
    (p_organization_id, education_campaign_id, 'Stationery kits were distributed to students who needed learning material.', 'Pune', 'Aarav Mehta', 'text'),
    (p_organization_id, animal_campaign_id, 'Food packets were distributed across two feeding points.', 'Jaipur', 'Riya Sharma', 'text'),
    (p_organization_id, environment_campaign_id, 'Plantation site mapping has been completed for the first activity.', 'Goa', 'Kabir Rao', 'text');
end;
$$;

-- 11) RPC used by the frontend workspace setup screen.
create or replace function public.create_workspace_with_starter_data(
  p_name text,
  p_city text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  clean_name text := trim(coalesce(p_name, ''));
  clean_city text := nullif(trim(coalesce(p_city, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication required to create a workspace.';
  end if;

  if length(clean_name) < 2 then
    raise exception 'Organization name is required.';
  end if;

  insert into public.profiles (id, email)
  values (auth.uid(), auth.email())
  on conflict (id) do nothing;

  insert into public.organizations (name, city, created_by)
  values (clean_name, clean_city, auth.uid())
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'admin')
  on conflict (organization_id, user_id) do nothing;

  perform public.seed_organization_starter_data(new_org_id);

  return new_org_id;
end;
$$;

-- 12) Grants for authenticated app users.
grant usage on schema public to authenticated;
grant select, insert, update on profiles to authenticated;
grant select, insert, update on organizations to authenticated;
grant select, insert, update on organization_members to authenticated;
grant execute on function public.create_workspace_with_starter_data(text, text) to authenticated;
grant execute on function public.current_user_organization_ids() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
