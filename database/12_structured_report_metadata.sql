-- Niswarth AI Phase 8A
-- Structured AI report metadata.
-- Adds lightweight JSON metadata to impact_reports so generated drafts can carry evidence,
-- missing information, review cautions, and next actions without adding a full audit table yet.

begin;

alter table impact_reports
  add column if not exists evidence_used jsonb not null default '[]'::jsonb,
  add column if not exists missing_evidence jsonb not null default '[]'::jsonb,
  add column if not exists risk_flags jsonb not null default '[]'::jsonb,
  add column if not exists next_actions jsonb not null default '[]'::jsonb,
  add column if not exists ai_model text,
  add column if not exists generation_source text not null default 'unknown';

comment on column impact_reports.evidence_used is 'Structured notes describing which field updates or records supported the draft.';
comment on column impact_reports.missing_evidence is 'Missing details that should be collected or verified before external sharing.';
comment on column impact_reports.risk_flags is 'Review cautions for unsupported claims, privacy concerns, or weak evidence.';
comment on column impact_reports.next_actions is 'Practical follow-up actions suggested by the AI or fallback generator.';
comment on column impact_reports.ai_model is 'AI model used for generation when applicable.';
comment on column impact_reports.generation_source is 'Generation path, for example gemini-2.5-flash or local-fallback.';

commit;
