import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/generate-report.js'

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(name, value) {
      this.headers[name] = name
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

test('generate-report API returns structured Gemini report when Gemini succeeds', async () => {
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
                  summary: 'Weekend Learning Support is active in Pune and uses the available field updates as the basis for this draft. Students attended the session and volunteers distributed stationery kits. The coordinator should verify attendance, locations, and privacy-sensitive details before external sharing.',
                  evidence_used: [
                    { field_update_id: 'u1', note: 'Used attendance note from the field update.' },
                  ],
                  missing_evidence: ['Beneficiary feedback is missing.'],
                  risk_flags: ['Do not claim learning improvement without assessment data.'],
                  next_actions: ['Collect one volunteer observation.'],
                  review_required: true,
                  confidence: 78,
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
  assert.match(res.payload.summary, /Students attended/)
  assert.equal(res.payload.title, 'Weekend Learning Support Impact Draft')
  assert.equal(res.payload.evidenceUsed.length, 1)
  assert.equal(res.payload.missingEvidence[0], 'Beneficiary feedback is missing.')
  assert.equal(res.payload.riskFlags[0], 'Do not claim learning improvement without assessment data.')
  assert.equal(res.payload.nextActions[0], 'Collect one volunteer observation.')
  assert.equal(res.payload.aiModel, 'gemini-2.5-flash')
  assert.equal(res.payload.generationSource, 'gemini-2.5-flash')

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
  assert.match(res.payload.error, /invalid structured output/i)

  globalThis.fetch = previousFetch
  if (previousKey) process.env.GEMINI_API_KEY = previousKey
  else delete process.env.GEMINI_API_KEY
})
