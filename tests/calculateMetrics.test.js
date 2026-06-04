import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateCampaignMetrics,
  calculateCampaignProgress,
  calculateGlobalMetrics,
  calculateQualityMetrics,
  calculateVolunteerMetrics,
} from '../src/utils/calculateMetrics.js'

test('calculateCampaignProgress returns stable values for closed states', () => {
  assert.equal(calculateCampaignProgress('completed', 0, 0), 100)
  assert.equal(calculateCampaignProgress('cancelled', 4, 2), 15)
})

test('calculateCampaignMetrics counts report statuses correctly', () => {
  const metrics = calculateCampaignMetrics({
    volunteers: [{ id: 'v1' }, { id: 'v2' }],
    updates: [{ id: 'u1' }],
    reports: [
      { status: 'approved' },
      { status: 'under_review' },
      { status: 'needs_revision' },
      { status: 'draft' },
    ],
    status: 'active',
  })

  assert.equal(metrics.volunteersAssigned, 2)
  assert.equal(metrics.fieldUpdates, 1)
  assert.equal(metrics.reportsGenerated, 4)
  assert.equal(metrics.reportsApproved, 1)
  assert.equal(metrics.reportsUnderReview, 1)
  assert.equal(metrics.reportsNeedingRevision, 1)
  assert.equal(metrics.pendingApprovals, 3)
})

test('calculateGlobalMetrics counts unique assigned volunteers, not assignment rows', () => {
  const campaigns = [
    {
      rawStatus: 'active',
      volunteers: [{ id: 'v1' }, { id: 'v2' }],
      metrics: { fieldUpdates: 2, reportsGenerated: 1, reportsApproved: 0, reportsUnderReview: 1, reportsNeedingRevision: 0, pendingApprovals: 1 },
    },
    {
      rawStatus: 'active',
      volunteers: [{ id: 'v1' }, { id: 'v3' }],
      metrics: { fieldUpdates: 1, reportsGenerated: 1, reportsApproved: 1, reportsUnderReview: 0, reportsNeedingRevision: 0, pendingApprovals: 0 },
    },
  ]

  const metrics = calculateGlobalMetrics(campaigns)

  assert.equal(metrics.activeCampaigns, 2)
  assert.equal(metrics.volunteersAssigned, 3)
  assert.equal(metrics.fieldUpdates, 3)
  assert.equal(metrics.reportsGenerated, 2)
})

test('calculateVolunteerMetrics separates free, available, and assignable volunteers', () => {
  const volunteers = [
    { id: 'v1', availability: 'available' },
    { id: 'v2', availability: 'limited' },
    { id: 'v3', availability: 'unavailable' },
    { id: 'v4', availability: 'available' },
  ]

  const campaigns = [
    { id: 'c1', volunteers: [{ id: 'v1' }] },
    { id: 'c2', volunteers: [{ id: 'v2' }] },
  ]

  const metrics = calculateVolunteerMetrics(volunteers, campaigns, 'c1')

  assert.equal(metrics.totalVolunteers, 4)
  assert.equal(metrics.assignedVolunteers, 2)
  assert.equal(metrics.unassignedVolunteers, 2)
  assert.equal(metrics.availableVolunteers, 1)
  assert.equal(metrics.assignableToSelectedCampaign, 2)
})

test('calculateQualityMetrics reports review and evidence indicators', () => {
  const quality = calculateQualityMetrics([
    { metrics: { fieldUpdates: 2, reportsGenerated: 2, reportsApproved: 1, pendingApprovals: 1, reportsNeedingRevision: 0 } },
    { metrics: { fieldUpdates: 0, reportsGenerated: 0, reportsApproved: 0, pendingApprovals: 0, reportsNeedingRevision: 0 } },
  ])

  assert.equal(quality.updatesPerCampaign, '1.0')
  assert.equal(quality.approvalRate, '50%')
  assert.equal(quality.reviewQueue, 1)
  assert.equal(quality.evidenceReadyCampaigns, 1)
  assert.equal(quality.evidenceCoverage, '50%')
  assert.equal(quality.reportCoverage, '50%')
})
