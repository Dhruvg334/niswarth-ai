function normalizeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getUpdateText(update) {
  if (typeof update === 'string') return normalizeText(update)
  return normalizeText(update?.update_text || update?.text || update?.summary)
}

function getCampaignStatus(campaign) {
  return normalizeText(campaign?.status || campaign?.rawStatus, 'active')
}

function getReadinessScore(campaign, updateCount) {
  const explicitReadiness = Number(campaign?.metrics?.draftReadiness)
  if (Number.isFinite(explicitReadiness)) return Math.max(0, Math.min(100, explicitReadiness))
  return Math.min(90, 55 + updateCount * 10)
}

function getVolunteerCount(campaign) {
  const explicitCount = Number(campaign?.metrics?.volunteersAssigned)
  if (Number.isFinite(explicitCount)) return explicitCount
  return Array.isArray(campaign?.volunteers) ? campaign.volunteers.length : 0
}

function buildEvidenceSentence(fieldUpdates) {
  if (!fieldUpdates.length) {
    return 'No field updates have been added yet, so the report should not be shared externally until field evidence is collected.'
  }

  const conciseUpdates = fieldUpdates.slice(0, 4).map((update) => getUpdateText(update)).filter(Boolean)
  if (!conciseUpdates.length) {
    return 'Field updates are present, but they need clearer descriptions before the report is shared externally.'
  }

  return `The available field evidence notes that ${conciseUpdates.join(' ')}${fieldUpdates.length > conciseUpdates.length ? ' Additional updates should be reviewed before external sharing.' : ''}`
}

function buildEvidenceUsed(fieldUpdates) {
  return fieldUpdates
    .slice(0, 6)
    .map((update, index) => {
      const text = getUpdateText(update)
      if (!text) return null
      return {
        field_update_id: update?.id || `update-${index + 1}`,
        note: text.length > 140 ? `${text.slice(0, 137)}...` : text,
      }
    })
    .filter(Boolean)
}

function buildMissingEvidence(campaign, fieldUpdates, volunteerCount) {
  const missing = []
  if (!fieldUpdates.length) missing.push('Field updates are needed before the report is shared outside the team.')
  if (fieldUpdates.length < 3) missing.push('More field notes would make the impact summary stronger.')
  if (!volunteerCount) missing.push('Volunteer names or roles have not been linked to this campaign.')
  if (!normalizeText(campaign?.goal)) missing.push('The campaign goal should be clarified before external reporting.')
  return missing.slice(0, 4)
}

function buildRiskFlags(fieldUpdates) {
  const risks = [
    'Verify numbers, names, dates, and locations before approval.',
    'Avoid adding outcomes that are not supported by field updates.',
  ]

  if (!fieldUpdates.length) {
    risks.unshift('This draft has no field evidence and should not be shared externally.')
  }

  return risks.slice(0, 4)
}

function buildNextActions(campaign, fieldUpdates, volunteerCount) {
  const actions = []
  if (!volunteerCount) actions.push('Assign at least one responsible volunteer or coordinator.')
  if (fieldUpdates.length < 3) actions.push('Collect two or three more field updates.')
  actions.push('Review beneficiary privacy before sharing.')
  actions.push('Approve only after a human reviewer checks the final draft.')
  return actions.slice(0, 4)
}

export function normalizeReportMetadata(report = {}) {
  return {
    evidenceUsed: Array.isArray(report.evidenceUsed) ? report.evidenceUsed : [],
    missingEvidence: Array.isArray(report.missingEvidence) ? report.missingEvidence : [],
    riskFlags: Array.isArray(report.riskFlags) ? report.riskFlags : [],
    nextActions: Array.isArray(report.nextActions)
      ? report.nextActions
      : Array.isArray(report.suggestedActions)
        ? report.suggestedActions
        : [],
    aiModel: normalizeText(report.aiModel),
    generationSource: normalizeText(report.generationSource, 'local-fallback'),
  }
}

export function generateImpactReport(campaign = {}) {
  const fieldUpdates = Array.isArray(campaign.fieldUpdates) && campaign.fieldUpdates.length
    ? campaign.fieldUpdates
    : Array.isArray(campaign.updates)
      ? campaign.updates
      : []

  const updates = fieldUpdates.map(getUpdateText).filter(Boolean)
  const title = normalizeText(campaign.title, 'Selected campaign')
  const location = normalizeText(campaign.location, 'the campaign location')
  const goal = normalizeText(campaign.goal, 'support the stated campaign objective')
  const status = getCampaignStatus(campaign)
  const volunteerCount = getVolunteerCount(campaign)
  const fieldUpdateCount = Number.isFinite(Number(campaign?.metrics?.fieldUpdates))
    ? Number(campaign.metrics.fieldUpdates)
    : updates.length
  const confidence = getReadinessScore(campaign, updates.length)

  const paragraphs = [
    `${title} is currently ${status.toLowerCase()} in ${location}. The campaign goal is to ${goal.replace(/\.$/, '').toLowerCase()}. This draft is prepared as a working impact summary for human review, not as a final public report.`,
    `${buildEvidenceSentence(fieldUpdates)} The current record includes ${fieldUpdateCount} field update${fieldUpdateCount === 1 ? '' : 's'} and ${volunteerCount} assigned volunteer${volunteerCount === 1 ? '' : 's'}, which gives the team a starting base for documenting progress.`,
    'Before this report is shared externally, the coordinator should verify names, counts, locations, dates, and beneficiary-sensitive details. If evidence is still limited, the next step should be to collect more structured field updates and then approve the final report after human review.',
  ]

  const evidenceUsed = buildEvidenceUsed(fieldUpdates)
  const missingEvidence = buildMissingEvidence(campaign, fieldUpdates, volunteerCount)
  const riskFlags = buildRiskFlags(fieldUpdates)
  const nextActions = buildNextActions(campaign, fieldUpdates, volunteerCount)

  return {
    title: `${title} Impact Draft`,
    confidence,
    summary: paragraphs.join('\n\n'),
    evidenceUsed,
    missingEvidence,
    riskFlags,
    nextActions,
    suggestedActions: nextActions,
    aiModel: '',
    generationSource: 'local-fallback',
    disclaimer: 'AI-generated drafts may contain inaccuracies; human review is required before sharing or publishing.',
  }
}
