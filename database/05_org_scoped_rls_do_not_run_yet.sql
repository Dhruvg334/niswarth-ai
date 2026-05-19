-- Niswarth AI Phase 7 RLS hardening
-- DO NOT RUN THIS FILE YET.
-- Run only after the auth frontend and organization-scoped service layer are working.
-- This replaces the old public demo policies with authenticated organization-scoped access.

-- Required before running:
-- 1) 04_auth_org_foundation.sql has completed successfully.
-- 2) App users can sign up/login.
-- 3) Users can create a workspace.
-- 4) All new campaigns/volunteers/updates/reports are created with organization_id.

-- Remove old demo policies.
drop policy if exists "Allow public read campaigns" on campaigns;
drop policy if exists "Allow public insert campaigns" on campaigns;
drop policy if exists "Allow public read volunteers" on volunteers;
drop policy if exists "Allow public insert volunteers" on volunteers;
drop policy if exists "Allow public read campaign volunteers" on campaign_volunteers;
drop policy if exists "Allow public insert campaign volunteers" on campaign_volunteers;
drop policy if exists "Allow public read field updates" on field_updates;
drop policy if exists "Allow public insert field updates" on field_updates;
drop policy if exists "Allow public read impact reports" on impact_reports;
drop policy if exists "Allow public insert impact reports" on impact_reports;
drop policy if exists "Allow public update impact reports" on impact_reports;

-- Keep RLS enabled.
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table campaigns enable row level security;
alter table volunteers enable row level security;
alter table campaign_volunteers enable row level security;
alter table field_updates enable row level security;
alter table impact_reports enable row level security;

-- Profiles: users can read/update their own profile.
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

-- Organizations: users can access organizations they belong to.
drop policy if exists "Members can read organizations" on organizations;
create policy "Members can read organizations"
on organizations for select
to authenticated
using (public.is_org_member(id));

drop policy if exists "Authenticated users can create organizations" on organizations;
create policy "Authenticated users can create organizations"
on organizations for insert
to authenticated
with check (created_by = auth.uid());

-- Organization members: users can see their own memberships.
drop policy if exists "Users can read own memberships" on organization_members;
create policy "Users can read own memberships"
on organization_members for select
to authenticated
using (user_id = auth.uid() or public.is_org_member(organization_id));

-- Campaigns.
drop policy if exists "Members can read campaigns" on campaigns;
create policy "Members can read campaigns"
on campaigns for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can create campaigns" on campaigns;
create policy "Members can create campaigns"
on campaigns for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "Members can update campaigns" on campaigns;
create policy "Members can update campaigns"
on campaigns for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

-- Volunteers.
drop policy if exists "Members can read volunteers" on volunteers;
create policy "Members can read volunteers"
on volunteers for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can create volunteers" on volunteers;
create policy "Members can create volunteers"
on volunteers for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "Members can update volunteers" on volunteers;
create policy "Members can update volunteers"
on volunteers for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

-- Campaign volunteer assignments.
drop policy if exists "Members can read campaign volunteer assignments" on campaign_volunteers;
create policy "Members can read campaign volunteer assignments"
on campaign_volunteers for select
to authenticated
using (
  exists (
    select 1
    from campaigns c
    where c.id = campaign_volunteers.campaign_id
      and public.is_org_member(c.organization_id)
  )
);

drop policy if exists "Members can create campaign volunteer assignments" on campaign_volunteers;
create policy "Members can create campaign volunteer assignments"
on campaign_volunteers for insert
to authenticated
with check (
  exists (
    select 1
    from campaigns c
    join volunteers v on v.id = campaign_volunteers.volunteer_id
    where c.id = campaign_volunteers.campaign_id
      and c.organization_id = v.organization_id
      and public.is_org_member(c.organization_id)
  )
);

-- Field updates.
drop policy if exists "Members can read field updates" on field_updates;
create policy "Members can read field updates"
on field_updates for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can create field updates" on field_updates;
create policy "Members can create field updates"
on field_updates for insert
to authenticated
with check (public.is_org_member(organization_id));

-- Impact reports.
drop policy if exists "Members can read impact reports" on impact_reports;
create policy "Members can read impact reports"
on impact_reports for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can create impact reports" on impact_reports;
create policy "Members can create impact reports"
on impact_reports for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "Members can update impact reports" on impact_reports;
create policy "Members can update impact reports"
on impact_reports for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));
