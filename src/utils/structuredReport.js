export const DEFAULT_AI_MODEL = 'gemini-2.5-flash'

export function cleanText(value, maxLength = 1800) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function safeArray(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') return item
      return ''
    })
    .filter(Boolean)
}

export function stripJsonFence(text) {
  return cleanText(text, 12000)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()
}

export function parseStructuredText(text) {
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

export function deriveConfidence({ rawConfidence, campaign, evidenceUsed, missingEvidence, riskFlags }) {
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

export function normalizeStructuredReport(parsed, campaign, options = {}) {
  const aiModel = options.aiModel || DEFAULT_AI_MODEL
  const generationSource = options.generationSource || 'gemini'

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
    reviewRequired: parsed?.review_required !== false && parsed?.reviewRequired !== false,
    confidence: deriveConfidence({
      rawConfidence: parsed?.confidence,
      campaign,
      evidenceUsed,
      missingEvidence,
      riskFlags,
    }),
    aiModel,
    generationSource,
    disclaimer: cleanText(parsed?.disclaimer, 180) || 'Review the draft before sharing externally.',
  }
}

export function validateStructuredReport(report) {
  const errors = []

  if (!report || typeof report !== 'object') {
    return { valid: false, errors: ['Report must be an object.'] }
  }

  if (!cleanText(report.title, 200)) errors.push('Missing title.')
  if (!cleanText(report.summary, 4000) || cleanText(report.summary, 4000).length < 80) {
    errors.push('Summary is missing or too short.')
  }
  if (!Array.isArray(report.evidenceUsed)) errors.push('evidenceUsed must be an array.')
  if (!Array.isArray(report.missingEvidence)) errors.push('missingEvidence must be an array.')
  if (!Array.isArray(report.riskFlags)) errors.push('riskFlags must be an array.')
  if (!Array.isArray(report.nextActions)) errors.push('nextActions must be an array.')

  const confidence = Number(report.confidence)
  if (!Number.isFinite(confidence) || confidence < 25 || confidence > 100) {
    errors.push('Confidence must be a number between 25 and 100.')
  }

  if (report.reviewRequired !== true) {
    errors.push('reviewRequired should be true for human-reviewed NGO reports.')
  }

  return { valid: errors.length === 0, errors }
}
