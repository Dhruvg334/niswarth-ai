import { createClient } from '@supabase/supabase-js'

const DEFAULT_DAILY_AI_LIMIT = Number(process.env.AI_DAILY_LIMIT_PER_USER || 20)

function getSupabaseServerConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  }
}

function getHeader(req, name) {
  const headers = req?.headers || {}
  return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || ''
}

function getBearerToken(req) {
  const authorization = getHeader(req, 'authorization')
  const match = typeof authorization === 'string' ? authorization.match(/^Bearer\s+(.+)$/i) : null
  return match?.[1] || ''
}

function getClientForToken(token) {
  const { url, anonKey } = getSupabaseServerConfig()
  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function normalizeLimit(value) {
  const limit = Number(value)
  if (!Number.isFinite(limit)) return 20
  return Math.max(1, Math.min(Math.trunc(limit), 200))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, anonKey } = getSupabaseServerConfig()
  if (!url || !anonKey) {
    return res.status(503).json({ error: 'Usage tracking is not configured yet.' })
  }

  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Sign in again to view AI usage.' })
  }

  const organizationId = typeof req.query?.organizationId === 'string' ? req.query.organizationId.trim() : ''
  if (!organizationId) {
    return res.status(400).json({ error: 'Workspace context is required.' })
  }

  const supabase = getClientForToken(token)
  const { data: userData, error: userError } = await supabase.auth.getUser(token)

  if (userError || !userData?.user?.id) {
    return res.status(401).json({ error: 'Your session could not be verified. Sign in again and retry.' })
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (membershipError || !membership?.id) {
    return res.status(403).json({ error: 'You do not have access to this workspace.' })
  }

  const { data: usage, error: usageError } = await supabase
    .from('ai_request_usage')
    .select('request_count, usage_date, updated_at')
    .eq('organization_id', organizationId)
    .eq('user_id', userData.user.id)
    .eq('usage_date', new Date().toISOString().slice(0, 10))
    .maybeSingle()

  if (usageError) {
    return res.status(500).json({ error: 'Could not load AI usage right now.' })
  }

  const limit = normalizeLimit(DEFAULT_DAILY_AI_LIMIT)
  const used = Number(usage?.request_count || 0)

  return res.status(200).json({
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    usageDate: usage?.usage_date || new Date().toISOString().slice(0, 10),
    updatedAt: usage?.updated_at || null,
  })
}
