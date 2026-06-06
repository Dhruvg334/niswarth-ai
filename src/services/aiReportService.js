import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

async function getAccessToken() {
  if (!isSupabaseConfigured) return ''
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error('Could not verify your session. Sign in again and retry.')
  return data?.session?.access_token || ''
}

export async function getDailyAiUsage(organizationId) {
  if (!organizationId) return { used: 0, limit: 20, remaining: 20 }

  const token = await getAccessToken()
  if (!token) return { used: 0, limit: 20, remaining: 20 }

  const params = new URLSearchParams({ organizationId })
  const response = await fetch(`/api/ai-usage?${params.toString()}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    return { used: 0, limit: 20, remaining: 20, unavailable: true, message: payload?.error || 'Could not load AI usage.' }
  }

  return payload
}

export async function generateAiImpactReport(campaign) {
  const token = await getAccessToken()

  const response = await fetch('/api/generate-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ campaign }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload?.error || 'AI report generation failed.'
    throw new Error(message)
  }

  return payload
}
