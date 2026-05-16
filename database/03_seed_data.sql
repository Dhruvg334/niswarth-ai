insert into campaigns (title, type, location, status, goal, start_date, end_date)
values
('Weekend Learning Support', 'education', 'Pune', 'active', 'Support children with weekend learning sessions and stationery distribution.', '2026-05-01', '2026-05-30'),
('Stray Care Drive', 'animal_welfare', 'Jaipur', 'active', 'Coordinate feeding, vaccination notes, and rescue follow-ups for stray animals.', '2026-05-05', '2026-05-28'),
('Tree Plantation Drive', 'environment', 'Goa', 'planning', 'Plan plantation activity, volunteer assignment, and participation tracking.', '2026-05-10', '2026-06-05')
on conflict do nothing;

insert into volunteers (name, role, city, availability)
values
('Aarav Mehta', 'Volunteer Lead', 'Pune', 'available'),
('Riya Sharma', 'Field Coordinator', 'Jaipur', 'available'),
('Kabir Rao', 'Documentation Volunteer', 'Goa', 'limited'),
('Meera Iyer', 'Campaign Support', 'Pune', 'available')
on conflict do nothing;

insert into campaign_volunteers (campaign_id, volunteer_id, assignment_role)
select c.id, v.id, 'Session Support'
from campaigns c, volunteers v
where c.title = 'Weekend Learning Support'
and v.name in ('Aarav Mehta', 'Meera Iyer')
on conflict do nothing;

insert into campaign_volunteers (campaign_id, volunteer_id, assignment_role)
select c.id, v.id, 'Field Coordination'
from campaigns c, volunteers v
where c.title = 'Stray Care Drive'
and v.name in ('Riya Sharma')
on conflict do nothing;

insert into campaign_volunteers (campaign_id, volunteer_id, assignment_role)
select c.id, v.id, 'Documentation'
from campaigns c, volunteers v
where c.title = 'Tree Plantation Drive'
and v.name in ('Kabir Rao')
on conflict do nothing;

insert into field_updates (campaign_id, update_text, location, submitted_by, evidence_type)
select id, '32 students attended the weekend learning session.', 'Pune', 'Aarav Mehta', 'text'
from campaigns
where title = 'Weekend Learning Support';

insert into field_updates (campaign_id, update_text, location, submitted_by, evidence_type)
select id, 'Six volunteers supported reading and basic mathematics activities.', 'Pune', 'Meera Iyer', 'text'
from campaigns
where title = 'Weekend Learning Support';

insert into field_updates (campaign_id, update_text, location, submitted_by, evidence_type)
select id, 'Food packets were distributed across two feeding points.', 'Jaipur', 'Riya Sharma', 'text'
from campaigns
where title = 'Stray Care Drive';

insert into field_updates (campaign_id, update_text, location, submitted_by, evidence_type)
select id, 'Plantation site mapping has been completed for the first activity.', 'Goa', 'Kabir Rao', 'text'
from campaigns
where title = 'Tree Plantation Drive';
