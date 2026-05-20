# Niswarth AI

**Niswarth AI** is a full-stack AI workflow platform for NGO campaign coordination, volunteer assignment, field update collection, and human-reviewed impact reporting.

The product is built around a practical social-impact workflow: NGOs often coordinate work through scattered chats, spreadsheets, field notes, volunteer updates, and manual reports. Niswarth AI brings those pieces into one organization-scoped workspace and uses AI to help draft impact reports from field evidence, while keeping humans in control before anything is approved.

**Live demo:** https://niswarth-ai.vercel.app/

---

## Product status

Niswarth AI is an active full-stack product build. The current version includes working authentication, organization-scoped workspaces, Supabase persistence, campaign and volunteer workflows, Gemini-assisted report drafting, Formspree-powered contact submission, and CI validation.

It is not positioned as a finished production SaaS. The next engineering focus areas are structured AI output, evidence mapping, audit trails, member management, and deeper documentation.

---

## What it does

Niswarth AI supports this NGO workflow:

```text
Account signup
→ NGO workspace creation
→ Campaign setup
→ Volunteer assignment
→ Field update collection
→ AI-assisted impact report draft
→ Human review
→ Approval / revision
→ Report history
```

Implemented capabilities:

- Email/password authentication with Supabase Auth
- Organization-scoped NGO workspaces
- Role-aware dashboard experience
- Campaign creation and admin deletion
- Volunteer profile creation and campaign assignment
- Field update collection per campaign
- Gemini 2.5 Flash report generation through a server-side Vercel API route
- Local fallback report generator when AI generation fails
- Editable report drafts with human review, approval, and revision flow
- Report history and workflow quality indicators
- Organization-scoped Row Level Security policies in Supabase
- Public contact form connected through Formspree
- CI workflow for tests and production build validation

---

## Why this exists

NGO teams often need to communicate impact, but the raw material for that impact is scattered across volunteers, field visits, campaign updates, photos, informal messages, and manual reports.

Niswarth AI focuses on one narrow problem:

> Convert campaign activity and field updates into structured, reviewable impact reporting without removing human judgment.

The system is intentionally designed around human-reviewed AI. AI drafts are treated as working drafts, not final claims.

---

## Engineering highlights

### Full-stack workflow architecture

The application uses a real backend workflow rather than static mock data:

- React + Vite frontend
- Supabase Auth for account access
- Supabase Postgres for campaign, volunteer, field update, and report records
- Supabase RLS for organization-scoped access control
- Vercel serverless function for Gemini report generation
- Formspree endpoint for public contact submissions
- GitHub Actions CI for test/build validation

### Organization-scoped access

Each user creates or belongs to an NGO workspace. Campaigns, volunteers, field updates, and reports are linked to an organization, and database policies restrict access based on organization membership.

This keeps the project closer to a real SaaS-style architecture instead of a shared public demo database.

### Human-in-the-loop AI reporting

AI-generated reports are not treated as final. A report draft can be:

- edited
- saved
- sent for review
- approved
- marked as needing revision

This workflow is designed to support accountability and reduce unsupported impact claims.

### Responsible fallback behavior

If the Gemini API request fails, the app does not break. It prepares a structured local draft from available field updates and clearly informs the user that the AI service could not complete the request.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Routing | React Router |
| Backend / Database | Supabase Auth, Supabase Postgres |
| Security | Supabase Row Level Security |
| AI generation | Gemini 2.5 Flash via Vercel serverless function |
| Contact form | Formspree endpoint |
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
  └── Contact service
        ↓
        Formspree endpoint

Supabase Postgres
  ├── organizations
  ├── profiles
  ├── organization_members
  ├── campaigns
  ├── volunteers
  ├── campaign_volunteers
  ├── field_updates
  └── impact_reports
