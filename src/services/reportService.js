import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

export async function saveImpactReportDraft({
  organizationId,
  campaignId,
  draftText,
  editedText = '',
  evidenceUsed = [],
  missingEvidence = [],
  riskFlags = [],
  nextActions = [],
  aiModel = null,
  generationSource = null,
}) {
  if (!isSupabaseConfigured) {
    return { report: null, error: null, skipped: true }
  }

  if (!organizationId) {
    return { report: null, error: new Error('Workspace is required to save an impact report.'), skipped: false }
  }

  const { data, error } = await supabase
    .from('impact_reports')
    .insert({
      organization_id: organizationId,
      campaign_id: campaignId,
      draft_text: draftText,
      edited_text: editedText || draftText,
      evidence_used: normalizeArray(evidenceUsed),
      missing_evidence: normalizeArray(missingEvidence),
      risk_flags: normalizeArray(riskFlags),
      next_actions: normalizeArray(nextActions),
      ai_model: aiModel,
      generation_source: generationSource,
      status: 'draft',
    })
    .select('*')
    .single()

  return { report: data, error, skipped: false }
}

export async function updateImpactReportDraft({ reportId, editedText }) {
  if (!isSupabaseConfigured || !reportId) {
    return { report: null, error: null, skipped: true }
  }

  const { data, error } = await supabase
    .from('impact_reports')
    .update({
      edited_text: editedText,
      status: 'draft',
      approved_at: null,
    })
    .eq('id', reportId)
    .select('*')
    .single()

  return { report: data, error, skipped: false }
}

export async function updateImpactReportStatus({ reportId, status, reviewNotes = '' }) {
  if (!isSupabaseConfigured || !reportId) {
    return { report: null, error: null, skipped: true }
  }

  const payload = {
    status,
    review_notes: reviewNotes.trim() || null,
    approved_at: status === 'approved' ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('impact_reports')
    .update(payload)
    .eq('id', reportId)
    .select('*')
    .single()

  return { report: data, error, skipped: false }
}

export async function markReportReviewed(reportId) {
  return updateImpactReportStatus({ reportId, status: 'approved' })
}
