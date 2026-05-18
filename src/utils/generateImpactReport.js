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

function buildEvidenceSentence(updates) {
  if (!updates.length) {
    return 'No field updates have been added yet, so the report should not be shared externally until field evidence is collected.'
  }

  const conciseUpdates = updates.slice(0, 4).map((update) => getUpdateText(update)).filter(Boolean)
  if (!conciseUpdates.length) {
    return 'Field updates are present, but they need clearer descriptions before the report is shared externally.'
  }

  return `The available field evidence notes that ${conciseUpdates.join(' ')}${updates.length > conciseUpdates.length ? ' Additional updates should be reviewed before external sharing.' : ''}`
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

  return {
    title: `${title} Impact Draft`,
    confidence,
    summary: paragraphs.join('\n\n'),
    suggestedActions: campaign.nextActions?.length
      ? campaign.nextActions
      : ['Verify numbers and locations', 'Review beneficiary privacy', 'Collect more evidence if needed'],
    disclaimer: 'AI-generated drafts may contain inaccuracies; human review is required before sharing or publishing.',
  }
}
