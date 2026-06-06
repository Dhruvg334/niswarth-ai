# Data model

This document explains the Supabase data model used in Niswarth AI.

The database is organised around one main idea: every important record belongs to an organisation workspace, and users access data through their membership in that workspace.

## Main tables

```text
profiles
organizations
organization_members
campaigns
volunteers
campaign_volunteers
field_updates
impact_reports
ai_generation_logs
report_versions
ai_request_usage
```

## Table overview

| Table | Purpose |
|---|---|
| `profiles` | app profile linked to Supabase Auth users |
| `organizations` | NGO/foundation workspace |
| `organization_members` | connects users to organisations and stores role |
| `campaigns` | campaign records inside an organisation |
| `volunteers` | organisation-scoped volunteer profiles |
| `campaign_volunteers` | assignment table linking volunteers to campaigns |
| `field_updates` | field notes and campaign updates |
| `impact_reports` | report drafts, review status, edited text, structured metadata |
| `ai_generation_logs` | AI/fallback generation details and input snapshot |
| `report_versions` | report version history for save/review/approval actions |
| `ai_request_usage` | daily AI draft usage per user and organisation |

## Workspace model

The workspace model is the core of the app.

```text
Supabase user
  -> profile
  -> organization_members row
  -> selected organisation
  -> selected organisation role
  -> organisation-scoped data
```

A user can belong to more than one organisation. The active role comes from the selected workspace, not from the user account globally.

## `profiles`

Stores app-level user data linked to Supabase Auth.

Important fields:

```text
id
full_name
email
created_at
updated_at
```

Profiles are created/updated from auth signup logic and triggers.

## `organizations`

Represents an NGO/foundation workspace.

Important fields:

```text
id
name
city
created_at
updated_at
```

Organisation names are normalised during workspace creation. This reduces duplicate names such as:

```text
Niswarth Foundation
niswarth foundation
Niswarth   Foundation
```

The current rule is simple: avoid duplicate organisation names through the workspace creation RPC. In a future production version, I may move to organisation slugs instead of blocking display names globally.

## `organization_members`

Connects users and organisations.

Important fields:

```text
id
organization_id
user_id
role
created_at
updated_at
```

Current roles:

```text
admin
coordinator
reviewer
```

This table controls workspace role resolution.

## `campaigns`

Stores campaign records.

Important fields:

```text
id
organization_id
title
type
location
status
goal
start_date
end_date
created_at
updated_at
```

Campaign create/edit/delete is Admin-only after the Phase 13 permission hardening.

Current campaign statuses include:

```text
planning
active
paused
completed
cancelled
```

## `volunteers`

Stores reusable volunteer profiles under an organisation.

Important fields:

```text
id
organization_id
name
role
city
phone
email
availability
created_at
updated_at
```

Phone and email were added later because volunteer coordination needs actual contact information, not only names and roles.

## `campaign_volunteers`

Links volunteers to campaigns.

Important fields:

```text
id
campaign_id
volunteer_id
assignment_role
created_at
```

A volunteer can be assigned to more than one campaign. The dashboard shows where a volunteer is already assigned so the coordinator/admin has better context.

## `field_updates`

Stores campaign evidence and updates.

Important fields:

```text
id
campaign_id
organization_id
submitted_by
location
evidence_type
content
created_at
```

Field updates are the main evidence source for report generation. The AI prompt should not invent claims beyond these updates.

## `impact_reports`

Stores report drafts and review state.

Important fields:

```text
id
campaign_id
organization_id
title
summary
status
review_notes
evidence_used
missing_evidence
risk_flags
next_actions
ai_model
generation_source
created_at
updated_at
```

Current status flow:

```text
draft
under_review
needs_revision
approved
```

The report text is editable before approval. Approved reports are treated as locked in the UI.

## `ai_generation_logs`

Stores AI/fallback generation details.

This helps answer:

- what generated the draft
- which model/source was used
- what evidence was used
- what was missing
- what risks were flagged
- what input snapshot existed at generation time

It is meant for traceability, not for showing a huge technical log to the NGO user.

## `report_versions`

Stores report version history.

A new version can be created when a draft is saved, sent for review, approved, or sent back for revision.

This is useful because report text changes during human review, and I wanted the app to preserve that workflow instead of silently overwriting everything.

## `ai_request_usage`

Tracks daily AI draft usage.

Important fields:

```text
organization_id
user_id
usage_date
request_count
```

This is used by:

```text
/api/generate-report
/api/ai-usage
```

The UI shows a daily usage line below the Generate Draft button.

## Migration notes

The database folder contains the full development history. Some files were created to fix or harden earlier migrations.

For a fresh project, run these in order:

```text
01_schema.sql
02_rls_policies_and_grants.sql
03_seed_data.sql
04_auth_org_foundation.sql
06_auth_workspace_interim_policies.sql
07_fix_workspace_starter_data_function.sql
08_fix_authenticated_core_table_policies.sql
09_admin_campaign_delete_policy.sql
10_org_scoped_rls_hardening.sql
12_structured_report_metadata.sql
13_ai_audit_report_versions.sql
14_member_reviewer_workflow.sql
15_fix_member_email_rpc.sql
16_harden_member_management_rpc.sql
17_campaign_permissions_and_volunteer_contacts.sql
18_security_reliability_hardening.sql
```

Do not run:

```text
05_org_scoped_rls_do_not_run_yet.sql
```

It is an older intermediate script and is kept only for history.

Manual inspection only:

```text
11_rls_isolation_manual_test.sql
```

## Why I am not rewriting migrations right now

The migration folder is not perfect, but it reflects the real build process. Rewriting it right before closing Stage 3 could create new mistakes. For now, I am documenting the correct order clearly. A cleaner single bootstrap script can be a later task.
