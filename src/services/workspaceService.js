import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

function normalizeWorkspace(organization, role = 'admin', membership = {}) {
  if (!organization) return null

  return {
    id: organization.id,
    name: organization.name,
    city: organization.city || '',
    role,
    membershipId: membership.id || membership.membership_id || null,
    memberSince: membership.created_at || null,
    createdAt: organization.created_at || new Date().toISOString(),
  }
}

function sortWorkspaces(workspaces) {
  return [...workspaces].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (a.role !== 'admin' && b.role === 'admin') return 1
    return new Date(a.memberSince || a.createdAt || 0) - new Date(b.memberSince || b.createdAt || 0)
  })
}

export async function getUserWorkspaces(userId) {
  if (!isSupabaseConfigured || !userId) {
    return { workspaces: [], error: null }
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('id, organization_id, role, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (membershipError) return { workspaces: [], error: membershipError }
  if (!memberships?.length) return { workspaces: [], error: null }

  const organizationIds = memberships.map((membership) => membership.organization_id).filter(Boolean)

  const { data: organizations, error: organizationError } = await supabase
    .from('organizations')
    .select('id, name, city, created_at')
    .in('id', organizationIds)

  if (organizationError) return { workspaces: [], error: organizationError }

  const organizationMap = new Map((organizations || []).map((organization) => [organization.id, organization]))
  const workspaces = memberships
    .map((membership) => normalizeWorkspace(organizationMap.get(membership.organization_id), membership.role, membership))
    .filter(Boolean)

  return { workspaces: sortWorkspaces(workspaces), error: null }
}

export async function getUserWorkspace(userId, preferredWorkspaceId = null) {
  const { workspaces, error } = await getUserWorkspaces(userId)
  if (error) return { workspace: null, workspaces: [], error }
  if (!workspaces.length) return { workspace: null, workspaces: [], error: null }

  const preferredWorkspace = preferredWorkspaceId
    ? workspaces.find((workspace) => workspace.id === preferredWorkspaceId)
    : null

  return {
    workspace: preferredWorkspace || workspaces[0],
    workspaces,
    error: null,
  }
}

export async function createWorkspace({ name, city }) {
  if (!isSupabaseConfigured) {
    return { workspace: null, error: new Error('Supabase is not configured.') }
  }

  const cleanName = name.trim()
  const cleanCity = city.trim()

  const { data: organizationId, error } = await supabase.rpc('create_workspace_with_starter_data', {
    p_name: cleanName,
    p_city: cleanCity || null,
  })

  if (error) return { workspace: null, error }
  if (!organizationId) return { workspace: null, error: new Error('Workspace was not created. No organization ID was returned.') }

  // Do not immediately re-query the organization here.
  // The RPC has already created the organization and membership. Returning an optimistic
  // workspace avoids UI stalls caused by auth/session refocus events or delayed RLS reads.
  return {
    workspace: normalizeWorkspace({
      id: organizationId,
      name: cleanName,
      city: cleanCity,
      created_at: new Date().toISOString(),
    }, 'admin'),
    error: null,
  }
}
