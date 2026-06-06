# AI workflow

Niswarth AI uses AI to prepare report drafts from campaign data and field updates. The report is still reviewed by a person before it is approved.

The current system is a controlled AI report-generation workflow, not an agentic system. I will add agentic features in future stages when the base workflow is stable enough for it.

## Main flow

```text
selected campaign
  -> field updates, volunteers, campaign context
  -> /api/generate-report
  -> Gemini 2.5 Flash
  -> structured report object
  -> editable report workspace
  -> save / send for review / approve / needs revision
  -> audit log and version history
```

## Frontend entry point

The dashboard uses:

```text
src/services/aiReportService.js
```

Important functions:

```text
generateAiImpactReport
getDailyAiUsage
```

`generateAiImpactReport` sends campaign context to `/api/generate-report` with the Supabase session token in the `Authorization` header.

`getDailyAiUsage` calls `/api/ai-usage` so the UI can show how many AI drafts the user has used today.

## Server route

AI generation runs through:

```text
api/generate-report.js
```

This route:

1. accepts only `POST`
2. checks `GEMINI_API_KEY`
3. rejects oversized request bodies
4. sanitizes campaign, volunteer, and field-update payloads
5. verifies the Supabase session token
6. verifies workspace membership
7. checks and registers daily AI usage
8. builds the structured report prompt
9. calls Gemini
10. validates and normalizes the structured response
11. returns the structured report to the frontend

The route fails closed if server-side Supabase auth config is missing. I made this choice because AI generation should not become publicly callable because of a missing environment variable.

## Model and prompt

Current model:

```text
gemini-2.5-flash
```

Prompt builder:

```text
src/utils/aiReportPrompt.js
```

The prompt asks Gemini to return structured JSON instead of only a paragraph draft.

Expected shape:

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

## Structured output handling

Structured output logic lives in:

```text
src/utils/structuredReport.js
```

It handles:

- parsing model output
- repairing common output issues
- normalising field names
- removing duplicate action aliases
- validating required fields
- repairing low or invalid confidence values
- setting generation source and model name

This exists because model output can still be inconsistent even when the prompt asks for JSON.

## What the report workspace shows

The dashboard shows the structured AI output as compact sections:

```text
Evidence used
Missing info
Review cautions
Next steps
```

I kept these visible because they make the draft easier to review. I avoided showing raw technical metadata directly in the main workflow.

## Fallback report generation

If Gemini is unavailable, the app uses:

```text
src/utils/generateImpactReport.js
```

The fallback generator prepares a basic structured draft from available field updates. It also marks the generation source as local fallback.

This keeps the report workspace usable even if the AI API fails.

## Daily AI usage

AI draft usage is tracked in:

```text
ai_request_usage
```

The UI shows usage under the Generate Draft button, for example:

```text
AI drafts today: 1 of 20 used
```

The backend remains the source of truth. Even if the frontend counter is stale, `/api/generate-report` still checks the daily limit before calling Gemini.

## Review workflow

Current report statuses:

```text
draft
under_review
needs_revision
approved
```

Main flow:

```text
draft -> under_review -> approved
under_review -> needs_revision -> under_review
```

Admins and Reviewers can review reports. Coordinators can prepare drafts and send them for review, but they cannot approve final reports.

## Audit logs and versions

AI generation logs are stored in:

```text
ai_generation_logs
```

Report version history is stored in:

```text
report_versions
```

I added these because report drafting and review should be traceable. The app should be able to show how a report changed and what AI/fallback source was used.

## Live AI testing

Most tests do not call Gemini. For live model testing, use:

```bash
npm run test:ai-live
```

with `GEMINI_API_KEY` set locally.

The live test is optional. CI should not depend on Gemini availability or API credits.
