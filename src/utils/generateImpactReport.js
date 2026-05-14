export function generateImpactReport(campaign) {
  const updateText = campaign.updates.join(' ')

  return {
    title: `${campaign.type} Impact Draft`,
    confidence: campaign.metrics.draftReadiness,
    summary: `The ${campaign.title.toLowerCase()} in ${campaign.location} is currently ${campaign.status.toLowerCase()} with ${campaign.completion}% completion. Based on the submitted field updates, the team has coordinated ${campaign.metrics.volunteersAssigned} volunteers, recorded ${campaign.metrics.fieldUpdates} field updates, and completed ${campaign.metrics.eventsCompleted} planned activities. ${updateText}`,
    suggestedActions: campaign.nextActions,
    disclaimer: 'AI-generated drafts may contain inaccuracies; human review is required before sharing or publishing.',
  }
}
