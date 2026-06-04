import test from 'node:test'
import assert from 'node:assert/strict'
import {
  REPORT_STATUS,
  canReviewReportDecision,
  canSendReportForReview,
  getReportWorkflowHint,
  normalizeReportStatus,
} from '../src/utils/reportWorkflow.js'

const admin = { canSendReportsForReview: true, canReviewReports: true }
const coordinator = { canSendReportsForReview: true, canReviewReports: false }
const reviewer = { canSendReportsForReview: false, canReviewReports: true }

test('normalizes unknown report statuses to draft', () => {
  assert.equal(normalizeReportStatus('missing_status'), REPORT_STATUS.draft)
  assert.equal(normalizeReportStatus(REPORT_STATUS.approved), REPORT_STATUS.approved)
})

test('only draft and needs-revision reports can be sent for review', () => {
  assert.equal(canSendReportForReview(REPORT_STATUS.draft, coordinator), true)
  assert.equal(canSendReportForReview(REPORT_STATUS.needsRevision, coordinator), true)
  assert.equal(canSendReportForReview(REPORT_STATUS.underReview, coordinator), false)
  assert.equal(canSendReportForReview(REPORT_STATUS.approved, coordinator), false)
})

test('review decisions are available only for under-review reports', () => {
  assert.equal(canReviewReportDecision(REPORT_STATUS.underReview, reviewer), true)
  assert.equal(canReviewReportDecision(REPORT_STATUS.draft, reviewer), false)
  assert.equal(canReviewReportDecision(REPORT_STATUS.needsRevision, reviewer), false)
  assert.equal(canReviewReportDecision(REPORT_STATUS.approved, reviewer), false)
})

test('admins still follow the report lifecycle instead of approving drafts directly', () => {
  assert.equal(canSendReportForReview(REPORT_STATUS.draft, admin), true)
  assert.equal(canReviewReportDecision(REPORT_STATUS.draft, admin), false)
  assert.equal(canReviewReportDecision(REPORT_STATUS.underReview, admin), true)
})

test('workflow hints stay role and status aware', () => {
  assert.match(getReportWorkflowHint(REPORT_STATUS.underReview, coordinator), /waiting for a reviewer/i)
  assert.match(getReportWorkflowHint(REPORT_STATUS.underReview, reviewer), /approve it or send it back/i)
  assert.match(getReportWorkflowHint(REPORT_STATUS.approved, admin), /locked/i)
})
