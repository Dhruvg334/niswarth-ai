# Niswarth AI

Niswarth AI is a full-stack workflow platform for NGOs to manage campaigns, volunteers, field updates, and reviewed impact reports.

I built this project around a practical problem I kept seeing in NGO-style work: the actual field work happens in many scattered places — WhatsApp messages, spreadsheets, volunteer notes, photos, and manually written reports. Niswarth AI brings that workflow into one organisation workspace and uses AI to prepare report drafts from the evidence already available in the system.

AI is not treated as the final decision-maker here. It helps prepare a draft, but the report still goes through human review, notes, revision, and approval.

**Live demo:** https://niswarth-ai.vercel.app/

---

## Current status

Niswarth AI is an active full-stack product prototype. It is not a finished SaaS product yet, but it now has enough working depth to show the full campaign-to-report workflow.

Current version includes:

- email/password authentication
- organisation-scoped workspaces
- multi-workspace switching
- Admin, Coordinator, and Reviewer roles
- Supabase-backed campaigns, volunteers, field updates, and reports
- protected Gemini report-generation API route
- structured AI report output with evidence, gaps, risks, and next actions
- visible daily AI draft usage count
- local fallback report generation when Gemini is unavailable
- report review, approval, revision, audit logs, and version history
- public contact form through Formspree
- Vercel Web Analytics for basic traffic monitoring
- GitHub Actions checks for tests and production build

Stage 3 is closed around this stable prototype. The next work should be invite flow, export, deeper monitoring, and production hardening instead of adding more features into this stage.

---

## Core workflow

```text
User signup
→ Workspace creation or workspace membership
→ Campaign setup
→ Volunteer assignment
→ Field update collection
→ AI-assisted report draft
→ Human review
→ Revision or approval
→ Report history and audit trail
```

Niswarth AI now supports this complete flow from campaign setup to reviewed report history.

---

## Main capabilities

### Authentication and workspaces

- Supabase email/password authentication
- workspace creation for NGO/foundation accounts
- organisation-scoped records for campaigns, volunteers, updates, and reports
- multi-workspace support for users who belong to more than one organisation
- workspace switcher with role resolved from the selected workspace
- Supabase RLS policies for organisation-level data access

### Role-based dashboard

The dashboard changes based on the user’s role inside the selected workspace.

| Role | Current access |
|---|---|
| Admin | Manage workspace members, create/edit/delete campaigns, manage volunteers and updates, generate reports, review and approve reports |
| Coordinator | Manage volunteers and field updates, generate report drafts, send reports for review |
| Reviewer | View campaigns and report history, add review notes, approve reports, mark reports as needing revision |

Roles are attached to workspace membership, not to the global user account. The same user can be an Admin in one workspace and a Reviewer or Coordinator in another.

### Campaign and volunteer workflows

- create campaigns
- edit campaign details
- delete campaigns as Admin
- create volunteer profiles with phone/email
- assign volunteers to campaigns
- track volunteer availability and campaign involvement
- add campaign-specific field updates

### AI-assisted reporting

- generate impact report drafts from campaign and field update data
- use Gemini 2.5 Flash through a Vercel serverless API route
- keep `GEMINI_API_KEY` server-side only
- return structured AI output with:
  - evidence used
  - missing information
  - risk flags
  - next actions
  - confidence/readiness score
  - model and generation source
- use a local fallback generator when Gemini is unavailable
- keep report drafts editable before review or approval

### Human review and audit trail

- save report drafts
- send reports for review
- approve reports
- mark reports as needing revision
- add review notes
- store AI generation logs
- store report version history
- show compact audit details in Report History

### Monitoring and usage limits

- Vercel Web Analytics is added for basic traffic visibility
- AI draft requests are tracked per user and organisation
- the report workspace shows daily AI draft usage
- the AI route blocks requests after the daily limit

---

## Why this exists

NGO teams often need to show impact, but the raw information behind that impact is usually scattered. Reports get written manually after the field work is already done, and it becomes hard to track what evidence supports which claim.

Niswarth AI focuses on one narrow workflow:

> help an NGO collect field evidence, prepare a draft report, and review it before it becomes final.

The goal is not to replace judgement. The goal is to reduce reporting friction and make the review process more structured.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Routing | React Router |
| Backend / Database | Supabase Auth, Supabase Postgres |
| Security | Supabase Row Level Security, RPC functions, protected API routes |
| AI generation | Gemini 2.5 Flash through Vercel API route |
| Contact form | Formspree |
| Monitoring | Vercel Web Analytics |
| Deployment | Vercel |
| Testing | Node test runner |
| CI | GitHub Actions |
| Icons | Lucide React |

