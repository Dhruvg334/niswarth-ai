function normalizeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getUpdateText(update) {
  if (typeof update === 'string') return normalizeText(update)
  return normalizeText(update?.update_text || update?.text || update?.summary)
}

function getUpdateId(update, index) {
  if (typeof update === 'string') return `local-update-${index + 1}`
  return normalizeText(update?.id, `local-update-${index + 1}`)
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
  return fieldUpdates.slice(0, 4).map((update, index) => ({
    field_update_id: getUpdateId(update, index),
    note: getUpdateText(update).slice(0, 140) || `Field update ${index + 1}`,
  }))
}

function buildMissingEvidence(fieldUpdates, volunteers) {
  const missing = []
  if (fieldUpdates.length < 3) missing.push('More field notes would make the impact summary stronger.')
  if (!volunteers.length) missing.push('Volunteer names or roles are missing from the campaign record.')
  missing.push('Final numbers and beneficiary-sensitive details should be verified before external sharing.')
  return missing.slice(0, 3)
}

function buildRiskFlags(fieldUpdates) {
  const risks = ['Avoid adding outcomes that are not supported by field updates.']
  if (fieldUpdates.length < 2) risks.unshift('The current draft is based on limited field evidence.')
  risks.push('Review names, dates, locations, and counts before approval.')
  return risks.slice(0, 3)
}

function buildNextActions(campaign, fieldUpdates) {
  if (Array.isArray(campaign?.nextActions) && campaign.nextActions.length) {
    return campaign.nextActions.slice(0, 4)
  }

  const actions = []
  if (fieldUpdates.length < 3) actions.push('Collect two or three more field updates.')
  actions.push('Review beneficiary privacy before sharing.')
  actions.push('Approve only after a human reviewer checks the final draft.')
  return actions.slice(0, 4)
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
  const volunteers = Array.isArray(campaign?.volunteers) ? campaign.volunteers : []
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

  return {
    title: `${title} Impact Draft`,
    confidence,
    summary: paragraphs.join('\n\n'),
    evidenceUsed: buildEvidenceUsed(fieldUpdates),
    missingEvidence: buildMissingEvidence(fieldUpdates, volunteers),
    riskFlags: buildRiskFlags(fieldUpdates),
    nextActions: buildNextActions(campaign, fieldUpdates),
    suggestedActions: buildNextActions(campaign, fieldUpdates),
    reviewRequired: true,
    aiModel: 'local-structured-generator',
    generationSource: 'local-fallback',
    disclaimer: 'Review the draft before sharing externally.',
  }
}
