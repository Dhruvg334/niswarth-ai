import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/ai-usage.js'

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

test('ai-usage API rejects non-GET requests', async () => {
  const res = createMockResponse()
  await handler({ method: 'POST' }, res)

  assert.equal(res.statusCode, 405)
  assert.equal(res.payload.error, 'Method not allowed')
})

test('ai-usage API returns unavailable when Supabase env is missing', async () => {
  const previousUrl = process.env.SUPABASE_URL
  const previousAnon = process.env.SUPABASE_ANON_KEY
  const previousViteUrl = process.env.VITE_SUPABASE_URL
  const previousViteAnon = process.env.VITE_SUPABASE_ANON_KEY

  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_ANON_KEY
  delete process.env.VITE_SUPABASE_URL
  delete process.env.VITE_SUPABASE_ANON_KEY

  const res = createMockResponse()
  await handler({ method: 'GET', query: { organizationId: 'org-1' }, headers: { authorization: 'Bearer test' } }, res)

  assert.equal(res.statusCode, 503)
  assert.match(res.payload.error, /not configured/i)

  if (previousUrl) process.env.SUPABASE_URL = previousUrl
  if (previousAnon) process.env.SUPABASE_ANON_KEY = previousAnon
  if (previousViteUrl) process.env.VITE_SUPABASE_URL = previousViteUrl
  if (previousViteAnon) process.env.VITE_SUPABASE_ANON_KEY = previousViteAnon
})
