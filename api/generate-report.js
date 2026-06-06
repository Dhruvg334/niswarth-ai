import { DEFAULT_AI_MODEL, normalizeStructuredReport, parseStructuredText } from '../src/utils/structuredReport.js'
import { buildStructuredReportPrompt } from '../src/utils/aiReportPrompt.js'
import { hasSupabaseServerConfig, normalizeLimit, verifyAuthenticatedRequest } from './_supabaseServer.js'

const GEMINI_MODEL = DEFAULT_AI_MODEL
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const MAX_BODY_BYTES = 60_000
const MAX_FIELD_UPDATES = 12
const MAX_VOLUNTEERS = 10
const DEFAULT_DAILY_AI_LIMIT = normalizeLimit(process.env.AI_DAILY_LIMIT_PER_USER || 20)

function getApproxBodySize(req) {
  try {
    return Buffer.byteLength(JSON.stringify(req?.body || {}), 'utf8')
  } catch {
    return MAX_BODY_BYTES + 1
  }
}

function cleanText(value, maxLength = 500) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function sanitizeCampaignPayload(campaign) {
  const updates = Array.isArray(campaign?.updates) ? campaign.updates.slice(0, MAX_FIELD_UPDATES) : []
  const volunteers = Array.isArray(campaign?.volunteers) ? campaign.volunteers.slice(0, MAX_VOLUNTEERS) : []
  const organizationId = cleanText(campaign?.organizationId || campaign?.organization_id, 80)

  return {
    id: cleanText(campaign?.id, 80),
    organizationId,
    title: cleanText(campaign?.title, 140),
    type: cleanText(campaign?.rawType || campaign?.type, 80),
    location: cleanText(campaign?.location, 140),
    status: cleanText(campaign?.rawStatus || campaign?.status, 80),
    goal: cleanText(campaign?.goal, 520),
    metrics: campaign?.metrics && typeof campaign.metrics === 'object' ? campaign.metrics : {},
    volunteers: volunteers.map((volunteer) => ({
      id: cleanText(volunteer?.id, 80),
      name: cleanText(volunteer?.name, 100),
      role: cleanText(volunteer?.role, 120),
      assignmentRole: cleanText(volunteer?.assignmentRole, 120),
    })),
    updates: updates
      .map((update, index) => ({
        id: cleanText(update?.id, 80) || `update-${index + 1}`,
        update_text: cleanText(update?.update_text || update?.text || update, 650),
        location: cleanText(update?.location, 140),
        submitted_by: cleanText(update?.submitted_by, 140),
        evidence_type: cleanText(update?.evidence_type, 80),
      }))
      .filter((update) => update.update_text.length > 0),
  }
}

async function verifyRequestAccess(req, campaign) {
  if (req?.__verifiedAccess) {
    const access = req.__verifiedAccess
    const { data: rateLimit, error: limitError } = await access.supabase.rpc('register_ai_generation_request', {
      p_organization_id: campaign.organizationId,
      p_daily_limit: DEFAULT_DAILY_AI_LIMIT,
    })

    if (limitError) {
      return { ok: false, status: 429, error: 'AI request limit could not be checked. Try again shortly.' }
    }

    return { ...access, usage: rateLimit || null }
  }

  if (!hasSupabaseServerConfig()) {
    console.error('Supabase server env is not configured for /api/generate-report. AI generation is blocked until auth verification is available.')
    return { ok: false, status: 503, error: 'AI generation is temporarily unavailable because server auth is not configured.' }
  }

  const access = await verifyAuthenticatedRequest(req, {
    organizationId: campaign.organizationId,
  })

  if (!access.ok) {
    const message = access.status === 401
      ? 'Sign in again before generating an AI report.'
      : access.error
    return { ...access, error: message }
  }

  const { data: rateLimit, error: limitError } = await access.supabase.rpc('register_ai_generation_request', {
    p_organization_id: campaign.organizationId,
    p_daily_limit: DEFAULT_DAILY_AI_LIMIT,
  })

  if (limitError) {
    return { ok: false, status: 429, error: 'AI request limit could not be checked. Try again shortly.' }
  }

  if (rateLimit && rateLimit.allowed === false) {
    return {
      ok: false,
      status: 429,
      error: 'Daily AI draft limit reached for this account. Try again tomorrow or use the saved drafts already created today.',
      usage: rateLimit,
    }
  }

  return { ok: true, user: access.user, membership: access.membership, usage: rateLimit || null }
}

