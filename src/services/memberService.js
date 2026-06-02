import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

export const memberRoles = ['admin', 'coordinator', 'reviewer']

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeRole(role) {
  return memberRoles.includes(role) ? role : 'reviewer'
}

export async function getWorkspaceMembers({ organizationId }) {
  if (!isSupabaseConfigured || !organizationId) {
    return { members: [], error: null, skipped: true }
  }

  const { data, error } = await supabase.rpc('get_organization_members', {
    p_organization_id: organizationId,
  })

  return { members: data || [], error, skipped: false }
}

export async function addWorkspaceMember({ organizationId, email, role }) {
  if (!isSupabaseConfigured) {
    return { member: null, error: new Error('Supabase is not configured.'), skipped: true }
  }

  if (!organizationId) {
    return { member: null, error: new Error('Workspace is required to add a member.'), skipped: false }
  }

  const { data, error } = await supabase.rpc('add_organization_member_by_email', {
    p_organization_id: organizationId,
    p_email: normalizeEmail(email),
    p_role: normalizeRole(role),
  })

  return { member: Array.isArray(data) ? data[0] : data, error, skipped: false }
}

export async function updateWorkspaceMemberRole({ organizationId, membershipId, role }) {
  if (!isSupabaseConfigured) {
    return { member: null, error: new Error('Supabase is not configured.'), skipped: true }
  }

  if (!organizationId || !membershipId) {
    return { member: null, error: new Error('Workspace and membership are required to update a role.'), skipped: false }
  }

  const { data, error } = await supabase.rpc('update_organization_member_role', {
    p_organization_id: organizationId,
    p_membership_id: membershipId,
    p_role: normalizeRole(role),
  })

  return { member: Array.isArray(data) ? data[0] : data, error, skipped: false }
}

export async function removeWorkspaceMember({ organizationId, membershipId }) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.'), skipped: true }
  }

  if (!organizationId || !membershipId) {
    return { error: new Error('Workspace and membership are required to remove a member.'), skipped: false }
  }

  const { error } = await supabase.rpc('remove_organization_member', {
    p_organization_id: organizationId,
    p_membership_id: membershipId,
  })

  return { error, skipped: false }
}
