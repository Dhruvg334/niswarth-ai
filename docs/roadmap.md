# Roadmap

This roadmap starts after the Stage 3 close-out.

Niswarth AI now has the main campaign-to-report workflow working. Future work should improve onboarding, exports, monitoring, maintainability, and product maturity. I do not want to keep expanding Stage 3 endlessly.

## Current state after Stage 3

Completed:

- public product pages
- email/password auth
- workspace creation
- multi-workspace switching
- Admin / Coordinator / Reviewer roles
- campaign creation/edit/delete with Admin-only permissions
- volunteer profiles and campaign assignments
- volunteer phone/email fields
- field updates
- AI-assisted structured report drafting
- local fallback report generation
- daily AI usage limits
- report review workflow
- audit logs and report version history
- Vercel Web Analytics
- security/reliability hardening
- project documentation

## Product work for later stages

### 1. Invite flow

Current member flow:

```text
user signs up first
admin adds that email to workspace
user switches into workspace
```

Better future flow:

```text
admin sends invite
user signs up through invite
user joins intended workspace directly
```

This should include:

- pending invites table
- invite token
- role selected during invite
- expiry handling
- resend/cancel invite
- clear onboarding for Admin vs Member

### 2. Organisation settings

The current Organisation page is read-only. Later I can add a separate settings area for:

- organisation profile editing
- city/location update
- workspace display name
- organisation logo/avatar
- member-management shortcuts

This should stay separate from the read-only Organisation overview.

### 3. PDF/report export

Reports currently live inside the app. A useful next step is approved report export.

Possible export content:

- report title and summary
- evidence used
- review status
- report date/version
- organisation/campaign details
- PDF suitable for internal sharing or donor updates

### 4. Creator metrics console

Vercel Analytics covers traffic. A future creator console can cover product-level metrics:

- total organisations
- total accounts
- total campaigns
- total reports
- AI drafts today / last 7 days
- Gemini vs fallback usage

If I build this, it should be protected by normal login and a server-side creator allowlist. It should be read-only and aggregate-only.

## Engineering improvements

### 1. Dashboard component split

`Demo.jsx` is working but large. Later I should split it into smaller components like:

```text
DashboardHeader
CampaignOverview
VolunteerPoolDrawer
AssignedVolunteers
FieldUpdatesPanel
WorkflowQualityPanel
DashboardDrawers
```

I did not do this in Stage 3 because the dashboard was already tested after many fixes, and a split could create fresh bugs.

### 2. Route-level lazy loading

The build still shows a chunk-size warning. A possible improvement is:

```text
React.lazy for public pages and dashboard pages
```

This can wait until performance becomes a visible issue.

### 3. More granular database permissions

The current RLS/RPC setup is good for this prototype. Later, I can review:

- report-version policies
- AI log visibility rules
- creator/admin aggregate metrics
- stricter member-management flows

### 4. Better AI evaluation

Current AI tests check structure and a few unsupported-claim cases. Later I want better evaluation around:

- unsupported claims
- missing evidence
- confidence/readiness scoring
- reviewer feedback patterns
- generated draft quality across different NGO campaign types

### 5. Agentic workflow

The system is currently a controlled AI report-generation workflow, not an agentic system. I will add those features in future stages.

Possible future agentic work:

- evidence checker
- report quality reviewer
- missing-information planner
- reviewer-note assistant
- campaign readiness advisor

These should only be added after the current reporting workflow is stable and properly tested.

## Presentation improvements

### 1. Screenshots

Add real screenshots for:

- Home page
- Dashboard
- AI Report Workspace
- Report History / Audit Trail
- Organisation overview

### 2. Portfolio write-up

Prepare a short project explanation for portfolio/recruiter use:

- what problem it solves
- what I built
- technical stack
- main engineering decisions
- what I learned
- future improvements

### 3. Resume bullets

Convert this project into 2-4 strong resume bullets focused on:

- full-stack AI workflow system
- Supabase Auth/RLS/workspaces
- Gemini structured report generation
- audit/version history and usage limits

## Stage 4 direction

Stage 4 should not be random feature addition. It should pick one direction:

```text
Option A: make this more production-ready
Option B: make it stronger for portfolio/recruiting
Option C: add invite/export/creator-console features
Option D: improve AI evaluation and agentic features
```

I should choose one direction instead of trying to do all of them together.
