import { useState } from 'react'
import { AlertCircle, CheckCircle2, Copy, RotateCcw, Save, Send, Sparkles } from 'lucide-react'
import Button from '../common/Button.jsx'
import { generateImpactReport, normalizeReportMetadata } from '../../utils/generateImpactReport.js'
import { generateAiImpactReport } from '../../services/aiReportService.js'
import { saveImpactReportDraft, updateImpactReportDraft, updateImpactReportStatus } from '../../services/reportService.js'

const statusLabels = {
  draft: 'Draft in progress',
  under_review: 'Sent for review',
  approved: 'Approved',
  needs_revision: 'Needs revision',
}

const statusStyles = {
  draft: 'bg-slate-100 text-slate-700',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  needs_revision: 'bg-amber-100 text-amber-800',
}

function FeedbackMessage({ type, message }) {
  if (!message) return null
  const isError = type === 'error'
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 text-sm leading-6 ${isError ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
      {isError ? <AlertCircle className="mt-0.5 shrink-0" size={18} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={18} />}
      <p>{message}</p>
    </div>
  )
}

function CompactList({ title, items = [], emptyText, tone = 'green' }) {
  const visibleItems = items.slice(0, 3)
  const toneClass = tone === 'amber'
    ? 'border-amber-100 bg-amber-50/55 text-amber-900'
    : tone === 'slate'
      ? 'border-slate-100 bg-slate-50 text-slate-700'
      : 'border-green-100 bg-green-50/55 text-slate-700'

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-ink">{title}</p>
        {items.length > 3 && <span className="text-xs font-bold text-slate-500">+{items.length - 3}</span>}
      </div>
      {visibleItems.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-6">
          {visibleItems.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
              <span>{typeof item === 'string' ? item : item.note}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyText}</p>
      )}
    </div>
  )
}

function getReportMetadata(report) {
  const metadata = normalizeReportMetadata(report)
  return {
    evidenceUsed: metadata.evidenceUsed,
    missingEvidence: metadata.missingEvidence,
    riskFlags: metadata.riskFlags,
    nextActions: metadata.nextActions,
    aiModel: metadata.aiModel,
    generationSource: metadata.generationSource,
  }
}

