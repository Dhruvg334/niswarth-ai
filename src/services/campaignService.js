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

function normalizeFallbackCampaign(campaign) {
  return {
    ...campaign,
    rawStatus: campaign.status.toLowerCase().replace(' ', '_'),
    dbBacked: false,
  }
}

function mapCampaignRows({ campaigns, volunteers, campaignVolunteers, fieldUpdates, impactReports }) {
  return campaigns.map((campaign) => {
    const assignmentRows = campaignVolunteers.filter((item) => item.campaign_id === campaign.id)
    const assignedVolunteers = assignmentRows.map((assignment) => {
      const volunteer = volunteers.find((item) => item.id === assignment.volunteer_id)
      return {
        name: volunteer?.name || 'Unnamed volunteer',
        role: assignment.assignment_role || volunteer?.role || 'Volunteer',
        city: volunteer?.city || '',
      }
    })

    const updates = fieldUpdates
      .filter((update) => update.campaign_id === campaign.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const reports = impactReports
      .filter((report) => report.campaign_id === campaign.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const metrics = calculateCampaignMetrics({
      volunteers: assignedVolunteers,
      updates,
      reports,
      status: campaign.status,
    })

    return {
      id: campaign.id,
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

export async function getCampaignsWithRelations() {
  if (!isSupabaseConfigured) {
    return {
      campaigns: fallbackCampaigns.map(normalizeFallbackCampaign),
      source: 'fallback',
      error: null,
    }
  }

  try {
    const [campaignsRes, volunteersRes, campaignVolunteersRes, fieldUpdatesRes, impactReportsRes] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: true }),
      supabase.from('volunteers').select('*').order('created_at', { ascending: true }),
      supabase.from('campaign_volunteers').select('*'),
      supabase.from('field_updates').select('*').order('created_at', { ascending: false }),
      supabase.from('impact_reports').select('*').order('created_at', { ascending: false }),
    ])

    const firstError = [campaignsRes, volunteersRes, campaignVolunteersRes, fieldUpdatesRes, impactReportsRes].find((result) => result.error)?.error
    if (firstError) throw firstError

    return {
      campaigns: mapCampaignRows({
        campaigns: campaignsRes.data || [],
        volunteers: volunteersRes.data || [],
        campaignVolunteers: campaignVolunteersRes.data || [],
        fieldUpdates: fieldUpdatesRes.data || [],
        impactReports: impactReportsRes.data || [],
      }),
      source: 'supabase',
      error: null,
    }
  } catch (error) {
    return {
      campaigns: fallbackCampaigns.map(normalizeFallbackCampaign),
      source: 'fallback',
      error,
    }
  }
}


export async function createCampaign({ title, type, location, status = 'planning', goal = '', startDate = '', endDate = '' }) {
  if (!isSupabaseConfigured) {
    return { campaign: null, error: new Error('Supabase is not configured.'), skipped: true }
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
    .insert(payload)
    .select('*')
    .single()

  return { campaign: data, error, skipped: false }
}

export async function createFieldUpdate({ campaignId, updateText, location = '', submittedBy = '', evidenceType = 'text' }) {
  if (!isSupabaseConfigured) {
    return { fieldUpdate: null, error: new Error('Supabase is not configured.'), skipped: true }
  }

  const payload = {
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
