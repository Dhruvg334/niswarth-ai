const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function cleanText(value, maxLength = 1800) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function isCompleteText(text) {
  const trimmed = cleanText(text, 5000)
  if (!trimmed) return false
  return /[.!?)]$/.test(trimmed)
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
    const updateText = cleanText(update.update_text || update.text, 520)
    const updateLocation = cleanText(update.location, 120) || location
    const submittedBy = cleanText(update.submitted_by, 120) || 'field team'
    return `${index + 1}. ${updateText} (Location: ${updateLocation}; Submitted by: ${submittedBy})`
  }).join('\n')

  return `You are writing a human-reviewed NGO impact report draft for Niswarth AI.

Primary objective:
Create a complete, polished, warm, and practical impact report draft that an NGO coordinator can review and edit.

Hard rules:
- Use ONLY the evidence provided in the campaign details, volunteers, metrics, and field updates below.
- Do NOT invent beneficiary counts, donor names, dates, outcomes, locations, quotes, impact numbers, or volunteer names.
- If evidence is limited, state that more field evidence should be collected before external sharing.
- Do NOT leave any sentence incomplete.
- Do NOT end mid-thought.
- Do NOT use markdown tables.
- Do NOT add headings in markdown format.
- Do NOT include placeholders.
- Avoid hype, exaggeration, and sales language.
- Keep the tone NGO-friendly, clear, respectful, and suitable for human review.

Output format:
Write 3 short paragraphs only, 170 to 240 words total.

Paragraph 1: Campaign overview using the provided campaign title, location, status, and goal.
Paragraph 2: Field evidence summary using the submitted updates and volunteer details if available.
Paragraph 3: Current progress, practical next steps, and what must be verified before sharing externally.

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
${updateLines}

Return only the completed report draft text.`
}

function buildSuggestedActions(campaign) {
  const updateCount = Array.isArray(campaign?.updates) ? campaign.updates.length : 0
  const volunteerCount = Array.isArray(campaign?.volunteers) ? campaign.volunteers.length : 0
  const actions = []

  if (volunteerCount === 0) actions.push('Add volunteer names and roles for stronger accountability')
  if (updateCount < 3) actions.push('Collect more field updates before external sharing')
  actions.push('Verify numbers, dates, and locations before approval')
  actions.push('Review the draft for tone and beneficiary privacy')

  return actions.slice(0, 4)
}

async function requestGeminiDraft({ apiKey, prompt, maxOutputTokens = 2200 }) {
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
  const draftText = candidate?.content?.parts?.map((part) => part.text || '').join('\n').trim() || ''

  return {
    ok: true,
    draftText,
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

    console.log(`[${requestId}] Report generation started`, {
      campaignId: campaign.id,
      campaignType: campaign.type,
      updateCount: updates.length,
    })

    const prompt = buildPrompt(campaign)
    let aiResult = await requestGeminiDraft({ apiKey, prompt, maxOutputTokens: 2200 })

    if (aiResult.ok && (aiResult.finishReason === 'MAX_TOKENS' || !isCompleteText(aiResult.draftText))) {
      console.warn(`[${requestId}] Gemini returned incomplete draft. Retrying with higher token budget.`, {
        finishReason: aiResult.finishReason,
        outputLength: aiResult.draftText.length,
        usageMetadata: aiResult.usageMetadata,
      })
      aiResult = await requestGeminiDraft({
        apiKey,
        prompt: `${prompt}\n\nImportant: Return a complete draft. End with a complete sentence.`,
        maxOutputTokens: 3200,
      })
    }

    if (!aiResult.ok) {
      console.error(`[${requestId}] Gemini request failed`, { status: aiResult.status, error: aiResult.error })
      return res.status(502).json({ error: 'AI generation request failed.', detail: String(aiResult.error).slice(0, 500) })
    }

    if (!aiResult.draftText) {
      console.error(`[${requestId}] Gemini returned empty draft`)
      return res.status(502).json({ error: 'AI service returned an empty draft.' })
    }

    if (aiResult.finishReason === 'MAX_TOKENS' || !isCompleteText(aiResult.draftText)) {
      console.error(`[${requestId}] Gemini returned incomplete draft after retry`, {
        finishReason: aiResult.finishReason,
        outputLength: aiResult.draftText.length,
        usageMetadata: aiResult.usageMetadata,
      })
      return res.status(502).json({ error: 'AI service returned an incomplete draft. Please try again.' })
    }

    console.log(`[${requestId}] Report generation completed`, {
      finishReason: aiResult.finishReason,
      outputLength: aiResult.draftText.length,
      usageMetadata: aiResult.usageMetadata,
    })

    return res.status(200).json({
      title: `${cleanText(campaign.title, 90)} Impact Draft`,
      summary: aiResult.draftText,
      suggestedActions: buildSuggestedActions(campaign),
      confidence: Math.min(92, 58 + updates.length * 9),
      disclaimer: 'AI-generated drafts may contain inaccuracies; human review is required before sharing or publishing.',
    })
  } catch (error) {
    console.error(`[${requestId}] Unexpected report generation error`, { message: error?.message })
    return res.status(500).json({ error: 'Unexpected report generation error.', detail: error?.message || 'Unknown error' })
  }
}
