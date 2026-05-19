-- Niswarth AI Phase 7C
-- Organization-scoped RLS hardening.
-- Run only after Phase 7B auth + workspace setup is working.
-- This removes demo/public anonymous access from core workflow tables.

begin;

-- -----------------------------------------------------------------------------
-- 1) Backfill/verify organization_id before enforcing organization-scoped access.
-- -----------------------------------------------------------------------------

update field_updates fu
set organization_id = c.organization_id
from campaigns c
where fu.campaign_id = c.id
  and fu.organization_id is null
  and c.organization_id is not null;

update impact_reports ir
set organization_id = c.organization_id
from campaigns c
where ir.campaign_id = c.id
  and ir.organization_id is null
  and c.organization_id is not null;

do $$
declare
  missing_campaigns integer;
  missing_volunteers integer;
  missing_updates integer;
  missing_reports integer;
begin
  select count(*) into missing_campaigns from campaigns where organization_id is null;
  select count(*) into missing_volunteers from volunteers where organization_id is null;
  select count(*) into missing_updates from field_updates where organization_id is null;
  select count(*) into missing_reports from impact_reports where organization_id is null;

  if missing_campaigns > 0 or missing_volunteers > 0 or missing_updates > 0 or missing_reports > 0 then
    raise exception 'RLS hardening stopped. Missing organization_id counts -> campaigns: %, volunteers: %, field_updates: %, impact_reports: %',
      missing_campaigns, missing_volunteers, missing_updates, missing_reports;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2) Role helpers used by policies.
-- -----------------------------------------------------------------------------

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

create or replace function public.has_org_role(p_organization_id uuid, p_roles text[])
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
      and om.role = any(p_roles)
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

create or replace function public.is_org_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_org_role(p_organization_id, array['admin']);
$$;

-- -----------------------------------------------------------------------------
-- 3) Enable RLS.
-- -----------------------------------------------------------------------------

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table campaigns enable row level security;
alter table volunteers enable row level security;
alter table campaign_volunteers enable row level security;
alter table field_updates enable row level security;
alter table impact_reports enable row level security;

-- -----------------------------------------------------------------------------
-- 4) Remove all existing policies on protected tables.
-- This removes old public demo policies and interim policies safely/idempotently.
-- -----------------------------------------------------------------------------

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'organizations',
        'organization_members',
        'campaigns',
        'volunteers',
        'campaign_volunteers',
        'field_updates',
        'impact_reports'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 5) Remove anonymous table access from workflow data.
-- Public landing pages should not need direct database access.
-- -----------------------------------------------------------------------------

revoke all on profiles from anon;
revoke all on organizations from anon;
revoke all on organization_members from anon;
revoke all on campaigns from anon;
revoke all on volunteers from anon;
revoke all on campaign_volunteers from anon;
revoke all on field_updates from anon;
revoke all on impact_reports from anon;

-- -----------------------------------------------------------------------------
-- 6) Authenticated grants. RLS policies below define actual row-level access.
-- -----------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, update on profiles to authenticated;
grant select, update on organizations to authenticated;
grant select, insert, update, delete on organization_members to authenticated;
grant select, insert, update, delete on campaigns to authenticated;
grant select, insert, update, delete on volunteers to authenticated;
grant select, insert, update, delete on campaign_volunteers to authenticated;
grant select, insert, update, delete on field_updates to authenticated;
grant select, insert, update, delete on impact_reports to authenticated;

grant execute on function public.create_workspace_with_starter_data(text, text) to authenticated;
grant execute on function public.seed_organization_starter_data(uuid) to authenticated;
grant execute on function public.current_user_organization_ids() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 7) Profiles.
-- -----------------------------------------------------------------------------

create policy "Users can read own profile"
on profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can update own profile"
on profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8) Organizations and memberships.
-- -----------------------------------------------------------------------------

create policy "Members can read their organizations"
on organizations for select
to authenticated
using (public.is_org_member(id));

create policy "Admins can update their organizations"
on organizations for update
to authenticated
using (public.has_org_role(id, array['admin']))
with check (public.has_org_role(id, array['admin']));

create policy "Users can read own organization memberships"
on organization_members for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_org_role(organization_id, array['admin'])
);

create policy "Admins can create organization memberships"
on organization_members for insert
to authenticated
with check (public.has_org_role(organization_id, array['admin']));

create policy "Admins can update organization memberships"
on organization_members for update
to authenticated
using (public.has_org_role(organization_id, array['admin']))
with check (public.has_org_role(organization_id, array['admin']));

create policy "Admins can delete organization memberships"
on organization_members for delete
to authenticated
using (
  public.has_org_role(organization_id, array['admin'])
  and user_id <> auth.uid()
);

