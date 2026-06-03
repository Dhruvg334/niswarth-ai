export const REPORT_STATUS = {
  draft: 'draft',
  underReview: 'under_review',
  approved: 'approved',
  needsRevision: 'needs_revision',
}

export const REPORT_STATUS_LABELS = {
  [REPORT_STATUS.draft]: 'Draft',
  [REPORT_STATUS.underReview]: 'Under review',
  [REPORT_STATUS.approved]: 'Approved',
  [REPORT_STATUS.needsRevision]: 'Needs revision',
}

export const REPORT_STATUS_LONG_LABELS = {
  [REPORT_STATUS.draft]: 'Draft in progress',
  [REPORT_STATUS.underReview]: 'Sent for review',
  [REPORT_STATUS.approved]: 'Approved',
  [REPORT_STATUS.needsRevision]: 'Needs revision',
}

export const REPORT_STATUS_STYLES = {
  [REPORT_STATUS.draft]: 'bg-slate-100 text-slate-700',
  [REPORT_STATUS.underReview]: 'bg-blue-100 text-blue-800',
  [REPORT_STATUS.approved]: 'bg-emerald-100 text-emerald-800',
  [REPORT_STATUS.needsRevision]: 'bg-amber-100 text-amber-800',
}

export function normalizeReportStatus(status) {
  return Object.values(REPORT_STATUS).includes(status) ? status : REPORT_STATUS.draft
}

export function getReportStatusLabel(status, { long = false } = {}) {
  const normalizedStatus = normalizeReportStatus(status)
  return long ? REPORT_STATUS_LONG_LABELS[normalizedStatus] : REPORT_STATUS_LABELS[normalizedStatus]
}

export function getReportStatusStyle(status) {
  return REPORT_STATUS_STYLES[normalizeReportStatus(status)]
}

export function isReportApproved(status) {
  return normalizeReportStatus(status) === REPORT_STATUS.approved
}

export function canSendReportForReview(status, permissions = {}) {
  const normalizedStatus = normalizeReportStatus(status)
  return Boolean(permissions.canSendReportsForReview) && [REPORT_STATUS.draft, REPORT_STATUS.needsRevision].includes(normalizedStatus)
}

export function canReviewReportDecision(status, permissions = {}) {
  return Boolean(permissions.canReviewReports) && normalizeReportStatus(status) === REPORT_STATUS.underReview
}

export function getReportWorkflowHint(status, permissions = {}) {
  const normalizedStatus = normalizeReportStatus(status)

  if (normalizedStatus === REPORT_STATUS.approved) {
    return 'Approved reports are locked for this workflow.'
  }

  if (canReviewReportDecision(normalizedStatus, permissions)) {
    return 'Review the draft, add notes if needed, then approve it or send it back for revision.'
  }

  if (canSendReportForReview(normalizedStatus, permissions)) {
    return normalizedStatus === REPORT_STATUS.needsRevision
      ? 'Update the draft and send it back for review when ready.'
      : 'Save the draft or send it for review when the field evidence looks complete.'
  }

  if (normalizedStatus === REPORT_STATUS.underReview) {
    return 'This report is waiting for a reviewer decision.'
  }

  return 'You can view this report state from Report History.'
}