```

---

## Data model

The database model is organized around NGO workspaces.

| Table | Purpose |
|---|---|
| `profiles` | App-level user profile linked to Supabase Auth |
| `organizations` | NGO/foundation workspace |
| `organization_members` | User membership and role inside an organization |
| `campaigns` | Campaign records under an organization |
| `volunteers` | Reusable volunteer profiles |
| `campaign_volunteers` | Volunteer-to-campaign assignments |
| `field_updates` | Field notes and campaign updates |
| `impact_reports` | AI-assisted drafts, edited reports, review status, and approval state |

---

## AI report workflow

The report workflow follows a constrained generation path:

1. User selects a campaign.
2. System checks whether field updates exist.
3. Frontend sends campaign context and updates to `/api/generate-report`.
4. Serverless function calls Gemini 2.5 Flash using a server-side API key.
5. Prompt instructs the model to use only provided evidence and avoid unsupported claims.
6. Draft is returned to the dashboard.
7. User edits and saves the draft.
8. User sends it for review, approves it, or marks it for revision.
9. Report history stores the review state.

The Gemini API key is never exposed to the browser.

---

## Screenshots

Screenshots will be added as the product UI stabilizes further.

Recommended screenshots for this repository:

| Screenshot | Purpose |
|---|---|
| Home page | Product positioning and landing page design |
| Auth / workspace setup | Account and NGO workspace onboarding |
| Dashboard overview | Campaign, volunteer, and workflow metrics |
| AI report workspace | Editable AI draft and human review flow |
| Report history | Review and approval trace |
| Contact page | Public inquiry path |

Planned path:

```text
screenshots/
  home.png
  workspace-setup.png
  dashboard.png
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
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key
```

For deployed AI generation, configure this in Vercel Project Settings → Environment Variables:

```env
GEMINI_API_KEY=your-gemini-api-key
```

Do not prefix `GEMINI_API_KEY` with `VITE_`. It is a server-side secret used only by the Vercel API route.

The Formspree endpoint is currently configured in the contact service file. It is not a server-side secret.

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

The Supabase database scripts are stored in `/database`.

For a fresh Supabase project, run the SQL files in numerical order, with one important exception:

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
```

Do not run `05_org_scoped_rls_do_not_run_yet.sql`; it was kept as an intermediate migration reference and is superseded by the later hardening script.

Use `11_rls_isolation_manual_test.sql` only for manual inspection and organization-isolation checks.

Supabase Auth should have the Email provider enabled for email/password signup.

---

## Available scripts

```bash
npm run dev       # start local development server
npm run build     # create production build
npm run preview   # preview production build locally
npm test          # run core workflow tests
```

---

## Testing and CI

The project includes tests for core logic around:

- dashboard metrics
- volunteer assignment counting
- fallback report generation
- API handler behavior for Gemini report generation

GitHub Actions runs test and build checks on pull requests and pushes to `main`.

Manual QA is tracked in:

```text
QA_CHECKLIST.md
```

---

## Current limitations

The current version is functional, but these areas are intentionally left for future hardening:

- Google OAuth is not enabled yet; authentication currently uses email/password.
- Member invitation and role management UI are not implemented yet.
- AI output is currently draft text, not structured JSON with explicit evidence mapping.
- AI prompt inputs, model metadata, evidence IDs, and generation traces are not yet stored as a dedicated audit trail.
- Report export to PDF is not implemented yet.
- Advanced agentic orchestration is planned for future work, but the current AI flow is a controlled report-generation workflow.

---

## Roadmap

Planned next improvements:

- Add structured AI report output with evidence used, missing evidence, risk flags, and next actions
- Add report evidence mapping from field updates
- Add AI generation audit logs and report version history
- Add evaluation checks for hallucination risk and unsupported claims
- Add member invitation and role management
- Add PDF/report export
- Add compact architecture documentation in `/docs`
- Improve performance through route-level code splitting if bundle size grows

---

## Repository support

For bugs, suggestions, or project discussion, use GitHub Issues.
