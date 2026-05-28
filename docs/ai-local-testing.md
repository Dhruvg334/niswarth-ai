# Local AI Testing

Niswarth AI uses two levels of AI testing.

## 1. Normal tests

Run:

```bash
npm test
```

These tests do not call Gemini. They validate the local structured-report parser, fallback generator, API handler behavior, and report metadata shape.

This keeps CI stable and avoids exposing API keys.

## 2. Optional live Gemini test

Run this only when you want to test real Gemini behavior locally.

### Windows Command Prompt

```cmd
set GEMINI_API_KEY=your_key_here
npm run test:ai-live
```

### PowerShell

```powershell
$env:GEMINI_API_KEY="your_key_here"
npm run test:ai-live
```

### macOS / Linux

```bash
GEMINI_API_KEY=your_key_here npm run test:ai-live
```

The script uses sample NGO cases from:

```text
tests/fixtures/reportCases/
```

It checks that Gemini returns structured output with:

- report title
- summary
- evidence used
- missing evidence
- review cautions
- next actions
- confidence score
- human review requirement

It also checks that obvious unsupported claims from the fixture are not introduced.

## Test a different fixture

```bash
npm run test:ai-live -- health-awareness.json
npm run test:ai-live -- animal-welfare.json
```

## Important rules

- Never commit `.env` or `.env.local`.
- `GEMINI_API_KEY` must remain server-side or local-only.
- Mock/structured tests should run in CI.
- Live model tests are optional and should not block GitHub Actions.
