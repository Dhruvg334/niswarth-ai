-- Niswarth AI Phase 7B Fix
-- Fixes workspace starter data creation so the RPC does not fail on multi-row INSERT ... RETURNING INTO.
-- Run this after 04_auth_org_foundation.sql.

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
  on conflict do nothing;

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
  on conflict do nothing;

  select id into volunteer_1_id
  from volunteers
  where organization_id = p_organization_id and name = 'Aarav Mehta'
  order by created_at desc
  limit 1;

  select id into volunteer_2_id
  from volunteers
  where organization_id = p_organization_id and name = 'Riya Sharma'
  order by created_at desc
  limit 1;

  select id into volunteer_3_id
  from volunteers
  where organization_id = p_organization_id and name = 'Kabir Rao'
  order by created_at desc
  limit 1;

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
    (p_organization_id, environment_campaign_id, 'Plantation site mapping has been completed for the first activity.', 'Goa', 'Kabir Rao', 'text')
  on conflict do nothing;
end;
$$;

grant execute on function public.seed_organization_starter_data(uuid) to authenticated;
