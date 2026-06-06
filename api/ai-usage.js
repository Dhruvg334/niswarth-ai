import { getSupabaseServerConfig, normalizeLimit, verifyAuthenticatedRequest } from './_supabaseServer.js'

const DEFAULT_DAILY_AI_LIMIT = normalizeLimit(process.env.AI_DAILY_LIMIT_PER_USER || 20)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, anonKey } = getSupabaseServerConfig()
  if (!url || !anonKey) {
    return res.status(503).json({ error: 'Usage tracking is not configured yet.' })
  }

  const organizationId = typeof req.query?.organizationId === 'string' ? req.query.organizationId.trim() : ''
  if (!organizationId) {
    return res.status(400).json({ error: 'Workspace context is required.' })
  }

  const access = await verifyAuthenticatedRequest(req, { organizationId })
  if (!access.ok) {
    const message = access.status === 401
      ? 'Sign in again to view AI usage.'
      : access.error
    return res.status(access.status || 403).json({ error: message })
  }

  const { data: usage, error: usageError } = await access.supabase
    .from('ai_request_usage')
    .select('request_count, usage_date, updated_at')
    .eq('organization_id', organizationId)
    .eq('user_id', access.user.id)
    .eq('usage_date', new Date().toISOString().slice(0, 10))
    .maybeSingle()

  if (usageError) {
    return res.status(500).json({ error: 'Could not load AI usage right now.' })
  }

  const limit = DEFAULT_DAILY_AI_LIMIT
  const used = Number(usage?.request_count || 0)

  return res.status(200).json({
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    usageDate: usage?.usage_date || new Date().toISOString().slice(0, 10),
    updatedAt: usage?.updated_at || null,
  })
}