async function requestGeminiReport({ apiKey, prompt, maxOutputTokens = 3200 }) {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }),
  })

  const rawText = await response.text()
  let payload = {}

  try {
    payload = rawText ? JSON.parse(rawText) : {}
  } catch {
    payload = { rawText }
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error?.message || rawText || 'Gemini request failed.',
    }
  }

  const candidate = payload?.candidates?.[0]
  const outputText = candidate?.content?.parts?.map((part) => part.text || '').join('\n').trim() || ''

  return {
    ok: true,
    outputText,
    finishReason: candidate?.finishReason || 'UNKNOWN',
    usageMetadata: payload?.usageMetadata || null,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error(`[${requestId}] GEMINI_API_KEY is missing`)
    return res.status(503).json({ error: 'AI service is not configured yet.' })
  }

  if (getApproxBodySize(req) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Report request is too large. Reduce field updates or campaign notes and try again.' })
  }

  try {
    const rawCampaign = req.body?.campaign || {}
    const campaign = sanitizeCampaignPayload(rawCampaign)
    const updates = campaign.updates

    if (!campaign.id || !campaign.title) {
      return res.status(400).json({ error: 'Campaign details are required.' })
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'At least one field update is required before generating a report.' })
    }

    const access = await verifyRequestAccess(req, campaign)
    if (!access.ok) {
      return res.status(access.status || 403).json({ error: access.error, usage: access.usage || null })
    }

    console.log(`[${requestId}] Structured report generation started`, {
      campaignId: campaign.id,
      organizationId: campaign.organizationId || 'not-configured',
      campaignType: campaign.type,
      updateCount: updates.length,
      userId: access.user?.id || 'not-verified',
    })

    const prompt = buildStructuredReportPrompt(campaign)
    let aiResult = await requestGeminiReport({ apiKey, prompt, maxOutputTokens: 3200 })

    if (aiResult.ok && aiResult.finishReason === 'MAX_TOKENS') {
      console.warn(`[${requestId}] Gemini returned MAX_TOKENS. Retrying once.`, {
        usageMetadata: aiResult.usageMetadata,
      })
      aiResult = await requestGeminiReport({
        apiKey,
        prompt: `${prompt}\n\nReturn complete valid JSON. Keep the summary concise.`,
        maxOutputTokens: 4200,
      })
    }

    if (!aiResult.ok) {
      console.error(`[${requestId}] Gemini request failed`, { status: aiResult.status, error: aiResult.error })
      return res.status(502).json({ error: 'AI generation request failed.', detail: String(aiResult.error).slice(0, 500) })
    }

    if (!aiResult.outputText || aiResult.finishReason === 'MAX_TOKENS') {
      console.error(`[${requestId}] Gemini returned incomplete structured output`, {
        finishReason: aiResult.finishReason,
        outputLength: aiResult.outputText?.length || 0,
      })
      return res.status(502).json({ error: 'AI service returned incomplete structured output. Please try again.' })
    }

    let structuredReport
    try {
      structuredReport = normalizeStructuredReport(parseStructuredText(aiResult.outputText), campaign, { aiModel: GEMINI_MODEL, generationSource: 'gemini' })
    } catch (parseError) {
      console.error(`[${requestId}] Gemini returned invalid structured JSON`, {
        message: parseError?.message,
        outputPreview: aiResult.outputText.slice(0, 500),
      })
      return res.status(502).json({ error: 'AI service returned an invalid structured draft. Please try again.' })
    }

    console.log(`[${requestId}] Structured report generation completed`, {
      finishReason: aiResult.finishReason,
      evidenceItems: structuredReport.evidenceUsed.length,
      missingItems: structuredReport.missingEvidence.length,
      riskItems: structuredReport.riskFlags.length,
      usageMetadata: aiResult.usageMetadata,
      usage: access.usage || null,
    })

    return res.status(200).json(structuredReport)
  } catch (error) {
    console.error(`[${requestId}] Unexpected report generation error`, { message: error?.message })
    return res.status(500).json({ error: 'Unexpected report generation error.', detail: error?.message || 'Unknown error' })
  }
}
