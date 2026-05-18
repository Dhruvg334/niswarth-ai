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

test('generate-report API returns Gemini-generated draft when Gemini succeeds', async () => {
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
              { text: 'This is a complete report draft. It uses only the provided field evidence. The coordinator should review it before sharing.' },
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
        updates: [{ update_text: 'Students attended the session.', location: 'Pune', submitted_by: 'Aarav' }],
      },
    },
  }, res)

  assert.equal(res.statusCode, 200)
  assert.match(res.payload.summary, /complete report draft/i)
  assert.equal(res.payload.title, 'Weekend Learning Support Impact Draft')

  globalThis.fetch = previousFetch
  if (previousKey) process.env.GEMINI_API_KEY = previousKey
  else delete process.env.GEMINI_API_KEY
})
