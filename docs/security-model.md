# Security model

This document explains the security model currently used in Niswarth AI.

The project is still a prototype, but it now has a basic security baseline around auth, workspaces, roles, AI route protection, RLS, and usage limits.

## Main rules

```text
Use Supabase Auth for identity.
Resolve role from selected workspace membership.
Scope data by organisation.
Keep AI secrets server-side.
Verify API requests before calling Gemini.
Track and limit daily AI usage.
Avoid hidden creator/backdoor access.
```

## Authentication

Authentication uses Supabase email/password auth.

Frontend session handling lives in:

```text
src/contexts/AuthContext.jsx
src/services/authService.js
```

After login, the app loads the Supabase session and then loads all workspaces connected to the user.

## Workspace access

A signed-in user can belong to one or more workspaces through `organization_members`.

The selected workspace decides the active role and visible dashboard actions.

Important rule:

```text
active role = membership role in selected organisation
```

The role is not stored as one global user role.

## Roles

| Role | Intended access |
|---|---|
| Admin | manage members, campaigns, volunteers, updates, reports, and reviews |
| Coordinator | manage volunteers/updates, generate drafts, send reports for review |
| Reviewer | review reports, add notes, approve, or request revision |

UI permission helpers live in:

```text
src/utils/permissions.js
```

The UI hides actions by role, but important operations also need database/API protection. I already added server/database checks for the sensitive parts we found during testing, like Coordinator campaign deletion.

## Row-level security

Supabase RLS is used across organisation-scoped tables.

The core idea:

```text
users can access data only for organisations they belong to
```

Role-specific policies then decide who can create/update/delete certain records.

Examples:

- Admin can create/edit/delete campaigns.
- Coordinator can manage volunteers and field updates.
- Reviewer can review reports but not manage campaigns.

## RPC functions

Some operations use Supabase RPC functions because they need controlled database logic.

Important RPC areas:

```text
workspace creation
member management
AI usage registration
organisation-name checking
```

Member-management RPCs were hardened because earlier versions had ambiguous SQL column references. The hardened version is in:

```text
database/16_harden_member_management_rpc.sql
```

## AI route protection

The AI generation route is:

```text
POST /api/generate-report
```

It checks:

- method is POST
- Gemini key is configured
- request body is not too large
- campaign payload is valid
- at least one field update exists
- Supabase server auth config is available
- request has a valid Supabase access token
- user belongs to the campaign organisation
- daily AI usage limit has not been crossed

Shared API auth logic lives in:

```text
api/_supabaseServer.js
```

The route fails closed if server-side Supabase config is missing. This is safer than silently skipping auth verification.

## AI secrets

Frontend-safe variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Server-only variables:

```text
GEMINI_API_KEY
AI_DAILY_LIMIT_PER_USER
SUPABASE_URL
SUPABASE_ANON_KEY
```

I do not use a Supabase service-role key in the current app. If I ever add one later, it must stay server-side only and should not be exposed to React code.

## Daily AI usage limits

AI usage is tracked in:

```text
ai_request_usage
```

The default limit is 20 AI draft requests per user per organisation per day. This can be changed through:

```text
AI_DAILY_LIMIT_PER_USER
```

The UI shows usage in the report workspace, but the API route still enforces the real limit.

## Duplicate organisation names

Workspace creation blocks duplicate organisation names after normalising them. This prevents obvious duplicates like:

```text
Niswarth Foundation
niswarth foundation
Niswarth   Foundation
```

This is enough for the current prototype. Later I may move to unique organisation slugs instead of blocking display names globally.

## Monitoring and creator access

Vercel Web Analytics is used for traffic monitoring.

I did not build a creator console in Stage 3. If I add one later, it should be:

- normal-login protected
- checked by a server-side creator allowlist
- read-only
- aggregate-only
- not a hidden backdoor

## Known security limitations

Current limitations:

- Google OAuth is not enabled.
- Supabase Auth production email setup still needs custom SMTP later.
- CAPTCHA is not added to signup/contact yet.
- Invite flow is not built yet.
- The creator metrics console is not built yet.
- Some older migrations remain in the database folder for history.

These are acceptable for the Stage 3 prototype, but they should be reviewed before any real public/production use.
