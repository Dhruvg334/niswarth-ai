import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { campaigns as fallbackCampaigns } from '../data/campaigns.js'
import { calculateCampaignMetrics } from '../utils/calculateMetrics.js'

const typeLabels = {
  education: 'Education Drive',
  animal_welfare: 'Animal Welfare',
  environment: 'Environment Drive',
  other: 'Other Campaign',
}

const statusLabels = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
  paused: 'Paused',
}

const availabilityLabels = {
  available: 'Available',
  limited: 'Limited',
  unavailable: 'Unavailable',
}

function normalizeFallbackCampaign(campaign) {
  return {
    ...campaign,
    rawStatus: campaign.status.toLowerCase().replace(' ', '_'),
    dbBacked: false,
  }
}

function groupBy(items, key) {
  return items.reduce((map, item) => {
    const value = item?.[key]
    if (!value) return map
    if (!map.has(value)) map.set(value, [])
    map.get(value).push(item)
    return map
  }, new Map())
}

function mapCampaignRows({ campaigns, volunteers, campaignVolunteers, fieldUpdates, impactReports, aiGenerationLogs = [], reportVersions = [] }) {
  const logsByReportId = groupBy(aiGenerationLogs, 'report_id')
  const versionsByReportId = groupBy(reportVersions, 'report_id')
  return campaigns.map((campaign) => {
    const assignmentRows = campaignVolunteers.filter((item) => item.campaign_id === campaign.id)
    const assignedVolunteers = assignmentRows.map((assignment) => {
      const volunteer = volunteers.find((item) => item.id === assignment.volunteer_id)
      return {
        id: volunteer?.id || assignment.volunteer_id,
        name: volunteer?.name || 'Unnamed volunteer',
        role: volunteer?.role || 'Volunteer',
        assignmentRole: assignment.assignment_role || volunteer?.role || 'Volunteer',
        city: volunteer?.city || '',
        availability: volunteer?.availability || 'available',
        availabilityLabel: availabilityLabels[volunteer?.availability] || volunteer?.availability || 'Available',
        assignmentCount: campaignVolunteers.filter((item) => item.volunteer_id === assignment.volunteer_id).length,
      }
    })

    const updates = fieldUpdates
      .filter((update) => update.campaign_id === campaign.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const reports = impactReports
      .filter((report) => report.campaign_id === campaign.id)
      .map((report) => ({
        ...report,
        ai_generation_logs: (logsByReportId.get(report.id) || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        report_versions: (versionsByReportId.get(report.id) || []).sort((a, b) => (b.version_number || 0) - (a.version_number || 0)),
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const metrics = calculateCampaignMetrics({
      volunteers: assignedVolunteers,
      updates,
      reports,
      status: campaign.status,
    })

    return {
      id: campaign.id,
      organizationId: campaign.organization_id,
      type: typeLabels[campaign.type] || campaign.type,
      rawType: campaign.type,
      title: campaign.title,
      location: campaign.location,
      status: statusLabels[campaign.status] || campaign.status,
      rawStatus: campaign.status,
      goal: campaign.goal,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      completion: metrics.completion,
      volunteers: assignedVolunteers,
      updates: updates.map((update) => update.update_text),
      fieldUpdates: updates,
      reports,
      metrics: {
        ...metrics,
        eventsCompleted: `${Math.min(updates.length, 5)}/${campaign.status === 'planning' ? 5 : 8}`,
        draftReadiness: Math.min(95, 55 + updates.length * 8 + reports.length * 4),
      },
      nextActions: buildNextActions(campaign.type, campaign.status),
      dbBacked: true,
    }
  })
}

function buildNextActions(type, status) {
  if (status === 'planning') {
    return ['Confirm campaign dates', 'Assign field volunteers', 'Prepare first update checklist']
  }

  const shared = ['Review field updates', 'Prepare human-reviewed impact summary']

  if (type === 'education') return ['Confirm next learning session', 'Review student support notes', ...shared]
  if (type === 'animal_welfare') return ['Verify medical follow-ups', 'Confirm next feeding route', ...shared]
  if (type === 'environment') return ['Confirm sapling care plan', 'Assign post-activity follow-up', ...shared]

  return ['Review campaign progress', ...shared]
}


function enrichVolunteerProfiles({ volunteers, campaignVolunteers, campaigns }) {
  const campaignTitleById = new Map(campaigns.map((campaign) => [campaign.id, campaign.title]))
  const assignmentsByVolunteerId = campaignVolunteers.reduce((map, assignment) => {
    if (!map.has(assignment.volunteer_id)) map.set(assignment.volunteer_id, [])
    map.get(assignment.volunteer_id).push({
      campaignId: assignment.campaign_id,
      campaignTitle: campaignTitleById.get(assignment.campaign_id) || 'Unknown campaign',
      assignmentRole: assignment.assignment_role || 'Volunteer',
    })
    return map
  }, new Map())

  return volunteers.map((volunteer) => {
    const assignments = assignmentsByVolunteerId.get(volunteer.id) || []
    return {
      ...volunteer,
      availabilityLabel: availabilityLabels[volunteer.availability] || volunteer.availability,
      assignments,
      assignmentCount: assignments.length,
      isAssigned: assignments.length > 0,
      assignmentSummary: assignments.length > 0
        ? `Also on ${assignments.length} campaign${assignments.length > 1 ? 's' : ''}`
        : 'Free profile',
    }
  })
}

export async function getCampaignsWithRelations({ organizationId } = {}) {
  if (!isSupabaseConfigured || !organizationId) {
    return {
      campaigns: fallbackCampaigns.map(normalizeFallbackCampaign),
      volunteers: [],
      source: isSupabaseConfigured ? 'empty-workspace' : 'fallback',
      error: null,
    }
  }

  try {
    const [campaignsRes, volunteersRes, fieldUpdatesRes, impactReportsRes, aiLogsRes, reportVersionsRes] = await Promise.all([
      supabase.from('campaigns').select('*').eq('organization_id', organizationId).order('created_at', { ascending: true }),
      supabase.from('volunteers').select('*').eq('organization_id', organizationId).order('created_at', { ascending: true }),
      supabase.from('field_updates').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }),
      supabase.from('impact_reports').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }),
      supabase.from('ai_generation_logs').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }),
      supabase.from('report_versions').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }),
    ])

    const firstError = [campaignsRes, volunteersRes, fieldUpdatesRes, impactReportsRes, aiLogsRes, reportVersionsRes].find((result) => result.error)?.error
    if (firstError) throw firstError

    const campaignIds = (campaignsRes.data || []).map((campaign) => campaign.id)
    const campaignVolunteersRes = campaignIds.length > 0
      ? await supabase.from('campaign_volunteers').select('*').in('campaign_id', campaignIds)
      : { data: [], error: null }

    if (campaignVolunteersRes.error) throw campaignVolunteersRes.error

    return {
      campaigns: mapCampaignRows({
        campaigns: campaignsRes.data || [],
        volunteers: volunteersRes.data || [],
        campaignVolunteers: campaignVolunteersRes.data || [],
        fieldUpdates: fieldUpdatesRes.data || [],
        impactReports: impactReportsRes.data || [],
        aiGenerationLogs: aiLogsRes.data || [],
        reportVersions: reportVersionsRes.data || [],
      }),
      volunteers: enrichVolunteerProfiles({
        volunteers: volunteersRes.data || [],
        campaignVolunteers: campaignVolunteersRes.data || [],
        campaigns: campaignsRes.data || [],
      }),
      source: 'supabase',
      error: null,
    }
  } catch (error) {
    return {
      campaigns: fallbackCampaigns.map(normalizeFallbackCampaign),
      volunteers: [],
      source: 'fallback',
      error,
    }
  }
}

