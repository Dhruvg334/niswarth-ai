# Niswarth AI

**Niswarth AI** is a full-stack AI workflow platform for NGO campaign coordination, volunteer assignment, field reporting, and human-reviewed impact report generation.

The project is built around a real NGO operating problem: campaign work is often scattered across WhatsApp messages, spreadsheets, volunteer notes, field updates, and manually written reports. Niswarth AI brings those workflows into an organization-scoped workspace and uses AI to prepare reviewable report drafts from available field evidence.

AI is used as a drafting assistant, not as an automatic publisher. Reports still move through human review, revision, and approval before they are treated as usable output.

**Live demo:** https://niswarth-ai.vercel.app/

---

## Current status

Niswarth AI is an active full-stack product build, not a finished SaaS product.

The current version includes:

- email/password authentication
- organization-scoped workspaces
- multi-workspace role switching
- Admin, Coordinator, and Reviewer roles
- Supabase-backed campaigns, volunteers, field updates, and reports
- Gemini-assisted structured report drafting through a server-side API route
- local fallback report generation when AI is unavailable
- report review, approval, revision, audit trail, and version history
- public contact form through Formspree
- GitHub Actions checks for tests and production build

The next focus is to close Stage 3 cleanly through review workflow cleanup, reliability improvements, UI/UX polish, architecture notes, and concise project documentation.

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

Niswarth AI currently supports the complete flow from campaign setup to reviewed report history.

---

## Main capabilities

### Authentication and workspaces

- Supabase email/password authentication
- Workspace creation for NGO/foundation accounts
- Organization-scoped records for campaigns, volunteers, updates, and reports
- Multi-workspace support for users who belong to more than one organization
- Workspace switcher with role resolved per selected workspace
- Supabase RLS policies for organization-level data access

### Role-based dashboard

The dashboard behaves differently based on the user role inside the selected workspace.

| Role | Current access |
|---|---|
| Admin | Manage workspace members, create/edit/delete campaigns, manage volunteers and updates, generate reports, review and approve reports |
| Coordinator | Manage volunteers and field updates, generate report drafts, send reports for review |
| Reviewer | View campaigns and report history, add review notes, approve reports, mark reports as needing revision |

Roles are attached to workspace membership, not to the global user account. A user can be an Admin in one workspace and a Reviewer or Coordinator in another.

### Campaign and volunteer workflows

- Create campaigns
- Edit campaign details
- Delete campaigns as Admin
- Create volunteer profiles
- Assign volunteers to campaigns
- Track volunteer availability and campaign involvement
- Add campaign-specific field updates

### AI-assisted reporting

- Generate impact report drafts from campaign and field update data
- Use Gemini 2.5 Flash through a Vercel serverless API route
- Keep `GEMINI_API_KEY` server-side only
- Return structured AI output with:
  - evidence used
  - missing information
  - risk flags
  - next actions
  - confidence/readiness score
  - model and generation source
- Use a local fallback generator when Gemini is unavailable
- Keep report drafts editable before review or approval

### Human review and audit trail

- Save report drafts
- Send reports for review
- Approve reports
- Mark reports as needing revision
- Add review notes
- Store AI generation logs
- Store report version history
- Show compact audit details in Report History

### Contact form

- Public contact page connected through Formspree
- Contact submission handled without exposing private server-side credentials

---

## Why this exists

NGO teams need to communicate work clearly, but the raw material for that communication usually comes from fragmented field activity: volunteer notes, local observations, attendance counts, informal messages, and campaign updates.

Niswarth AI focuses on a specific problem:

> Help NGO teams convert campaign activity and field updates into structured, reviewable impact reports without losing human control over final claims.

The product does not try to automate an NGO’s full operations. It focuses on the campaign-to-report workflow and builds structure around evidence, review, and accountability.

---

## Engineering highlights

### Real full-stack workflow

This is not a static frontend demo. The project uses a live backend model with Supabase Auth, Postgres tables, organization membership, RLS policies, serverless AI generation, and CI checks.

Key implementation areas:

- React + Vite app structure
- Supabase Auth and organization-scoped data model
- RLS-backed workspace isolation
- Role-aware service and UI behavior
- Vercel API route for Gemini integration
- Structured AI output validation and fallback handling
- AI audit logging and report versioning
- Local AI test harness with fixtures

### Organization-scoped SaaS model

The project uses a workspace-based model closer to a real SaaS app:

```text
User account
→ Organization membership
→ Role inside selected workspace
→ Organization-scoped campaigns, updates, volunteers, and reports
```

The role is resolved from the selected workspace membership. This matters because the same user can belong to multiple workspaces with different roles.

### Human-in-the-loop AI design

AI reports are treated as drafts. The app keeps human review central by requiring users to save, edit, send for review, approve, or request revision.

The AI layer also returns structured metadata so reviewers can see what the draft was based on and what still needs checking.

### Auditability

The current build records more than just final report text. It also stores generation and version history so the report workflow has traceability:

- AI/fallback generation source
- model name where available
- readiness/confidence score
- evidence used
- missing evidence
- risk flags
- input snapshot
- report versions created during save/review/approval actions

### Fallback behavior

When the Gemini route fails or no AI key is available, the app still produces a structured local draft using available campaign and update data. The UI indicates that fallback generation was used, instead of silently treating it as a normal AI response.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Routing | React Router |
| Backend / Database | Supabase Auth, Supabase Postgres |
| Access control | Supabase Row Level Security |
| AI generation | Gemini 2.5 Flash through Vercel API route |
| Contact form | Formspree |
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
  ├── Auth service
  ├── Workspace service
  ├── Member service
  ├── Campaign service
  ├── Volunteer service
  ├── Field update service
  ├── Report service
  ├── AI report service
  │     ↓
  │     Vercel API route: /api/generate-report
  │     ↓
  │     Gemini 2.5 Flash
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
  └── report_versions
