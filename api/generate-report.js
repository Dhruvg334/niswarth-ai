const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function cleanText(value, maxLength = 1800) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function cleanList(values, maxItems = 5, maxLength = 180) {
  if (!Array.isArray(values)) return []
  return values
    .map((item) => {
      if (typeof item === 'string') return cleanText(item, maxLength)
      if (item && typeof item === 'object') return cleanText(item.note || item.text || item.summary || item.label, maxLength)
      return ''
    })
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeEvidenceUsed(values, updates) {
  if (!Array.isArray(values)) return []
  const updateIds = new Set(updates.map((update, index) => String(update.id || `update-${index + 1}`)))

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const fallbackId = `update-${Math.min(updateIds.size || 1, 1)}`
      const fieldUpdateId = cleanText(String(item.field_update_id || item.update_id || fallbackId), 120)
      const note = cleanText(item.note || item.reason || item.text, 220)
      if (!note) return null
      return {
        field_update_id: updateIds.has(fieldUpdateId) ? fieldUpdateId : fieldUpdateId,
        note,
      }
    })
    .filter(Boolean)
    .slice(0, 6)
}

function isCompleteText(text) {
  const trimmed = cleanText(text, 6000)
  if (!trimmed) return false
  return /[.!?)]$/.test(trimmed)
}

function extractJsonBlock(text) {
  if (!text) return ''
  const trimmed = text.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)

  return ''
}

