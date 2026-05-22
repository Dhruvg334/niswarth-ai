-- Phase 8: Structured report metadata
-- Adds lightweight structured AI metadata to the existing impact_reports table.
-- Safe to run multiple times.

alter table public.impact_reports
  add column if not exists evidence_used jsonb not null default '[]'::jsonb,
  add column if not exists missing_evidence jsonb not null default '[]'::jsonb,
  add column if not exists risk_flags jsonb not null default '[]'::jsonb,
  add column if not exists next_actions jsonb not null default '[]'::jsonb,
  add column if not exists ai_model text,
  add column if not exists generation_source text;

create index if not exists idx_impact_reports_generation_source
  on public.impact_reports (generation_source);

create index if not exists idx_impact_reports_ai_model
  on public.impact_reports (ai_model);
