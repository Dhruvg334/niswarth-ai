import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/generate-report.js'

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(name, value) {
      this.headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.payload = payload
      return this
    },
  }
}

test('generate-report API rejects non-POST requests', async () => {
  const res = createMockResponse()
  await handler({ method: 'GET' }, res)

  assert.equal(res.statusCode, 405)
  assert.equal(res.payload.error, 'Method not allowed')
})

test('generate-report API returns service unavailable when Gemini key is missing', async () => {
  const previousKey = process.env.GEMINI_API_KEY
  delete process.env.GEMINI_API_KEY

  const res = createMockResponse()
  await handler({ method: 'POST', body: { campaign: { id: 'c1', title: 'Campaign', updates: [{ update_text: 'Update' }] } } }, res)

  assert.equal(res.statusCode, 503)
  assert.match(res.payload.error, /not configured/i)

  if (previousKey) process.env.GEMINI_API_KEY = previousKey
})



test('generate-report API rejects oversized report requests before calling Gemini', async () => {
  const previousKey = process.env.GEMINI_API_KEY
  process.env.GEMINI_API_KEY = 'test-key'

  const res = createMockResponse()
  await handler({
    method: 'POST',
    body: {
      campaign: {
        id: 'c1',
        title: 'Campaign',
        updates: [{ update_text: 'x'.repeat(70_000) }],
      },
    },
  }, res)

  assert.equal(res.statusCode, 413)
  assert.match(res.payload.error, /too large/i)

  if (previousKey) process.env.GEMINI_API_KEY = previousKey
  else delete process.env.GEMINI_API_KEY
})

test('generate-report API rejects report generation without field updates', async () => {
  const previousKey = process.env.GEMINI_API_KEY
  process.env.GEMINI_API_KEY = 'test-key'

  const res = createMockResponse()
  await handler({ method: 'POST', body: { campaign: { id: 'c1', title: 'Campaign', updates: [] } } }, res)

  assert.equal(res.statusCode, 400)
  assert.match(res.payload.error, /field update/i)

  if (previousKey) process.env.GEMINI_API_KEY = previousKey
  else delete process.env.GEMINI_API_KEY
})

test('generate-report API returns structured Gemini draft when Gemini succeeds', async () => {
  const previousKey = process.env.GEMINI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.GEMINI_API_KEY = 'test-key'

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      candidates: [
        {
          finishReason: 'STOP',
          content: {
            parts: [
              {
                text: JSON.stringify({
                  title: 'Weekend Learning Support Impact Draft',
                  summary: 'This is a complete report draft based only on the provided field evidence. The campaign team recorded a learning support session in Pune and noted student attendance. The coordinator should verify all details before sharing externally.',
                  evidence_used: [{ field_update_id: 'u1', note: 'Students attended the session.' }],
                  missing_evidence: ['Beneficiary feedback is not available yet.'],
                  risk_flags: ['Do not claim learning improvement without assessment data.'],
                  next_actions: ['Verify attendance count before approval.'],
                  review_required: true,
                  confidence: 76,
                }),
              },
            ],
          },
        },
      ],
      usageMetadata: { totalTokenCount: 120 },
    }),
  })

  const res = createMockResponse()
  await handler({
    method: 'POST',
    body: {
      campaign: {
        id: 'c1',
        title: 'Weekend Learning Support',
        type: 'education',
        location: 'Pune',
        goal: 'Support learning sessions.',
        updates: [{ id: 'u1', update_text: 'Students attended the session.', location: 'Pune', submitted_by: 'Aarav' }],
      },
    },
  }, res)

  assert.equal(res.statusCode, 200)
  assert.match(res.payload.summary, /complete report draft/i)
  assert.equal(res.payload.title, 'Weekend Learning Support Impact Draft')
  assert.equal(res.payload.generationSource, 'gemini')
  assert.equal(res.payload.aiModel, 'gemini-2.5-flash')
  assert.equal(res.payload.evidenceUsed.length, 1)
  assert.equal(res.payload.missingEvidence.length, 1)
  assert.equal(res.payload.riskFlags.length, 1)
  assert.equal(res.payload.nextActions.length, 1)
  assert.equal(Object.hasOwn(res.payload, 'suggestedActions'), false)

  globalThis.fetch = previousFetch
  if (previousKey) process.env.GEMINI_API_KEY = previousKey
  else delete process.env.GEMINI_API_KEY
})

test('generate-report API rejects invalid structured Gemini output', async () => {
  const previousKey = process.env.GEMINI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.GEMINI_API_KEY = 'test-key'

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      candidates: [
        {
          finishReason: 'STOP',
          content: {
            parts: [{ text: 'This is not JSON.' }],
          },
        },
      ],
    }),
  })

  const res = createMockResponse()
  await handler({
    method: 'POST',
    body: {
      campaign: {
        id: 'c1',
        title: 'Weekend Learning Support',
        updates: [{ id: 'u1', update_text: 'Students attended the session.' }],
      },
    },
  }, res)

  assert.equal(res.statusCode, 502)
  assert.match(res.payload.error, /invalid structured draft/i)

  globalThis.fetch = previousFetch
  if (previousKey) process.env.GEMINI_API_KEY = previousKey
  else delete process.env.GEMINI_API_KEY
})

test('generate-report API derives confidence when Gemini returns zero confidence', async () => {
  const previousKey = process.env.GEMINI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.GEMINI_API_KEY = 'test-key'

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      candidates: [
        {
          finishReason: 'STOP',
          content: {
            parts: [
              {
                text: JSON.stringify({
                  title: 'Tree Plantation Impact Draft',
                  summary: 'This draft is based on available field notes for a plantation campaign. The update confirms early activity in the selected location and should be treated as a working summary. The team should verify the numbers and schedule before sharing the report externally.',
                  evidence_used: [{ field_update_id: 'u1', note: 'Initial field activity was recorded.' }],
                  missing_evidence: ['Exact plantation date is missing.'],
                  risk_flags: ['Do not claim environmental outcomes yet.'],
                  next_actions: ['Confirm event date and target tree count.'],
                  review_required: true,
                  confidence: 0,
                }),
              },
            ],
          },
        },
      ],
    }),
  })

  const res = createMockResponse()
  await handler({
    method: 'POST',
    body: {
      campaign: {
        id: 'c1',
        title: 'Tree Plantation Drive',
        updates: [{ id: 'u1', update_text: 'Initial field activity was recorded.' }],
      },
    },
  }, res)

  assert.equal(res.statusCode, 200)
  assert.ok(res.payload.confidence >= 35)
  assert.notEqual(res.payload.confidence, 0)

  globalThis.fetch = previousFetch
  if (previousKey) process.env.GEMINI_API_KEY = previousKey
  else delete process.env.GEMINI_API_KEY
})