function parseStructuredReport(rawText, campaign, updates) {
  const jsonText = extractJsonBlock(rawText)
  if (!jsonText) {
    return { ok: false, error: 'No JSON object returned.' }
  }

  let parsed
  try {
    parsed = JSON.parse(jsonText)
  } catch (error) {
    return { ok: false, error: `Invalid JSON returned: ${error.message}` }
  }

  const summary = cleanText(parsed.summary || parsed.draft || parsed.report, 5000)
  if (!summary || !isCompleteText(summary)) {
    return { ok: false, error: 'Report summary is missing or incomplete.' }
  }

  const title = cleanText(parsed.title, 140) || `${cleanText(campaign.title, 90)} Impact Draft`
  const evidenceUsed = normalizeEvidenceUsed(parsed.evidence_used || parsed.evidenceUsed, updates)
  const missingEvidence = cleanList(parsed.missing_evidence || parsed.missingEvidence, 5, 180)
  const riskFlags = cleanList(parsed.risk_flags || parsed.riskFlags, 5, 180)
  const nextActions = cleanList(parsed.next_actions || parsed.nextActions, 5, 180)

  return {
    ok: true,
    report: {
      title,
      summary,
      evidenceUsed,
      missingEvidence,
      riskFlags,
      nextActions,
      suggestedActions: nextActions,
      reviewRequired: parsed.review_required !== false,
      confidence: Number.isFinite(Number(parsed.confidence)) ? Math.max(0, Math.min(100, Number(parsed.confidence))) : null,
      aiModel: GEMINI_MODEL,
      generationSource: GEMINI_MODEL,
      disclaimer: 'AI-generated drafts may contain inaccuracies; human review is required before sharing or publishing.',
    },
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
    ? volunteers.map((volunteer, index) => `${index + 1}. ${cleanText(volunteer.name, 80)} — ${cleanText(volunteer.role, 100)}`).join('\n')
    : 'No volunteer details provided.'

  const updateLines = updates.map((update, index) => {
    const id = cleanText(String(update.id || `update-${index + 1}`), 120)
    const updateText = cleanText(update.update_text || update.text, 520)
    const updateLocation = cleanText(update.location, 120) || location
    const submittedBy = cleanText(update.submitted_by, 120) || 'field team'
    return `${index + 1}. id: ${id}; note: ${updateText}; location: ${updateLocation}; submitted_by: ${submittedBy}`
  }).join('\n')

  return `You are generating a human-reviewed NGO impact report draft for Niswarth AI.

Write for an NGO coordinator. Keep the output useful, calm, and practical.

Hard rules:
- Use ONLY the evidence provided below.
- Do NOT invent beneficiary counts, donor names, dates, outcomes, locations, quotes, impact numbers, or volunteer names.
- If evidence is missing or weak, say what should be collected or verified.
- Do not use hype, sales language, or unsupported claims.
- The report is a draft for human review, not a final public report.
- Return valid JSON only. No markdown. No code fence. No commentary outside JSON.

Return exactly this JSON shape:
{
  "title": "Short report title",
  "summary": "Three short paragraphs. 150-220 words total. Complete sentences only.",
  "evidence_used": [
    { "field_update_id": "id from the field update list", "note": "Short reason this update supports the draft" }
  ],
  "missing_evidence": ["Short missing detail"],
  "risk_flags": ["Short review caution"],
  "next_actions": ["Short practical action"],
  "review_required": true,
  "confidence": 0
}

Guidance:
- evidence_used should include 1-6 field updates that directly support the draft.
- missing_evidence should focus on gaps like attendance, dates, beneficiary feedback, photos/documents, or verification.
- risk_flags should be review cautions, not scary technical warnings.
- next_actions should help the NGO improve the report.
- confidence should be 45-90 based on how complete the provided evidence is.

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

function completeMetadata(report, campaign, updates) {
  const updateCount = updates.length
  const evidenceUsed = report.evidenceUsed?.length
    ? report.evidenceUsed
    : updates.slice(0, 4).map((update, index) => ({
      field_update_id: String(update.id || `update-${index + 1}`),
      note: cleanText(update.update_text || update.text, 180),
    })).filter((item) => item.note)

  const missingEvidence = report.missingEvidence?.length ? report.missingEvidence : [
    updateCount < 3 ? 'More field updates would make the report stronger.' : '',
    'Verify names, dates, numbers, and locations before external sharing.',
  ].filter(Boolean)

  const riskFlags = report.riskFlags?.length ? report.riskFlags : [
    'Avoid adding outcomes that are not supported by field updates.',
    'Review beneficiary privacy before sharing.',
  ]

  const nextActions = report.nextActions?.length ? report.nextActions : [
    updateCount < 3 ? 'Collect more field notes.' : 'Review the available field notes.',
    'Ask a human reviewer to approve the final version.',
  ]

  return {
    ...report,
    evidenceUsed: evidenceUsed.slice(0, 6),
    missingEvidence: missingEvidence.slice(0, 5),
    riskFlags: riskFlags.slice(0, 5),
    nextActions: nextActions.slice(0, 5),
    suggestedActions: nextActions.slice(0, 5),
    confidence: Number.isFinite(Number(report.confidence)) ? Number(report.confidence) : Math.min(92, 58 + updateCount * 9),
  }
}

async function requestGeminiStructuredReport({ apiKey, prompt, maxOutputTokens = 3200 }) {
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
        temperature: 0.15,
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
    let aiResult = await requestGeminiStructuredReport({ apiKey, prompt, maxOutputTokens: 3200 })

    if (aiResult.ok && aiResult.finishReason === 'MAX_TOKENS') {
      console.warn(`[${requestId}] Gemini reached token limit. Retrying structured report generation.`, {
        usageMetadata: aiResult.usageMetadata,
      })
      aiResult = await requestGeminiStructuredReport({
        apiKey,
        prompt: `${prompt}\n\nReturn complete JSON only. Keep each list short.`,
        maxOutputTokens: 4200,
      })
    }

    if (!aiResult.ok) {
      console.error(`[${requestId}] Gemini request failed`, { status: aiResult.status, error: aiResult.error })
      return res.status(502).json({ error: 'AI generation request failed.', detail: String(aiResult.error).slice(0, 500) })
    }

    const parsed = parseStructuredReport(aiResult.outputText, campaign, updates)
    if (!parsed.ok) {
      console.error(`[${requestId}] Gemini returned invalid structured output`, {
        reason: parsed.error,
        finishReason: aiResult.finishReason,
        outputPreview: cleanText(aiResult.outputText, 240),
      })
      return res.status(502).json({ error: 'AI service returned invalid structured output. Please try again.' })
    }

    const report = completeMetadata(parsed.report, campaign, updates)

    console.log(`[${requestId}] Structured report generation completed`, {
      finishReason: aiResult.finishReason,
      evidenceItems: report.evidenceUsed.length,
      missingItems: report.missingEvidence.length,
      riskItems: report.riskFlags.length,
      usageMetadata: aiResult.usageMetadata,
    })

    return res.status(200).json(report)
  } catch (error) {
    console.error(`[${requestId}] Unexpected report generation error`, { message: error?.message })
    return res.status(500).json({ error: 'Unexpected report generation error.', detail: error?.message || 'Unknown error' })
  }
}
