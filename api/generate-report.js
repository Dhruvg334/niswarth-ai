const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function cleanText(value, maxLength = 1800) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function buildPrompt(campaign) {
  const title = cleanText(campaign?.title, 120) || 'NGO campaign'
  const type = cleanText(campaign?.type, 80) || 'social impact'
  const location = cleanText(campaign?.location, 120) || 'the field location'
  const status = cleanText(campaign?.status, 80) || 'active'
  const goal = cleanText(campaign?.goal, 300) || 'Support the campaign goal using available field evidence.'
  const volunteers = Array.isArray(campaign?.volunteers) ? campaign.volunteers.slice(0, 10) : []
  const updates = Array.isArray(campaign?.updates) ? campaign.updates.slice(0, 12) : []

  const volunteerLines = volunteers.length
    ? volunteers.map((volunteer, index) => `${index + 1}. ${cleanText(volunteer.name, 80)} — ${cleanText(volunteer.role, 100)}`).join('\n')
    : 'No volunteer details provided.'

  const updateLines = updates.map((update, index) => {
    const updateText = cleanText(update.update_text || update.text, 500)
    const updateLocation = cleanText(update.location, 120) || location
    const submittedBy = cleanText(update.submitted_by, 120) || 'field team'
    return `${index + 1}. ${updateText} (Location: ${updateLocation}; Submitted by: ${submittedBy})`
  }).join('\n')

  return `You are helping an NGO prepare a human-reviewed impact report draft.\n\nRules:\n- Use only the facts provided below.\n- Do not invent beneficiary counts, dates, donors, outcomes, names, locations, or impact claims.\n- If evidence is incomplete, say what is missing in a practical and respectful way.\n- Write in clear, warm, NGO-friendly language.\n- Keep the report suitable for internal review before external sharing.\n- Avoid marketing hype and exaggerated claims.\n- Do not include markdown tables.\n\nCampaign details:\nTitle: ${title}\nType: ${type}\nLocation: ${location}\nStatus: ${status}\nGoal: ${goal}\n\nVolunteers:\n${volunteerLines}\n\nField updates:\n${updateLines}\n\nWrite a concise impact report draft with:\n1. A short opening paragraph about what happened\n2. A paragraph summarizing the field evidence\n3. A paragraph explaining current progress and next steps\n4. A final note about what should be verified before sharing externally\n\nReturn only the report draft text.`
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
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

    const prompt = buildPrompt(campaign)

    const geminiResponse = await fetch(GEMINI_ENDPOINT, {
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
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 900,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      return res.status(502).json({ error: 'AI generation request failed.', detail: errorText.slice(0, 500) })
    }

    const data = await geminiResponse.json()
    const draftText = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim()

    if (!draftText) {
      return res.status(502).json({ error: 'AI service returned an empty draft.' })
    }

    return res.status(200).json({
      title: `${cleanText(campaign.title, 90)} Impact Draft`,
      summary: draftText,
      suggestedActions: buildSuggestedActions(campaign),
      confidence: Math.min(92, 58 + updates.length * 9),
      disclaimer: 'AI-generated drafts may contain inaccuracies; human review is required before sharing or publishing.',
    })
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected report generation error.', detail: error?.message || 'Unknown error' })
  }
}
