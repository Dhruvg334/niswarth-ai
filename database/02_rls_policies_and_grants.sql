-- Development/demo policies.
-- These allow the public anon key to read/write demo workflow records.
-- For production, replace with authenticated user and organization-level policies.

alter table campaigns enable row level security;
alter table volunteers enable row level security;
alter table campaign_volunteers enable row level security;
alter table field_updates enable row level security;
alter table impact_reports enable row level security;

grant usage on schema public to anon;
grant select, insert on campaigns to anon;
grant select, insert on volunteers to anon;
grant select, insert on campaign_volunteers to anon;
grant select, insert on field_updates to anon;
grant select, insert, update on impact_reports to anon;

drop policy if exists "Allow public read campaigns" on campaigns;
create policy "Allow public read campaigns" on campaigns for select using (true);

drop policy if exists "Allow public insert campaigns" on campaigns;
create policy "Allow public insert campaigns" on campaigns for insert with check (true);

drop policy if exists "Allow public read volunteers" on volunteers;
create policy "Allow public read volunteers" on volunteers for select using (true);

drop policy if exists "Allow public insert volunteers" on volunteers;
create policy "Allow public insert volunteers" on volunteers for insert with check (true);

drop policy if exists "Allow public read campaign volunteers" on campaign_volunteers;
create policy "Allow public read campaign volunteers" on campaign_volunteers for select using (true);

drop policy if exists "Allow public insert campaign volunteers" on campaign_volunteers;
create policy "Allow public insert campaign volunteers" on campaign_volunteers for insert with check (true);

drop policy if exists "Allow public read field updates" on field_updates;
create policy "Allow public read field updates" on field_updates for select using (true);

drop policy if exists "Allow public insert field updates" on field_updates;
create policy "Allow public insert field updates" on field_updates for insert with check (true);

drop policy if exists "Allow public read impact reports" on impact_reports;
create policy "Allow public read impact reports" on impact_reports for select using (true);

drop policy if exists "Allow public insert impact reports" on impact_reports;
create policy "Allow public insert impact reports" on impact_reports for insert with check (true);

drop policy if exists "Allow public update impact reports" on impact_reports;
create policy "Allow public update impact reports" on impact_reports for update using (true) with check (true);
