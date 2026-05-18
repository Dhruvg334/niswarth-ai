import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

function normalizeWorkspace(organization, role = 'admin') {
  if (!organization) return null

  return {
    id: organization.id,
    name: organization.name,
    city: organization.city || '',
    role,
    createdAt: organization.created_at,
  }
}

export async function getUserWorkspace(userId) {
  if (!isSupabaseConfigured || !userId) {
    return { workspace: null, error: null }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id, role, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) return { workspace: null, error: membershipError }
  if (!membership?.organization_id) return { workspace: null, error: null }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('id, name, city, created_at')
    .eq('id', membership.organization_id)
    .maybeSingle()

  if (organizationError) return { workspace: null, error: organizationError }

  return { workspace: normalizeWorkspace(organization, membership.role), error: null }
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

  const { data, error: fetchError } = await supabase
    .from('organizations')
    .select('id, name, city, created_at')
    .eq('id', organizationId)
    .maybeSingle()

  if (fetchError) return { workspace: null, error: fetchError }

  return {
    workspace: normalizeWorkspace(data || { id: organizationId, name: cleanName, city: cleanCity, created_at: new Date().toISOString() }, 'admin'),
    error: null,
  }
}
