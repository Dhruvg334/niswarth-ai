# QA Checklist

## Purpose

This checklist defines the minimum validation required before merging or deploying changes to Niswarth AI. It focuses on workflow correctness, responsible AI behavior, data persistence, and user experience reliability.

---

## Environment Validation

- [ ] Local environment variables are configured in `.env.local`.
- [ ] Supabase project URL is valid.
- [ ] Supabase publishable key is valid.
- [ ] Gemini API key is configured only in the server/deployment environment.
- [ ] `.env` and `.env.local` are not committed.

---

## Build and Test Validation

- [ ] `npm test` passes.
- [ ] `npm run build` completes successfully.
- [ ] No dependency install errors occur.
- [ ] No private/internal registry URLs appear in `package-lock.json`.
- [ ] Vercel deployment completes successfully.

---

## Dashboard Validation

- [ ] Dashboard loads without console errors.
- [ ] Campaign records load from Supabase.
- [ ] Local fallback data is used only when backend configuration is unavailable.
- [ ] Global volunteer metrics count unique volunteers correctly.
- [ ] Volunteer coordination metrics update when campaign selection changes.
- [ ] Workflow quality indicators remain readable and non-intrusive.

---

## Campaign Workflow

- [ ] A new campaign can be created.
- [ ] Required campaign fields are validated.
- [ ] Invalid date ranges are blocked.
- [ ] Created campaign appears in the dashboard.
- [ ] Created campaign is stored in Supabase.

---

## Volunteer Workflow

- [ ] A new volunteer can be created.
- [ ] Required volunteer fields are validated.
- [ ] Unavailable volunteers are not assignable.
- [ ] Volunteers already assigned to the selected campaign are not duplicated.
- [ ] Volunteers assigned to other campaigns are labelled appropriately.
- [ ] Volunteer assignment is stored in Supabase.

---

## Field Update Workflow

- [ ] A field update can be added to the selected campaign.
- [ ] Empty or weak field updates are blocked.
- [ ] Submitted-by information is captured.
- [ ] Field update appears in the selected campaign workflow.
- [ ] Field update is stored in Supabase.

---

## AI Report Workflow

- [ ] Report generation is blocked when no field updates exist.
- [ ] Gemini report generation works when the API is available.
- [ ] Fallback report generation works when the AI request fails.
- [ ] Users are informed when fallback generation is used.
- [ ] Generated report draft is editable.
- [ ] Draft can be saved.
- [ ] Draft can be sent for review.
- [ ] Report can be marked as needing revision.
- [ ] Report can be approved.
- [ ] Report status changes are stored in Supabase.

---

## Responsible AI Validation

- [ ] AI output is presented as a draft, not final content.
- [ ] Human review is required before sharing or publishing.
- [ ] Reports are generated only from available field updates.
- [ ] Unsupported impact claims are not introduced by the fallback generator.
- [ ] AI failure does not break the report workflow.
- [ ] Review notes can be added before revision decisions.

---

## UI and UX Validation

- [ ] Dashboard remains usable on desktop.
- [ ] Dashboard remains usable on mobile.
- [ ] Primary workflows are not hidden behind confusing controls.
- [ ] Success and error messages appear near the related action.
- [ ] Report workspace remains readable and uncluttered.
- [ ] Navigation links work across all pages.

---

## Deployment Validation

- [ ] Vercel environment variables are configured.
- [ ] Production deployment opens successfully.
- [ ] Dashboard works on the deployed site.
- [ ] Supabase writes work from the deployed site.
- [ ] Gemini generation or fallback behavior works from the deployed site.