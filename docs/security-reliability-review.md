# Security and reliability review

This note records the Stage 3 security/reliability pass. It is intentionally practical and scoped to the current prototype.

## What was hardened in this phase

### AI report API

`/api/generate-report` now performs server-side checks before calling Gemini:

- rejects non-POST requests
- rejects oversized request bodies
- sanitizes campaign, volunteer, and field-update payloads before prompt construction
- limits field updates and volunteer records sent to the model
- verifies the Supabase session when server Supabase env vars are configured
- verifies the user belongs to the selected organisation
- records/checks per-user, per-organisation daily AI request usage through Supabase RPC
- returns a clear 429 response when the daily limit is reached

The Gemini API key remains server-only and should only be configured as `GEMINI_API_KEY` in Vercel.

### Workspace creation

Workspace creation now blocks duplicate organisation names through the app RPC path. Names are normalized by trimming, lowering case, and collapsing repeated spaces before comparison.

If a member tries to create a workspace with the same organisation name, the RPC asks them to contact the existing organisation admin instead.

### AI usage tracking

New table:

```text
ai_request_usage
```

This stores daily request counts per organisation and user. It does not store prompt text or generated report content.

## Environment variables

Frontend-safe variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Server-only variables:

```text
GEMINI_API_KEY
AI_DAILY_LIMIT_PER_USER
```

Optional server-side aliases:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

Do not expose service-role keys to the frontend. This app does not require a service-role key for the current AI route.

## Manual checks before merge

- Generate an AI report while signed in.
- Confirm report generation still works for Admin and Coordinator.
- Confirm logged-out users cannot call `/api/generate-report` in production once Supabase server env vars are set.
- Confirm an organisation with the same name cannot be created twice through workspace setup.
- Confirm daily request limit returns a clear user-facing fallback path.
- Confirm `.env.local` is not committed.
- Confirm no Gemini key appears in frontend source, README, or docs.

## Deferred items

These are better suited for the monitoring/creator-console phase or a later production hardening phase:

- Vercel Web Analytics and Speed Insights setup
- creator-only aggregate monitoring page
- CAPTCHA for signup/contact forms
- custom SMTP for production Supabase Auth emails
- external error tracking such as Sentry
- stricter IP-level rate limiting through hosting/WAF rules
- route-level code splitting for bundle-size reduction