-- -----------------------------------------------------------------------------
-- 9) Campaigns.
-- -----------------------------------------------------------------------------

create policy "Members can read organization campaigns"
on campaigns for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Admins and coordinators can create campaigns"
on campaigns for insert
to authenticated
with check (public.has_org_role(organization_id, array['admin', 'coordinator']));

create policy "Admins and coordinators can update campaigns"
on campaigns for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'coordinator']))
with check (public.has_org_role(organization_id, array['admin', 'coordinator']));

create policy "Admins can delete campaigns"
on campaigns for delete
to authenticated
using (public.has_org_role(organization_id, array['admin']));

-- -----------------------------------------------------------------------------
-- 10) Volunteers.
-- -----------------------------------------------------------------------------

create policy "Members can read organization volunteers"
on volunteers for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Admins and coordinators can create volunteers"
on volunteers for insert
to authenticated
with check (public.has_org_role(organization_id, array['admin', 'coordinator']));

create policy "Admins and coordinators can update volunteers"
on volunteers for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'coordinator']))
with check (public.has_org_role(organization_id, array['admin', 'coordinator']));

create policy "Admins can delete volunteers"
on volunteers for delete
to authenticated
using (public.has_org_role(organization_id, array['admin']));

-- -----------------------------------------------------------------------------
-- 11) Campaign-volunteer assignments.
-- This table has no organization_id, so access is derived from campaign + volunteer.
-- -----------------------------------------------------------------------------

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

create policy "Admins and coordinators can create campaign assignments"
on campaign_volunteers for insert
to authenticated
with check (
  exists (
    select 1
    from campaigns c
    join volunteers v on v.id = campaign_volunteers.volunteer_id
    where c.id = campaign_volunteers.campaign_id
      and v.organization_id = c.organization_id
      and public.has_org_role(c.organization_id, array['admin', 'coordinator'])
  )
);

create policy "Admins and coordinators can update campaign assignments"
on campaign_volunteers for update
to authenticated
using (
  exists (
    select 1
    from campaigns c
    where c.id = campaign_volunteers.campaign_id
      and public.has_org_role(c.organization_id, array['admin', 'coordinator'])
  )
)
with check (
  exists (
    select 1
    from campaigns c
    join volunteers v on v.id = campaign_volunteers.volunteer_id
    where c.id = campaign_volunteers.campaign_id
      and v.organization_id = c.organization_id
      and public.has_org_role(c.organization_id, array['admin', 'coordinator'])
  )
);

create policy "Admins and coordinators can delete campaign assignments"
on campaign_volunteers for delete
to authenticated
using (
  exists (
    select 1
    from campaigns c
    where c.id = campaign_volunteers.campaign_id
      and public.has_org_role(c.organization_id, array['admin', 'coordinator'])
  )
);

-- -----------------------------------------------------------------------------
-- 12) Field updates.
-- -----------------------------------------------------------------------------

create policy "Members can read organization field updates"
on field_updates for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Admins and coordinators can create field updates"
on field_updates for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['admin', 'coordinator'])
  and exists (
    select 1
    from campaigns c
    where c.id = field_updates.campaign_id
      and c.organization_id = field_updates.organization_id
  )
);

create policy "Admins and coordinators can update field updates"
on field_updates for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'coordinator']))
with check (
  public.has_org_role(organization_id, array['admin', 'coordinator'])
  and exists (
    select 1
    from campaigns c
    where c.id = field_updates.campaign_id
      and c.organization_id = field_updates.organization_id
  )
);

create policy "Admins can delete field updates"
on field_updates for delete
to authenticated
using (public.has_org_role(organization_id, array['admin']));

-- -----------------------------------------------------------------------------
-- 13) Impact reports.
-- -----------------------------------------------------------------------------

create policy "Members can read organization impact reports"
on impact_reports for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Admins coordinators and reviewers can create impact reports"
on impact_reports for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['admin', 'coordinator', 'reviewer'])
  and exists (
    select 1
    from campaigns c
    where c.id = impact_reports.campaign_id
      and c.organization_id = impact_reports.organization_id
  )
);

create policy "Admins coordinators and reviewers can update impact reports"
on impact_reports for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'coordinator', 'reviewer']))
with check (
  public.has_org_role(organization_id, array['admin', 'coordinator', 'reviewer'])
  and exists (
    select 1
    from campaigns c
    where c.id = impact_reports.campaign_id
      and c.organization_id = impact_reports.organization_id
  )
);

create policy "Admins can delete impact reports"
on impact_reports for delete
to authenticated
using (public.has_org_role(organization_id, array['admin']));

commit;
