import { DEFAULT_AI_MODEL, normalizeStructuredReport, parseStructuredText } from '../src/utils/structuredReport.js'
import { buildStructuredReportPrompt } from '../src/utils/aiReportPrompt.js'

const GEMINI_MODEL = DEFAULT_AI_MODEL
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

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

  try {
    const { campaign } = req.body || {}
    const updates = Array.isArray(campaign?.updates) ? campaign.updates : []

    if (!campaign?.id || !campaign?.title) {
      return res.status(400).json({ error: 'Campaign details are required.' })
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'At least one field update is required before generating a report.' })
    }

    console.log(`[${requestId}] Structured report generation started`, {
      campaignId: campaign.id,
      campaignType: campaign.type,
      updateCount: updates.length,
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
    })

    return res.status(200).json(structuredReport)
  } catch (error) {
    console.error(`[${requestId}] Unexpected report generation error`, { message: error?.message })
    return res.status(500).json({ error: 'Unexpected report generation error.', detail: error?.message || 'Unknown error' })
  }
}
