-- Niswarth AI Phase 7C manual verification helpers.
-- Do not run blindly as an app migration.
-- Use these read-only queries in Supabase SQL Editor to inspect org/user isolation.

-- 1) List organizations and membership counts.
select
  o.id,
  o.name,
  o.city,
  count(om.id) as member_count,
  o.created_at
from organizations o
left join organization_members om on om.organization_id = o.id
group by o.id, o.name, o.city, o.created_at
order by o.created_at desc;

-- 2) List users and their workspace roles.
select
  p.email,
  p.full_name,
  o.name as organization_name,
  om.role,
  om.created_at
from organization_members om
join profiles p on p.id = om.user_id
join organizations o on o.id = om.organization_id
order by om.created_at desc;

-- 3) Count workflow records per organization.
select
  o.name as organization_name,
  count(distinct c.id) as campaigns,
  count(distinct v.id) as volunteers,
  count(distinct fu.id) as field_updates,
  count(distinct ir.id) as impact_reports
from organizations o
left join campaigns c on c.organization_id = o.id
left join volunteers v on v.organization_id = o.id
left join field_updates fu on fu.organization_id = o.id
left join impact_reports ir on ir.organization_id = o.id
group by o.id, o.name
order by o.created_at desc;

-- 4) Check for any workflow records still missing organization_id.
select 'campaigns' as table_name, count(*) as missing_organization_id from campaigns where organization_id is null
union all
select 'volunteers', count(*) from volunteers where organization_id is null
union all
select 'field_updates', count(*) from field_updates where organization_id is null
union all
select 'impact_reports', count(*) from impact_reports where organization_id is null;
