export function generateImpactReport(campaign) {
  const updates = campaign.fieldUpdates?.length
    ? campaign.fieldUpdates.map((update) => update.update_text)
    : campaign.updates || []

  const updateText = updates.join(' ')
  const reportTitle = `${campaign.type} Impact Draft`
  const reportSummary = `The ${campaign.title.toLowerCase()} in ${campaign.location} is currently ${campaign.status.toLowerCase()} with ${campaign.completion}% workflow completion. Based on the submitted field updates, the team has coordinated ${campaign.metrics.volunteersAssigned} volunteers, recorded ${campaign.metrics.fieldUpdates} field updates, and completed ${campaign.metrics.eventsCompleted} planned activities. ${updateText}`

  return {
    title: reportTitle,
    confidence: campaign.metrics.draftReadiness,
    summary: reportSummary,
    suggestedActions: campaign.nextActions || [],
    disclaimer: 'AI-generated drafts may contain inaccuracies; human review is required before sharing or publishing.',
  }
}
