import { createClient } from '@supabase/supabase-js'

export function getSupabaseServerConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  }
}

export function getHeader(req, name) {
  const headers = req?.headers || {}
  return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || ''
}

export function getBearerToken(req) {
  const authorization = getHeader(req, 'authorization')
  const match = typeof authorization === 'string' ? authorization.match(/^Bearer\s+(.+)$/i) : null
  return match?.[1] || ''
}

export function hasSupabaseServerConfig() {
  const { url, anonKey } = getSupabaseServerConfig()
  return Boolean(url && anonKey)
}

export function getClientForToken(token) {
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

export function getSupabaseConfigError(message = 'Server-side Supabase auth is not configured yet.') {
  return { ok: false, status: 503, error: message }
}

export async function verifyAuthenticatedRequest(req, { requireOrganizationId = true, organizationId = '' } = {}) {
  if (req?.__verifiedAccess) {
    return req.__verifiedAccess
  }

  if (!hasSupabaseServerConfig()) {
    return getSupabaseConfigError()
  }

  const token = getBearerToken(req)
  if (!token) {
    return { ok: false, status: 401, error: 'Sign in again before continuing.' }
  }

  const supabase = getClientForToken(token)
  const { data: userData, error: userError } = await supabase.auth.getUser(token)

  if (userError || !userData?.user?.id) {
    return { ok: false, status: 401, error: 'Your session could not be verified. Sign in again and retry.' }
  }

  if (requireOrganizationId && !organizationId) {
    return { ok: false, status: 400, error: 'Workspace context is required.' }
  }

  if (!organizationId) {
    return { ok: true, supabase, user: userData.user, membership: null }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('organization_id', organizationId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (membershipError) {
    return { ok: false, status: 403, error: 'Workspace access could not be verified.' }
  }

  if (!membership?.id) {
    return { ok: false, status: 403, error: 'You do not have access to this workspace.' }
  }

  return { ok: true, supabase, user: userData.user, membership }
}

export function normalizeLimit(value, fallback = 20) {
  const limit = Number(value)
  if (!Number.isFinite(limit)) return fallback
  return Math.max(1, Math.min(Math.trunc(limit), 200))
}
