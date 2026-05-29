import { cleanText } from './structuredReport.js'

export function buildStructuredReportPrompt(campaign) {
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
- Keep missing_evidence, risk_flags, and next_actions concise and useful for a human reviewer.

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
