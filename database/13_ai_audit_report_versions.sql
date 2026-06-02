-- Phase 10: AI audit trail and report version history
-- Adds lightweight accountability records for AI-generated impact reports.
-- Safe to run multiple times after Phase 7C RLS hardening and Phase 8 metadata.

begin;

create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  report_id uuid references public.impact_reports(id) on delete set null,
  generation_source text not null default 'unknown',
  ai_model text,
  confidence integer,
  status text not null default 'success' check (status in ('success', 'fallback', 'failed')),
  input_snapshot jsonb not null default '{}'::jsonb,
  evidence_used jsonb not null default '[]'::jsonb,
  missing_evidence jsonb not null default '[]'::jsonb,
  risk_flags jsonb not null default '[]'::jsonb,
  error_message text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.report_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  report_id uuid not null references public.impact_reports(id) on delete cascade,
  version_number integer not null,
  title text,
  body_text text not null,
  status text not null default 'draft',
  review_notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique(report_id, version_number)
);

create index if not exists idx_ai_generation_logs_organization_id
  on public.ai_generation_logs (organization_id);

create index if not exists idx_ai_generation_logs_campaign_id
  on public.ai_generation_logs (campaign_id);

create index if not exists idx_ai_generation_logs_report_id
  on public.ai_generation_logs (report_id);

create index if not exists idx_report_versions_organization_id
  on public.report_versions (organization_id);

create index if not exists idx_report_versions_campaign_id
  on public.report_versions (campaign_id);

create index if not exists idx_report_versions_report_id
  on public.report_versions (report_id, version_number desc);

alter table public.ai_generation_logs enable row level security;
alter table public.report_versions enable row level security;

grant select, insert, update, delete on public.ai_generation_logs to authenticated;
grant select, insert, update, delete on public.report_versions to authenticated;

-- AI generation logs policies.
drop policy if exists "Members can read AI generation logs" on public.ai_generation_logs;
create policy "Members can read AI generation logs"
on public.ai_generation_logs for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Review team can create AI generation logs" on public.ai_generation_logs;
create policy "Review team can create AI generation logs"
on public.ai_generation_logs for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['admin', 'coordinator', 'reviewer'])
  and exists (
    select 1
    from public.campaigns c
    where c.id = ai_generation_logs.campaign_id
      and c.organization_id = ai_generation_logs.organization_id
  )
);

drop policy if exists "Review team can update AI generation logs" on public.ai_generation_logs;
create policy "Review team can update AI generation logs"
on public.ai_generation_logs for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'coordinator', 'reviewer']))
with check (
  public.has_org_role(organization_id, array['admin', 'coordinator', 'reviewer'])
  and exists (
    select 1
    from public.campaigns c
    where c.id = ai_generation_logs.campaign_id
      and c.organization_id = ai_generation_logs.organization_id
  )
);

drop policy if exists "Admins can delete AI generation logs" on public.ai_generation_logs;
create policy "Admins can delete AI generation logs"
on public.ai_generation_logs for delete
to authenticated
using (public.has_org_role(organization_id, array['admin']));

-- Report version policies.
drop policy if exists "Members can read report versions" on public.report_versions;
create policy "Members can read report versions"
on public.report_versions for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Review team can create report versions" on public.report_versions;
create policy "Review team can create report versions"
on public.report_versions for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['admin', 'coordinator', 'reviewer'])
  and exists (
    select 1
    from public.impact_reports ir
    where ir.id = report_versions.report_id
      and ir.organization_id = report_versions.organization_id
      and ir.campaign_id = report_versions.campaign_id
  )
);

drop policy if exists "Review team can update report versions" on public.report_versions;
create policy "Review team can update report versions"
on public.report_versions for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'coordinator', 'reviewer']))
with check (
  public.has_org_role(organization_id, array['admin', 'coordinator', 'reviewer'])
  and exists (
    select 1
    from public.impact_reports ir
    where ir.id = report_versions.report_id
      and ir.organization_id = report_versions.organization_id
      and ir.campaign_id = report_versions.campaign_id
  )
);

drop policy if exists "Admins can delete report versions" on public.report_versions;
create policy "Admins can delete report versions"
on public.report_versions for delete
to authenticated
using (public.has_org_role(organization_id, array['admin']));

commit;
