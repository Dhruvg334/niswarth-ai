const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function cleanText(value, maxLength = 1800) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function safeArray(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') return item
      return ''
    })
    .filter(Boolean)
}

function stripJsonFence(text) {
  return cleanText(text, 12000)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()
}

function parseStructuredText(text) {
  const cleaned = stripJsonFence(text)
  try {
    return JSON.parse(cleaned)
  } catch {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
    }
    throw new Error('Gemini did not return valid JSON.')
  }
}


function deriveConfidence({ rawConfidence, campaign, evidenceUsed, missingEvidence, riskFlags }) {
  const numericConfidence = Number(rawConfidence)
  if (Number.isFinite(numericConfidence) && numericConfidence >= 25 && numericConfidence <= 100) {
    return Math.round(numericConfidence)
  }

  const updateCount = Array.isArray(campaign?.updates) ? campaign.updates.length : 0
  const evidenceCount = Array.isArray(evidenceUsed) ? evidenceUsed.length : 0
  const missingCount = Array.isArray(missingEvidence) ? missingEvidence.length : 0
  const riskCount = Array.isArray(riskFlags) ? riskFlags.length : 0

  const derived = 52 + updateCount * 8 + evidenceCount * 3 - missingCount * 3 - riskCount * 2
  return Math.max(35, Math.min(86, Math.round(derived)))
}

function normalizeStructuredReport(parsed, campaign) {
  const title = cleanText(parsed?.title, 160) || `${cleanText(campaign?.title, 90)} Impact Draft`
  const summary = typeof parsed?.summary === 'string' ? parsed.summary.trim() : ''

  if (!summary || summary.length < 80) {
    throw new Error('Structured AI response did not include a usable summary.')
  }

  const evidenceUsed = safeArray(parsed?.evidence_used || parsed?.evidenceUsed)
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          field_update_id: `ai-evidence-${index + 1}`,
          note: cleanText(item, 180),
        }
      }
      return {
        field_update_id: cleanText(item.field_update_id || item.fieldUpdateId || item.id, 120) || `ai-evidence-${index + 1}`,
        note: cleanText(item.note || item.summary || item.text, 180) || `Evidence item ${index + 1}`,
      }
    })
    .slice(0, 5)

  const missingEvidence = safeArray(parsed?.missing_evidence || parsed?.missingEvidence)
    .map((item) => cleanText(String(item), 180))
    .filter(Boolean)
    .slice(0, 4)

  const riskFlags = safeArray(parsed?.risk_flags || parsed?.riskFlags)
    .map((item) => cleanText(String(item), 180))
    .filter(Boolean)
    .slice(0, 4)

  const nextActions = safeArray(parsed?.next_actions || parsed?.nextActions || parsed?.suggested_actions || parsed?.suggestedActions)
    .map((item) => cleanText(String(item), 180))
    .filter(Boolean)
    .slice(0, 4)

  return {
    title,
    summary,
    evidenceUsed,
    missingEvidence,
    riskFlags,
    nextActions,
    reviewRequired: parsed?.review_required !== false,
    confidence: deriveConfidence({
      rawConfidence: parsed?.confidence,
      campaign,
      evidenceUsed,
      missingEvidence,
      riskFlags,
    }),
    aiModel: GEMINI_MODEL,
    generationSource: 'gemini',
    disclaimer: 'Review the draft before sharing externally.',
  }
}

function buildPrompt(campaign) {
  const title = cleanText(campaign?.title, 120) || 'NGO campaign'
  const type = cleanText(campaign?.type, 80) || 'social impact'
  const location = cleanText(campaign?.location, 120) || 'the field location'
  const status = cleanText(campaign?.status, 80) || 'active'
  const goal = cleanText(campaign?.goal, 320) || 'Support the campaign goal using available field evidence.'
  const volunteers = Array.isArray(campaign?.volunteers) ? campaign.volunteers.slice(0, 10) : []
  const updates = Array.isArray(campaign?.updates) ? campaign.updates.slice(0, 12) : []
  const metrics = campaign?.metrics || {}

  const volunteerLines = volunteers.length
    ? volunteers.map((volunteer, index) => `${index + 1}. ${cleanText(volunteer.name, 80)} — ${cleanText(volunteer.role, 100)}${volunteer.assignmentRole ? ` (${cleanText(volunteer.assignmentRole, 100)})` : ''}`).join('\n')
    : 'No volunteer details provided.'

  const updateLines = updates.map((update, index) => {
    const updateId = cleanText(update.id, 120) || `update-${index + 1}`
    const updateText = cleanText(update.update_text || update.text, 520)
    const updateLocation = cleanText(update.location, 120) || location
    const submittedBy = cleanText(update.submitted_by, 120) || 'field team'
    const evidenceType = cleanText(update.evidence_type, 80) || 'field note'
    return `${index + 1}. ID: ${updateId}; Text: ${updateText}; Location: ${updateLocation}; Submitted by: ${submittedBy}; Evidence type: ${evidenceType}`
  }).join('\n')

  return `You are generating a structured, human-reviewed NGO impact report draft for Niswarth AI.

Return ONLY valid JSON. Do not wrap the JSON in markdown.

Hard rules:
- Use ONLY the campaign details, volunteers, metrics, and field updates provided below.
- Do NOT invent beneficiary counts, donors, dates, outcomes, quotes, or impact claims.
- If evidence is thin, state what is missing in missing_evidence and risk_flags.
- Keep language warm, practical, and suitable for NGO coordinators.
- The summary must be 3 short paragraphs and 160 to 230 words total.
- The summary must be complete and must not end mid-sentence.
- Use field update IDs in evidence_used wherever possible.
- Set confidence as a realistic number from 40 to 90. Use lower values when evidence is thin; never return 0 unless no draft can be created.

JSON schema:
{
  "title": "string",
  "summary": "string",
  "evidence_used": [
    { "field_update_id": "string", "note": "string" }
  ],
  "missing_evidence": ["string"],
  "risk_flags": ["string"],
  "next_actions": ["string"],
  "review_required": true,
  "confidence": 65
}

Campaign details:
Title: ${title}
Type: ${type}
Location: ${location}
Status: ${status}
Goal: ${goal}

Available metrics:
Volunteers assigned: ${metrics.volunteersAssigned ?? volunteers.length ?? 'Not provided'}
Field updates recorded: ${metrics.fieldUpdates ?? updates.length}
Events completed: ${metrics.eventsCompleted ?? 'Not provided'}
Workflow completion: ${metrics.completion ?? 'Not provided'}

Volunteers:
${volunteerLines}

Field updates:
${updateLines}`
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

    const prompt = buildPrompt(campaign)
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
      structuredReport = normalizeStructuredReport(parseStructuredText(aiResult.outputText), campaign)
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
