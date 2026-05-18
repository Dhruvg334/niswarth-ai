-- Niswarth AI Phase 7B Fix
-- Authenticated core table access for organization-scoped dashboard data.
-- Run after 04_auth_org_foundation.sql, 06_auth_workspace_interim_policies.sql,
-- and 07_fix_workspace_starter_data_function.sql.
-- This file does not remove legacy anon demo policies yet.

-- Explicit grants for authenticated users on core workflow tables.
grant usage on schema public to authenticated;
grant select, insert, update on campaigns to authenticated;
grant select, insert, update on volunteers to authenticated;
grant select, insert, update on field_updates to authenticated;
grant select, insert, update on impact_reports to authenticated;
grant select, insert on campaign_volunteers to authenticated;

-- Campaigns: members can read/create/update campaigns inside their own organization.
drop policy if exists "Members can read organization campaigns" on campaigns;
create policy "Members can read organization campaigns"
on campaigns for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can create organization campaigns" on campaigns;
create policy "Members can create organization campaigns"
on campaigns for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "Members can update organization campaigns" on campaigns;
create policy "Members can update organization campaigns"
on campaigns for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

-- Volunteers: members can read/create/update volunteers inside their own organization.
drop policy if exists "Members can read organization volunteers" on volunteers;
create policy "Members can read organization volunteers"
on volunteers for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can create organization volunteers" on volunteers;
create policy "Members can create organization volunteers"
on volunteers for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "Members can update organization volunteers" on volunteers;
create policy "Members can update organization volunteers"
on volunteers for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

-- Field updates: members can read/create/update field evidence inside their own organization.
drop policy if exists "Members can read organization field updates" on field_updates;
create policy "Members can read organization field updates"
on field_updates for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can create organization field updates" on field_updates;
create policy "Members can create organization field updates"
on field_updates for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "Members can update organization field updates" on field_updates;
create policy "Members can update organization field updates"
on field_updates for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

-- Impact reports: members can read/create/update reports inside their own organization.
drop policy if exists "Members can read organization impact reports" on impact_reports;
create policy "Members can read organization impact reports"
on impact_reports for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can create organization impact reports" on impact_reports;
create policy "Members can create organization impact reports"
on impact_reports for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "Members can update organization impact reports" on impact_reports;
create policy "Members can update organization impact reports"
on impact_reports for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

-- Campaign-volunteer assignments do not directly store organization_id.
-- Access is allowed when the related campaign belongs to one of the user's organizations.
drop policy if exists "Members can read organization campaign assignments" on campaign_volunteers;
create policy "Members can read organization campaign assignments"
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

drop policy if exists "Members can create organization campaign assignments" on campaign_volunteers;
create policy "Members can create organization campaign assignments"
on campaign_volunteers for insert
to authenticated
with check (
  exists (
    select 1
    from campaigns c
    join volunteers v on v.id = campaign_volunteers.volunteer_id
    where c.id = campaign_volunteers.campaign_id
      and public.is_org_member(c.organization_id)
      and v.organization_id = c.organization_id
  )
);
