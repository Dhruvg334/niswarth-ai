import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeBodyText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildInputSnapshot({ campaignId, draftText, evidenceUsed, missingEvidence, riskFlags, nextActions }) {
  return {
    campaignId,
    draftPreview: normalizeBodyText(draftText).slice(0, 500),
    evidenceCount: normalizeArray(evidenceUsed).length,
    missingEvidenceCount: normalizeArray(missingEvidence).length,
    riskFlagCount: normalizeArray(riskFlags).length,
    nextActionCount: normalizeArray(nextActions).length,
  }
}

async function getNextVersionNumber(reportId) {
  const { data, error } = await supabase
    .from('report_versions')
    .select('version_number')
    .eq('report_id', reportId)
    .order('version_number', { ascending: false })
    .limit(1)

  if (error) return { versionNumber: 1, error }

  const latest = Number(data?.[0]?.version_number || 0)
  return { versionNumber: latest + 1, error: null }
}

async function createReportVersion({ report, bodyText, title = 'Impact report', status = 'draft', reviewNotes = '' }) {
  if (!isSupabaseConfigured || !report?.id) {
    return { version: null, error: null, skipped: true }
  }

  const { versionNumber, error: versionNumberError } = await getNextVersionNumber(report.id)
  if (versionNumberError) {
    return { version: null, error: versionNumberError, skipped: false }
  }

  const { data, error } = await supabase
    .from('report_versions')
    .insert({
      organization_id: report.organization_id,
      campaign_id: report.campaign_id,
      report_id: report.id,
      version_number: versionNumber,
      title,
      body_text: normalizeBodyText(bodyText) || normalizeBodyText(report.edited_text) || normalizeBodyText(report.draft_text),
      status,
      review_notes: normalizeBodyText(reviewNotes) || report.review_notes || null,
    })
    .select('*')
    .single()

  return { version: data, error, skipped: false }
}

async function createAiGenerationLog({
  organizationId,
  campaignId,
  reportId = null,
  generationSource = null,
  aiModel = null,
  confidence = null,
  evidenceUsed = [],
  missingEvidence = [],
  riskFlags = [],
  nextActions = [],
  draftText = '',
  status = 'success',
  errorMessage = null,
}) {
  if (!isSupabaseConfigured) {
    return { log: null, error: null, skipped: true }
  }

  const source = generationSource || 'unknown'
  const logStatus = status || (source === 'local-fallback' ? 'fallback' : 'success')

  const { data, error } = await supabase
    .from('ai_generation_logs')
    .insert({
      organization_id: organizationId,
      campaign_id: campaignId,
      report_id: reportId,
      generation_source: source,
      ai_model: aiModel,
      confidence: Number.isFinite(Number(confidence)) ? Math.round(Number(confidence)) : null,
      status: logStatus,
      input_snapshot: buildInputSnapshot({ campaignId, draftText, evidenceUsed, missingEvidence, riskFlags, nextActions }),
      evidence_used: normalizeArray(evidenceUsed),
      missing_evidence: normalizeArray(missingEvidence),
      risk_flags: normalizeArray(riskFlags),
      error_message: errorMessage,
    })
    .select('*')
    .single()

  return { log: data, error, skipped: false }
}

export async function saveImpactReportDraft({
  organizationId,
  campaignId,
  draftText,
  editedText = '',
  title = 'Impact report draft',
  evidenceUsed = [],
  missingEvidence = [],
  riskFlags = [],
  nextActions = [],
  aiModel = null,
  generationSource = null,
  confidence = null,
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

  if (error || !data) {
    return { report: data, error, skipped: false }
  }

  await createAiGenerationLog({
    organizationId,
    campaignId,
    reportId: data.id,
    generationSource,
    aiModel,
    confidence,
    evidenceUsed,
    missingEvidence,
    riskFlags,
    nextActions,
    draftText,
    status: generationSource === 'local-fallback' ? 'fallback' : 'success',
  })

  await createReportVersion({
    report: data,
    bodyText: editedText || draftText,
    title,
    status: 'draft',
  })

  return { report: data, error: null, skipped: false }
}

export async function updateImpactReportDraft({ reportId, editedText, createVersion = true }) {
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

  if (error || !data || !createVersion) {
    return { report: data, error, skipped: false }
  }

  await createReportVersion({
    report: data,
    bodyText: editedText,
    title: 'Edited draft',
    status: 'draft',
  })

  return { report: data, error: null, skipped: false }
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

  if (error || !data) {
    return { report: data, error, skipped: false }
  }

  await createReportVersion({
    report: data,
    bodyText: data.edited_text || data.draft_text,
    title: `Report ${status.replace('_', ' ')}`,
    status,
    reviewNotes,
  })

  return { report: data, error: null, skipped: false }
}

export async function markReportReviewed(reportId) {
  return updateImpactReportStatus({ reportId, status: 'approved' })
}
