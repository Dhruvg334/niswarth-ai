export function calculateCampaignProgress(status, updateCount, reportCount) {
  if (status === 'completed') return 100
  if (status === 'paused') return 45
  if (status === 'planning') return Math.min(35, 15 + updateCount * 5)
  return Math.min(90, 45 + updateCount * 7 + reportCount * 8)
}

export function calculateCampaignMetrics({ volunteers = [], updates = [], reports = [], status = 'active' }) {
  const approvedReports = reports.filter((report) => report.status === 'approved')
  const pendingReports = reports.filter((report) => ['draft', 'under_review', 'needs_revision'].includes(report.status))

  return {
    volunteersAssigned: volunteers.length,
    fieldUpdates: updates.length,
    reportsGenerated: reports.length,
    reportsApproved: approvedReports.length,
    pendingApprovals: pendingReports.length,
    completion: calculateCampaignProgress(status, updates.length, reports.length),
  }
}

export function calculateGlobalMetrics(campaigns = []) {
  return campaigns.reduce(
    (totals, campaign) => ({
      activeCampaigns: totals.activeCampaigns + (campaign.rawStatus === 'active' ? 1 : 0),
      volunteersAssigned: totals.volunteersAssigned + campaign.metrics.volunteersAssigned,
      fieldUpdates: totals.fieldUpdates + campaign.metrics.fieldUpdates,
      reportsGenerated: totals.reportsGenerated + campaign.metrics.reportsGenerated,
      reportsApproved: totals.reportsApproved + campaign.metrics.reportsApproved,
      pendingApprovals: totals.pendingApprovals + campaign.metrics.pendingApprovals,
    }),
    {
      activeCampaigns: 0,
      volunteersAssigned: 0,
      fieldUpdates: 0,
      reportsGenerated: 0,
      reportsApproved: 0,
      pendingApprovals: 0,
    }
  )
}


export function calculateQualityMetrics(campaigns = []) {
  const campaignCount = campaigns.length
  const fieldUpdates = campaigns.reduce((total, campaign) => total + campaign.metrics.fieldUpdates, 0)
  const reportsGenerated = campaigns.reduce((total, campaign) => total + campaign.metrics.reportsGenerated, 0)
  const reportsApproved = campaigns.reduce((total, campaign) => total + campaign.metrics.reportsApproved, 0)
  const pendingApprovals = campaigns.reduce((total, campaign) => total + campaign.metrics.pendingApprovals, 0)

  return {
    updatesPerCampaign: campaignCount ? (fieldUpdates / campaignCount).toFixed(1) : '0.0',
    approvalRate: reportsGenerated ? `${Math.round((reportsApproved / reportsGenerated) * 100)}%` : '0%',
    reviewQueue: pendingApprovals,
    evidenceReadyCampaigns: campaigns.filter((campaign) => campaign.metrics.fieldUpdates > 0).length,
  }
}
