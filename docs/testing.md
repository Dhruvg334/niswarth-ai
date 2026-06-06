# Testing

This document explains how I test Niswarth AI right now.

The project uses Node's built-in test runner for automated tests, but manual QA is still important because many flows depend on Supabase, Vercel API routes, auth sessions, roles, and browser behavior.

## Commands

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run production build:

```bash
npm run build
```

Run local dev server:

```bash
npm run dev
```

Optional live Gemini test:

```bash
npm run test:ai-live
```

## What automated tests cover

Current tests cover:

- dashboard metric calculations
- fallback report generation
- structured report parsing and normalization
- API handler behavior for Gemini report generation
- AI usage API behavior
- role/permission helpers
- report workflow rules

Tests live in:

```text
tests/
```

## What still needs manual testing

Manual testing is still needed for:

- Supabase Auth signup/login
- workspace setup
- workspace switching
- RLS behavior with real accounts
- real Gemini API calls
- Vercel Analytics visibility
- mobile layout quality
- full dashboard UX by role
- Formspree submission behavior

## Normal local test sequence

Before committing a normal code change:

```bash
npm test
npm run build
npm run dev
```

Then test the route or workflow that changed.

## Role testing

Use three test accounts:

```text
Admin: main creator/admin account
Coordinator: coordinator test account
Reviewer: reviewer test account
```

### Admin checks

Admin should be able to:

- create/edit/delete campaigns
- manage members
- manage volunteers and field updates
- generate reports
- send reports for review
- approve or request revision

### Coordinator checks

Coordinator should be able to:

- view campaigns
- manage volunteers and field updates
- generate report drafts
- send reports for review

Coordinator should not be able to:

- create/edit/delete campaigns
- manage members
- approve final reports

### Reviewer checks

Reviewer should be able to:

- view campaign/report context
- view report history
- approve under-review reports
- mark reports as needing revision
- add review notes

Reviewer should not be able to:

- create/edit/delete campaigns
- add volunteers or field updates
- generate AI drafts
- manage members

## AI generation test

Use a campaign with at least one field update.

Example campaign:

```text
Title: Reading Support Test
Type: Education
Location: Delhi
Status: Active
Goal: Help students improve reading confidence through weekend sessions.
```

Example field update:

```text
16 students attended the reading support session. Volunteers helped them read short Hindi and English stories.
```

Expected:

- Generate Draft works for Admin/Coordinator.
- Structured cards appear: evidence, missing info, risks, next actions.
- Daily AI usage count updates after generation.
- Save Draft works.
- Report can be sent for review.

## Daily AI usage test

The report workspace should show a line like:

```text
AI drafts today: 1 of 20 used
```

To test the limit on Vercel, temporarily set:

```text
AI_DAILY_LIMIT_PER_USER=2
```

Then generate reports from the same user/workspace three times.

Expected:

- first two requests work
- third request is blocked with a daily limit message
- `/api/generate-report` returns 429

After testing, set the limit back or remove the override.

## Duplicate organisation test

Use a fresh test account and try to create a workspace with the same organisation name as an existing workspace.

Also test spacing/case variants:

```text
Niswarth Foundation
niswarth foundation
Niswarth   Foundation
```

Expected:

- duplicate creation is blocked
- only one organisation exists with that normalised name

## Logged-out AI route test

On deployed preview or production, log out and run this in browser console:

```js
fetch('/api/generate-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaign: {
      id: 'fake-campaign',
      title: 'Unauthorized Test',
      organization_id: 'fake-org'
    },
    fieldUpdates: [
      { content: 'This should not be accepted.' }
    ],
    volunteers: []
  })
}).then(async (res) => {
  console.log('Status:', res.status);
  console.log(await res.text());
});
```

Expected:

```text
Status: 401
```

Gemini should not be called.

## Public route test

Check:

```text
/
/use-cases
/about
/contact
/organisation
/demo
```

After deployment, refresh each route directly. Vercel should serve the React app correctly because of `vercel.json` SPA rewrite.

## Vercel Analytics test

After deployment:

1. open the live site
2. visit a few routes
3. go to Vercel → Project → Analytics
4. wait a little for data to appear

Analytics data may not show instantly and can be affected by browser content blockers.

## Live Gemini test

The optional live test script uses fixtures from:

```text
tests/fixtures/reportCases/
```

Run with local key:

```bash
GEMINI_API_KEY=your_key_here npm run test:ai-live
```

On Windows Command Prompt:

```cmd
set GEMINI_API_KEY=your_key_here
npm run test:ai-live
```

This is not part of normal CI. I only use it when changing AI prompt/structured output behavior.
