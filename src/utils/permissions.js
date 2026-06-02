export const WORKSPACE_ROLES = {
  admin: 'admin',
  coordinator: 'coordinator',
  reviewer: 'reviewer',
}

export const ROLE_LABELS = {
  admin: 'Admin',
  coordinator: 'Coordinator',
  reviewer: 'Reviewer',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTIONS = {
  admin: 'Full workspace control',
  coordinator: 'Campaign execution and reporting',
  reviewer: 'Report review and approval',
  viewer: 'Read-only workspace access',
}

function normalizeRole(role) {
  return Object.values(WORKSPACE_ROLES).includes(role) ? role : 'viewer'
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)]
}

export function getRoleDescription(role) {
  return ROLE_DESCRIPTIONS[normalizeRole(role)]
}

export function getWorkspacePermissions(role) {
  const normalizedRole = normalizeRole(role)
  const isAdmin = normalizedRole === WORKSPACE_ROLES.admin
  const isCoordinator = normalizedRole === WORKSPACE_ROLES.coordinator
  const isReviewer = normalizedRole === WORKSPACE_ROLES.reviewer

  return {
    role: normalizedRole,
    isAdmin,
    isCoordinator,
    isReviewer,
    canManageMembers: isAdmin,
    canCreateCampaigns: isAdmin,
    canEditCampaigns: isAdmin,
    canDeleteCampaigns: isAdmin,
    canManageVolunteers: isAdmin || isCoordinator,
    canAddFieldUpdates: isAdmin || isCoordinator,
    canGenerateReports: isAdmin || isCoordinator,
    canSaveReportDrafts: isAdmin || isCoordinator,
    canSendReportsForReview: isAdmin || isCoordinator,
    canReviewReports: isAdmin || isReviewer,
  }
}