---

## Architecture overview

```text
React UI
  ↓
Service layer
  ├── Supabase services
  │     ├── Auth
  │     ├── Workspaces
  │     ├── Members
  │     ├── Campaigns
  │     ├── Volunteers
  │     ├── Field updates
  │     └── Reports
  │
  ├── AI report service
  │     ↓
  │     Vercel API route: /api/generate-report
  │     ↓
  │     Gemini 2.5 Flash
  │
  ├── AI usage service
  │     ↓
  │     Vercel API route: /api/ai-usage
  │
  └── Contact service
        ↓
        Formspree endpoint

Supabase Postgres
  ├── profiles
  ├── organizations
  ├── organization_members
  ├── campaigns
  ├── volunteers
  ├── campaign_volunteers
  ├── field_updates
  ├── impact_reports
  ├── ai_generation_logs
  ├── report_versions
  └── ai_request_usage
```

More detailed architecture notes are in [`docs/architecture.md`](docs/architecture.md).

---

## Documentation

The deeper project notes are split into focused docs:

| Doc | Covers |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | app structure, routes, services, API routes, workspace/role flow |
| [`docs/data-model.md`](docs/data-model.md) | Supabase tables, relationships, migration notes |
| [`docs/ai-workflow.md`](docs/ai-workflow.md) | Gemini flow, fallback, structured output, limits, audit/version flow |
| [`docs/security-model.md`](docs/security-model.md) | auth, RLS, roles, API protection, secrets, usage limits |
| [`docs/testing.md`](docs/testing.md) | automated tests, manual QA, role testing, AI testing |
| [`docs/roadmap.md`](docs/roadmap.md) | future work after Stage 3 |

---

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/Dhruvg334/niswarth-ai.git
cd niswarth-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` in the project root.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For deployed AI generation, configure this in Vercel Project Settings → Environment Variables:

```env
GEMINI_API_KEY=your-gemini-api-key
```

Optional server-side variables:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
AI_DAILY_LIMIT_PER_USER=20
```

Do not prefix `GEMINI_API_KEY` with `VITE_`. Vite exposes `VITE_` variables to the frontend, so Gemini must stay server-side.

The Formspree endpoint is configured in the contact service file. It is not a server-side secret.

### 4. Start development server

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

---

## Database setup

Supabase SQL files are stored in `/database`.

For a fresh Supabase project, run the SQL files in numerical order with the notes below:

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

It was kept as a historical intermediate file and is replaced by later hardening migrations.

Use only for manual checks:

```text
11_rls_isolation_manual_test.sql
```

Supabase Auth should have the Email provider enabled.

More detail is in [`docs/data-model.md`](docs/data-model.md).

---

## Available scripts

```bash
npm run dev          # start local development server
npm run build        # production build
npm run preview      # preview production build locally
npm test             # run automated tests
npm run test:ai-live # optional live Gemini test when GEMINI_API_KEY is set locally
```

---

## Testing

Automated tests cover:

- dashboard metrics
- fallback report generation
- structured AI report parsing
- API handler behavior
- daily AI usage API behavior
- role/permission helpers
- report workflow rules

Manual QA is still needed for Supabase Auth, real RLS behavior, workspace switching, Gemini calls, Formspree, and Vercel Analytics.

More detail is in [`docs/testing.md`](docs/testing.md).

---

## Current limitations

This is still a product prototype. Known limitations:

- Google OAuth is not enabled yet.
- Member invitation flow is not built yet. Users sign up first, then an Admin adds their email.
- Approved report export/PDF is not built yet.
- The creator metrics console is not built yet. Vercel Analytics covers traffic for now.
- The dashboard works, but `Demo.jsx` is large and should be split later.
- Route-level lazy loading is not added yet, so the build still shows a chunk-size warning.
- The system is currently a controlled AI report-generation workflow, not an agentic system. I plan to add agentic features in future stages.

---

## Roadmap

Main future work:

- invite-based member onboarding
- organisation settings page
- approved report export/PDF
- creator metrics console if Vercel + Supabase table checks are not enough
- dashboard component split
- route-level lazy loading if performance becomes an issue
- stronger AI evaluation and benchmark cases
- better portfolio/recruiter presentation assets

Full roadmap is in [`docs/roadmap.md`](docs/roadmap.md).

---

## Repository support

For bugs, suggestions, or project discussion, use GitHub Issues.