export async function createCampaign({ organizationId, title, type, location, status = 'planning', goal = '', startDate = '', endDate = '' }) {
  if (!isSupabaseConfigured) {
    return { campaign: null, error: new Error('Supabase is not configured.'), skipped: true }
  }

  if (!organizationId) {
    return { campaign: null, error: new Error('Workspace is required to create a campaign.'), skipped: false }
  }

  const payload = {
    organization_id: organizationId,
    title: title.trim(),
    type,
    location: location.trim(),
    status,
    goal: goal.trim() || null,
    start_date: startDate || null,
    end_date: endDate || null,
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert(payload)
    .select('*')
    .single()

  return { campaign: data, error, skipped: false }
}


export async function updateCampaign({ organizationId, campaignId, title, type, location, status = 'planning', goal = '', startDate = '', endDate = '' }) {
  if (!isSupabaseConfigured) {
    return { campaign: null, error: new Error('Supabase is not configured.'), skipped: true }
  }

  if (!organizationId) {
    return { campaign: null, error: new Error('Workspace is required to update a campaign.'), skipped: false }
  }

  if (!campaignId) {
    return { campaign: null, error: new Error('Campaign is required for update.'), skipped: false }
  }

  const payload = {
    title: title.trim(),
    type,
    location: location.trim(),
    status,
    goal: goal.trim() || null,
    start_date: startDate || null,
    end_date: endDate || null,
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update(payload)
    .eq('id', campaignId)
    .eq('organization_id', organizationId)
    .select('*')
    .single()

  return { campaign: data, error, skipped: false }
}

export async function createFieldUpdate({ organizationId, campaignId, updateText, location = '', submittedBy = '', evidenceType = 'text' }) {
  if (!isSupabaseConfigured) {
    return { fieldUpdate: null, error: new Error('Supabase is not configured.'), skipped: true }
  }

  if (!organizationId) {
    return { fieldUpdate: null, error: new Error('Workspace is required to add a field update.'), skipped: false }
  }

  const payload = {
    organization_id: organizationId,
    campaign_id: campaignId,
    update_text: updateText.trim(),
    location: location.trim() || null,
    submitted_by: submittedBy.trim() || null,
    evidence_type: evidenceType,
  }

  const { data, error } = await supabase
    .from('field_updates')
    .insert(payload)
    .select('*')
    .single()

  return { fieldUpdate: data, error, skipped: false }
}


export async function createVolunteer({ organizationId, name, role, city = '', availability = 'available' }) {
  if (!isSupabaseConfigured) {
    return { volunteer: null, error: new Error('Supabase is not configured.'), skipped: true }
  }

  if (!organizationId) {
    return { volunteer: null, error: new Error('Workspace is required to create a volunteer.'), skipped: false }
  }

  const payload = {
    organization_id: organizationId,
    name: name.trim(),
    role: role.trim(),
    city: city.trim() || null,
    availability,
  }

  const { data, error } = await supabase
    .from('volunteers')
    .insert(payload)
    .select('*')
    .single()

  return { volunteer: data, error, skipped: false }
}

export async function assignVolunteerToCampaign({ campaignId, volunteerId, assignmentRole }) {
  if (!isSupabaseConfigured) {
    return { assignment: null, error: new Error('Supabase is not configured.'), skipped: true }
  }

  const payload = {
    campaign_id: campaignId,
    volunteer_id: volunteerId,
    assignment_role: assignmentRole.trim(),
  }

  const { data, error } = await supabase
    .from('campaign_volunteers')
    .insert(payload)
    .select('*')
    .single()

  return { assignment: data, error, skipped: false }
}


export async function deleteCampaign({ organizationId, campaignId }) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.'), skipped: true }
  }

  if (!organizationId) {
    return { error: new Error('Workspace is required to delete a campaign.'), skipped: false }
  }

  if (!campaignId) {
    return { error: new Error('Campaign is required for deletion.'), skipped: false }
  }

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('organization_id', organizationId)

  return { error, skipped: false }
}
