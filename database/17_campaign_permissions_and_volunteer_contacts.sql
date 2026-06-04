-- Phase 13: align campaign permissions with role UX and add volunteer contact fields.
-- Safe to run after Phase 11 member-role migrations.
-- This migration is additive except for replacing campaign RLS policies/check constraints.

begin;

-- Campaign form options used by the app.
alter table public.campaigns drop constraint if exists campaigns_type_check;
alter table public.campaigns
  add constraint campaigns_type_check
  check (type in (
    'education',
    'health',
    'nutrition',
    'animal_welfare',
    'environment',
    'community_development',
    'livelihood',
    'disaster_relief',
    'women_child_welfare',
    'awareness',
    'fundraising',
    'other'
  ));

alter table public.campaigns drop constraint if exists campaigns_status_check;
alter table public.campaigns
  add constraint campaigns_status_check
  check (status in ('planning', 'active', 'paused', 'completed', 'cancelled'));

-- Optional volunteer contact details. These are nullable so existing data remains valid.
alter table public.volunteers add column if not exists phone text;
alter table public.volunteers add column if not exists email text;

create index if not exists idx_volunteers_organization_email
on public.volunteers (organization_id, lower(email))
where email is not null;

-- Keep campaign permissions aligned with the dashboard role model.
-- Coordinators manage execution data, but campaign create/edit/delete stays admin-only.
drop policy if exists "Members can create organization campaigns" on public.campaigns;
drop policy if exists "Members can update organization campaigns" on public.campaigns;
drop policy if exists "Admins and coordinators can create campaigns" on public.campaigns;
drop policy if exists "Admins and coordinators can update campaigns" on public.campaigns;
drop policy if exists "Admins can delete organization campaigns" on public.campaigns;
drop policy if exists "Admins can delete campaigns" on public.campaigns;
drop policy if exists "Admins can create organization campaigns" on public.campaigns;
drop policy if exists "Admins can update organization campaigns" on public.campaigns;
drop policy if exists "Admins can delete organization campaigns" on public.campaigns;

create policy "Admins can create organization campaigns"
on public.campaigns for insert
to authenticated
with check (public.has_org_role(organization_id, array['admin']));

create policy "Admins can update organization campaigns"
on public.campaigns for update
to authenticated
using (public.has_org_role(organization_id, array['admin']))
with check (public.has_org_role(organization_id, array['admin']));

create policy "Admins can delete organization campaigns"
on public.campaigns for delete
to authenticated
using (public.has_org_role(organization_id, array['admin']));

commit;