export default function ImpactReportGenerator({ campaign, organizationId, onReportSaved }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [report, setReport] = useState(null)
  const [draftText, setDraftText] = useState('')
  const [savedReportId, setSavedReportId] = useState(null)
  const [reportStatus, setReportStatus] = useState('draft')
  const [reviewNotes, setReviewNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  function resetMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function saveGeneratedReport(generatedReport) {
    if (!campaign.dbBacked) return

    const metadata = getReportMetadata(generatedReport)
    setSaving(true)
    const { report: savedReport, error } = await saveImpactReportDraft({
      organizationId,
      campaignId: campaign.id,
      draftText: generatedReport.summary,
      editedText: generatedReport.summary,
      evidenceUsed: metadata.evidenceUsed,
      missingEvidence: metadata.missingEvidence,
      riskFlags: metadata.riskFlags,
      nextActions: metadata.nextActions,
      aiModel: metadata.aiModel,
      generationSource: metadata.generationSource,
    })
    setSaving(false)

    if (error) {
      throw error
    }

    if (savedReport?.id) {
      setSavedReportId(savedReport.id)
    }
  }

  async function handleGenerate() {
    if (!campaign?.updates?.length) {
      setErrorMessage('Add at least one field update before generating an impact report. Reports should be grounded in field evidence.')
      return
    }

    resetMessages()
    setLoading(true)
    setSaving(false)
    setReport(null)
    setDraftText('')
    setSavedReportId(null)
    setReportStatus('draft')
    setReviewNotes('')

    try {
      const generatedReport = await generateAiImpactReport(campaign)
      setReport(generatedReport)
      setDraftText(generatedReport.summary)
      setSuccessMessage('AI draft created. Review and edit it before moving it forward.')

      try {
        await saveGeneratedReport(generatedReport)
        if (campaign.dbBacked) setSuccessMessage('AI draft created and saved. Review and edit it before moving it forward.')
      } catch {
        setErrorMessage('The AI draft was created, but saving it to the database failed. Check Supabase table policies and environment variables.')
      }
    } catch {
      const fallbackReport = generateImpactReport(campaign)
      setReport(fallbackReport)
      setDraftText(fallbackReport.summary)
      setErrorMessage('The AI service could not complete the request, so Niswarth prepared a structured draft from the available field updates. Please review it carefully before sharing.')

      try {
        await saveGeneratedReport(fallbackReport)
      } catch {
        setErrorMessage('The AI service could not complete the request. A structured draft was prepared locally, but saving it to the database failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveDraft() {
    resetMessages()
    if (!draftText.trim()) {
      setErrorMessage('The report draft cannot be empty.')
      return
    }

    if (!savedReportId) {
      setSuccessMessage('Draft changes are kept locally for this session.')
      return
    }

    setSaving(true)
    const { error } = await updateImpactReportDraft({ reportId: savedReportId, editedText: draftText.trim() })
    setSaving(false)

    if (error) {
      setErrorMessage('Could not save the edited draft. Check Supabase update permissions for impact_reports.')
      return
    }

    setReportStatus('draft')
    setSuccessMessage('Edited draft saved successfully.')
  }

  async function handleStatusChange(nextStatus) {
    resetMessages()
    if (!draftText.trim()) {
      setErrorMessage('The report draft cannot be empty.')
      return
    }

    if (nextStatus === 'needs_revision' && reviewNotes.trim().length < 8) {
      setErrorMessage('Add a short review note before marking the report as needs revision.')
      return
    }

    if (!savedReportId) {
      setReportStatus(nextStatus)
      setSuccessMessage(`Report moved to ${statusLabels[nextStatus].toLowerCase()} for this session.`)
      return
    }

    setSaving(true)
    const saveDraftResult = await updateImpactReportDraft({ reportId: savedReportId, editedText: draftText.trim() })
    if (saveDraftResult.error) {
      setSaving(false)
      setErrorMessage('Could not save the edited report text before updating status.')
      return
    }

    const { error } = await updateImpactReportStatus({
      reportId: savedReportId,
      status: nextStatus,
      reviewNotes,
    })
    setSaving(false)

    if (error) {
      setErrorMessage('Could not update the report review status. Check Supabase update policy for impact_reports.')
      return
    }

    setReportStatus(nextStatus)
    setSuccessMessage(`Report status updated: ${statusLabels[nextStatus]}.`)
    onReportSaved?.()
  }

  async function handleCopy() {
    if (!draftText) return
    await navigator.clipboard?.writeText(draftText)
    setSuccessMessage('Draft copied to clipboard.')
  }

  const canGenerate = Boolean(campaign?.updates?.length) && !loading && !saving
  const isFinalApproved = reportStatus === 'approved'
  const metadata = report ? getReportMetadata(report) : null

  return (
    <div className="premium-card rounded-[2rem] p-6 sm:p-8 lg:p-9">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-leaf">Human-reviewed reporting</p>
          <h2 className="mt-3 display-font text-3xl font-extrabold text-ink sm:text-4xl">AI impact report workspace</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Create a field-backed draft, review the evidence behind it, and approve only after a human check.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          <Sparkles className="mr-2" size={18} /> Generate Draft
        </Button>
      </div>

      <div className="mt-7 rounded-[1.5rem] border border-green-100 bg-green-50/55 p-5 sm:p-6">
        {loading && <p className="text-sm font-semibold text-forest">Reading field updates and preparing a review-ready draft...</p>}
        {saving && <p className="mt-3 text-xs font-bold text-forest">Saving workflow changes...</p>}
        {!loading && !report && (
          <div className="rounded-2xl bg-white/85 p-5 text-sm leading-7 text-slate-600">
            {campaign?.updates?.length
              ? 'Click “Generate Draft” to prepare a first report draft from this campaign’s field updates.'
              : 'Add field updates before generating an impact report. This keeps the report grounded in real activity.'}
          </div>
        )}

        {!report && <div className="mt-4 space-y-3"><FeedbackMessage type="error" message={errorMessage} /><FeedbackMessage type="success" message={successMessage} /></div>}

        {report && (
          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leaf">Editable report draft</p>
                  <h3 className="mt-2 display-font text-2xl font-extrabold text-ink">{report.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Keep the language clear and remove anything not supported by field updates.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-forest">Readiness {report.confidence}%</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[reportStatus] || statusStyles.draft}`}>{statusLabels[reportStatus] || 'Draft in progress'}</span>
                  {campaign.dbBacked && savedReportId && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Saved</span>}
                </div>
              </div>

              <label className="sr-only" htmlFor="impact-report-editor">Editable impact report draft</label>
              <textarea
                id="impact-report-editor"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                rows={9}
                disabled={isFinalApproved}
                className="mt-5 min-h-[260px] w-full rounded-2xl border border-green-100 bg-green-50/35 p-5 text-base leading-8 text-slate-700 outline-none transition focus:border-leaf focus:ring-4 focus:ring-green-100 disabled:bg-slate-50 disabled:text-slate-500"
              />

              {metadata && (
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <CompactList title="Evidence used" items={metadata.evidenceUsed} emptyText="No evidence mapping was returned." />
                  <CompactList title="Missing info" items={metadata.missingEvidence} emptyText="No major gaps flagged." tone="amber" />
                  <CompactList title="Review cautions" items={metadata.riskFlags} emptyText="No specific cautions flagged." tone="amber" />
                  <CompactList title="Next steps" items={metadata.nextActions} emptyText="No next actions suggested." tone="slate" />
                </div>
              )}
            </section>

            <section className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-soft sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="rounded-2xl bg-green-50/60 p-4 text-xs leading-5 text-slate-600">
                  <span className="font-extrabold text-forest">Human review required.</span> {report.disclaimer}
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-ink" htmlFor="review-notes">Review notes</label>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Add notes only when the report needs correction, missing evidence, or clarification.</p>
                  <textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    rows={3}
                    placeholder="Example: Verify attendance count before external sharing."
                    className="mt-3 w-full rounded-2xl border border-green-100 bg-green-50/40 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-leaf focus:ring-4 focus:ring-green-100"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <FeedbackMessage type="error" message={errorMessage} />
                <FeedbackMessage type="success" message={successMessage} />
              </div>

              <div className="mt-5 border-t border-green-100 pt-5">
                <p className="text-sm font-extrabold text-ink">Report actions</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={handleCopy} className="min-w-[160px] justify-center"><Copy className="mr-2" size={18} /> Copy Draft</Button>
                  <Button variant="secondary" onClick={handleSaveDraft} disabled={saving || isFinalApproved} className="min-w-[160px] justify-center"><Save className="mr-2" size={18} /> Save Draft</Button>
                  <Button onClick={() => handleStatusChange('under_review')} disabled={saving || isFinalApproved} className="min-w-[190px] justify-center"><Send className="mr-2" size={18} /> Send for Review</Button>
                  <Button variant="secondary" onClick={() => handleStatusChange('needs_revision')} disabled={saving || isFinalApproved} className="min-w-[170px] justify-center"><RotateCcw className="mr-2" size={18} /> Needs Revision</Button>
                  <Button onClick={() => handleStatusChange('approved')} disabled={saving || isFinalApproved} className="min-w-[180px] justify-center"><CheckCircle2 className="mr-2" size={18} /> Approve Report</Button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
