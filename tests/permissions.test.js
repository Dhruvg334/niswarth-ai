import test from 'node:test'
import assert from 'node:assert/strict'
import { getRoleLabel, getWorkspacePermissions } from '../src/utils/permissions.js'

test('admin has full workspace controls', () => {
  const permissions = getWorkspacePermissions('admin')

  assert.equal(permissions.canManageMembers, true)
  assert.equal(permissions.canCreateCampaigns, true)
  assert.equal(permissions.canEditCampaigns, true)
  assert.equal(permissions.canDeleteCampaigns, true)
  assert.equal(permissions.canManageVolunteers, true)
  assert.equal(permissions.canAddFieldUpdates, true)
  assert.equal(permissions.canGenerateReports, true)
  assert.equal(permissions.canReviewReports, true)
})

test('coordinator can execute campaigns but not manage members or approve reports', () => {
  const permissions = getWorkspacePermissions('coordinator')

  assert.equal(permissions.canManageMembers, false)
  assert.equal(permissions.canCreateCampaigns, false)
  assert.equal(permissions.canEditCampaigns, false)
  assert.equal(permissions.canDeleteCampaigns, false)
  assert.equal(permissions.canManageVolunteers, true)
  assert.equal(permissions.canAddFieldUpdates, true)
  assert.equal(permissions.canGenerateReports, true)
  assert.equal(permissions.canSendReportsForReview, true)
  assert.equal(permissions.canReviewReports, false)
})

test('reviewer can review reports but not change campaign execution data', () => {
  const permissions = getWorkspacePermissions('reviewer')

  assert.equal(permissions.canManageMembers, false)
  assert.equal(permissions.canCreateCampaigns, false)
  assert.equal(permissions.canEditCampaigns, false)
  assert.equal(permissions.canDeleteCampaigns, false)
  assert.equal(permissions.canManageVolunteers, false)
  assert.equal(permissions.canAddFieldUpdates, false)
  assert.equal(permissions.canGenerateReports, false)
  assert.equal(permissions.canReviewReports, true)
})

test('unknown role falls back to viewer access', () => {
  const permissions = getWorkspacePermissions('unknown')

  assert.equal(getRoleLabel('unknown'), 'Viewer')
  assert.equal(permissions.canManageMembers, false)
  assert.equal(permissions.canGenerateReports, false)
  assert.equal(permissions.canReviewReports, false)
})
