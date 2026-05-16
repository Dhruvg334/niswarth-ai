import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

export async function saveImpactReportDraft({ campaignId, draftText }) {
  if (!isSupabaseConfigured) {
    return { report: null, error: null, skipped: true }
  }

  const { data, error } = await supabase
    .from('impact_reports')
    .insert({
      campaign_id: campaignId,
      draft_text: draftText,
      status: 'draft',
    })
    .select('*')
    .single()

  return { report: data, error, skipped: false }
}

export async function markReportReviewed(reportId) {
  if (!isSupabaseConfigured || !reportId) {
    return { report: null, error: null, skipped: true }
  }

  const { data, error } = await supabase
    .from('impact_reports')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select('*')
    .single()

  return { report: data, error, skipped: false }
}
