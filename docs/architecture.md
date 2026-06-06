# Architecture

This is the current architecture of Niswarth AI after the Stage 3 build.

The project is a React/Vite app with Supabase for auth/database and Vercel API routes for server-side work. The main product flow is simple: an organisation creates campaigns, assigns volunteers, collects field updates, generates an AI-assisted report draft, and moves that report through review.

## High-level structure

```text
React app
  -> route pages
  -> shared UI components
  -> service layer
  -> Supabase client / Vercel API routes
  -> Supabase Postgres + Gemini API
```

The frontend handles the product experience. Supabase handles auth, database records, workspace membership, and RLS. Vercel API routes handle server-only tasks like Gemini calls and AI usage checks.

## Main folders

| Path | What I use it for |
|---|---|
| `src/pages/` | route-level pages like Home, Dashboard, Organisation, Login, Signup, Contact |
| `src/components/` | layout, dashboard panels, forms, auth components, shared UI pieces |
| `src/services/` | frontend data/API functions used by React components |
| `src/utils/` | pure logic for metrics, permissions, report workflow, AI parsing, options |
| `src/contexts/` | auth and selected workspace state |
| `api/` | Vercel serverless API routes |
| `database/` | Supabase SQL setup and migrations |
| `tests/` | automated tests using Node test runner |

The main route setup is in `src/App.jsx`.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | product landing page |
| `/use-cases` | Public | workflow explanation page, labelled as How it Works in the UI |
| `/about` | Public | project and builder context |
| `/contact` | Public | contact form and project discussion path |
| `/login` | Public | sign in |
| `/signup` | Public | sign up |
| `/workspace-setup` | Authenticated | create workspace after signup |
| `/demo` | Authenticated + workspace | main dashboard |
| `/organisation` | Authenticated + workspace | read-only organisation information page |

## Auth and workspace flow

Supabase Auth handles email/password login.

After login, `AuthContext` loads:

1. current Supabase session
2. workspaces connected to the user
3. selected workspace
4. the user role inside the selected workspace

The important decision here is that the role is not global. It comes from the selected organisation membership.

Example:

```text
same user
  -> Admin in Workspace A
  -> Reviewer in Workspace B
  -> Coordinator in Workspace C
```

This is why the app has workspace switching and why permissions are resolved from the selected workspace.

## Role model

| Role | Responsibility |
|---|---|
| Admin | workspace members, campaign management, volunteers/updates, report generation and review |
| Coordinator | volunteer/update work, report draft generation, send reports for review |
| Reviewer | review reports, add notes, approve, or request revision |

Role checks are in `src/utils/permissions.js`.

The UI uses these checks to show/hide actions. Sensitive operations are also protected through RLS, RPCs, or server-side checks where needed.

## Dashboard structure

The main dashboard lives in `src/pages/Demo.jsx`.

It currently handles:

- selected campaign overview
- campaign drawer
- metrics
- volunteer drawer
- assigned volunteers
- field updates
- AI report workspace
- workflow quality
- report history
- member panel access for Admin

`Demo.jsx` is large, but I am intentionally not splitting it in Stage 3. It has gone through many role and layout fixes, and splitting it now could create new bugs. I will split it in a later stage when I can retest the full dashboard properly.

Possible future split:

```text
DashboardHeader
CampaignOverview
VolunteerPoolDrawer
AssignedVolunteers
FieldUpdatesPanel
WorkflowQualityPanel
DashboardDrawers
```

## Service layer

The service layer keeps most Supabase/API calls out of components.

Important files:

| File | Purpose |
|---|---|
| `authService.js` | auth helpers |
| `workspaceService.js` | workspace loading/switching/setup |
| `memberService.js` | workspace member RPC calls |
| `campaignService.js` | campaigns, volunteers, assignments, field updates |
| `reportService.js` | reports, review flow, versions, audit logs |
| `aiReportService.js` | frontend calls to AI API routes |
| `contactService.js` | Formspree contact form submission |

This is not perfect yet, but it is much better than putting all Supabase calls directly inside the pages.

## API routes

Current Vercel API routes:

| Route | File | Purpose |
|---|---|---|
| `/api/generate-report` | `api/generate-report.js` | protected Gemini report generation |
| `/api/ai-usage` | `api/ai-usage.js` | current daily AI usage status |

Shared API helper:

```text
api/_supabaseServer.js
```

I added this so auth/session/workspace verification does not get copied across every API route.

## AI architecture

AI generation happens only through the server route. The frontend never sees the Gemini key.

Flow:

```text
Dashboard
  -> aiReportService.generateAiImpactReport
  -> POST /api/generate-report with Supabase token
  -> verify user/session/workspace
  -> check daily usage
  -> call Gemini
  -> normalize structured output
  -> return report draft
```

If Gemini fails, the app can still prepare a local fallback draft from the available field updates.

## Monitoring

I added Vercel Web Analytics for basic site traffic. I did not build a creator console in Stage 3 because traffic analytics and internal product metrics are different problems.

If I add a creator console later, it should be:

- normal-auth protected
- server-side creator allowlist
- read-only
- aggregate-only
- no hidden bypass/backdoor access

## Things I intentionally did not refactor now

- `Demo.jsx` split
- `AuthContext` rewrite
- database migration cleanup
- route-level lazy loading
- dashboard redesign after Phase 13

Reason: Stage 3 needed to close cleanly. These are better as Stage 4 work after the project is documented and stable.