```

---

## Data model

The database is organized around workspaces.

| Table | Purpose |
|---|---|
| `profiles` | App-level user profile linked to Supabase Auth |
| `organizations` | NGO/foundation workspace |
| `organization_members` | User membership and role inside an organization |
| `campaigns` | Campaign records under an organization |
| `volunteers` | Reusable volunteer profiles scoped to an organization |
| `campaign_volunteers` | Volunteer-to-campaign assignment records |
| `field_updates` | Field notes and campaign progress updates |
| `impact_reports` | AI-assisted reports, edited drafts, review status, and structured metadata |
| `ai_generation_logs` | AI/fallback generation details and input snapshots |
| `report_versions` | Version history for saved, reviewed, revised, and approved reports |

---

## AI report workflow

The report workflow follows a controlled generation path:

1. User selects a campaign.
2. System checks available field updates and campaign context.
3. Frontend sends structured context to `/api/generate-report`.
4. Serverless route builds the AI prompt and calls Gemini 2.5 Flash.
5. API normalizes the response into a structured report object.
6. Frontend shows editable draft text and compact evidence/review cards.
7. User saves the draft, sends it for review, approves it, or marks it for revision.
8. The system stores generation details and report versions.

The structured report object includes:

```text
title
summary
evidenceUsed
missingEvidence
riskFlags
nextActions
reviewRequired
confidence
aiModel
generationSource
```

The Gemini key is never exposed to the browser. It should be configured only as a server-side environment variable.

---

## Local AI testing

The project includes a local AI testing harness.

Normal tests do not call Gemini:

```bash
npm test
```

Optional live Gemini testing can be run when a local `GEMINI_API_KEY` is available:

```bash
npm run test:ai-live
```

Without a key, the live AI test script exits safely and explains that the test was skipped.

Sample report cases are stored under:

```text
tests/fixtures/reportCases/
```

These fixtures are used to test structured report behavior with more realistic NGO scenarios.

---

## Screenshots

Screenshots will be added after the Stage 3 UI polish phase.

Planned screenshots:

| Screenshot | Purpose |
|---|---|
| Home page | Product positioning and landing page design |
| Auth / workspace setup | Account and NGO workspace onboarding |
| Dashboard overview | Campaign, volunteer, and workflow metrics |
| Workspace members | Role-based member management |
| AI report workspace | Editable draft and review metadata |
| Report history | Audit trail and version history |
| Contact page | Public inquiry path |

Planned path:

```text
screenshots/
  home.png
  workspace-setup.png
  dashboard.png
  workspace-members.png
  ai-report-workspace.png
  report-history.png
  contact.png
```

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

Create a `.env.local` file in the project root.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For deployed AI generation, configure this in Vercel Project Settings → Environment Variables:

```env
GEMINI_API_KEY=your-gemini-api-key
```

Do not prefix `GEMINI_API_KEY` with `VITE_`. It is a server-side secret used only by the Vercel API route.

The Formspree endpoint is configured in the contact service file. It is not a server-side secret.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

---

## Database setup

Database migrations are stored in `/database`.

For a fresh Supabase project, run the SQL files in numerical order, while keeping the notes below in mind.

Core setup files:

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
```

Important notes:

- Do not run `05_org_scoped_rls_do_not_run_yet.sql`; it was kept as an intermediate reference and is superseded by later hardening scripts.
- `11_rls_isolation_manual_test.sql` is for manual inspection only.
- Supabase Auth should have the Email provider enabled.
- Migrations `15` and `16` are follow-up hardening migrations for member-management RPCs. They are kept in the repo so the current branch history and database repair path remain clear.

---

## Available scripts

```bash
npm run dev          # start local development server
npm run build        # create production build
npm run preview      # preview production build locally
npm test             # run core tests
npm run test:ai-live # optional live Gemini structured-output test
```

---

## Testing and CI

The test suite currently covers:

- dashboard metrics
- volunteer assignment counting
- fallback report generation
- structured AI report validation
- Gemini API handler behavior
- role/permission utility behavior

GitHub Actions runs test and build checks on pull requests and pushes to `main`.

Manual QA is tracked in:

```text
QA_CHECKLIST.md
```

---

## Current limitations

The project is functional, but it is still an active build. Current limitations include:

- Google OAuth is not enabled yet; authentication uses email/password.
- New users currently create their own workspace first; admins can then add them to another workspace by email.
- Email invitation flow is not implemented yet.
- Role permissions are enforced mainly through UI/service logic plus organization-scoped RLS. More granular database policies can be added later.
- PDF/report export is not implemented yet.
- The dashboard still needs a final UI/UX polish pass to reduce text-heavy areas and improve mobile behavior.
- Advanced agentic orchestration is not implemented. The current AI flow is a controlled report-generation workflow.

---

## Roadmap

Near-term Stage 3 close-out:

- Refine report review workflow and status clarity
- Improve error handling, empty states, and loading states
- Final product UI/UX polish
- Architecture strengthening review
- Add concise documentation under `/docs`
- Final README, screenshots, and portfolio cleanup

Future product work:

- Proper invite flow for workspace members
- Role-specific onboarding for Admin vs Member signup
- PDF/report export
- More granular database-level permissions
- Better AI evaluation around unsupported claims
- Route-level code splitting if bundle size continues to grow

---

## Repository support

For bugs, suggestions, or project discussion, use GitHub Issues.
