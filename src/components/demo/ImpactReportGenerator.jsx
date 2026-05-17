import { useState } from 'react'
import { AlertCircle, CheckCircle2, Copy, RotateCcw, Save, Send, Sparkles } from 'lucide-react'
import Button from '../common/Button.jsx'
import { generateImpactReport } from '../../utils/generateImpactReport.js'
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

export default function ImpactReportGenerator({ campaign, onReportSaved }) {
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

    window.setTimeout(async () => {
      const generatedReport = generateImpactReport(campaign)
      setReport(generatedReport)
      setDraftText(generatedReport.summary)
      setLoading(false)

      if (campaign.dbBacked) {
        setSaving(true)
        const { report: savedReport, error } = await saveImpactReportDraft({
          campaignId: campaign.id,
          draftText: generatedReport.summary,
          editedText: generatedReport.summary,
        })
        setSaving(false)

        if (error) {
          setErrorMessage('Draft generated locally, but saving to the database failed. Check Supabase table policies and environment variables.')
          return
        }

        if (savedReport?.id) {
          setSavedReportId(savedReport.id)
          setSuccessMessage('Draft saved. Review and edit it before moving it forward.')
        }
      }
    }, 700)
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

  return (
    <div className="premium-card rounded-[2rem] p-6 sm:p-8 lg:p-9">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-leaf">Human-reviewed reporting</p>
          <h2 className="mt-3 display-font text-3xl font-extrabold text-ink sm:text-4xl">AI impact report workspace</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Turn field updates into a clear draft, refine the language, and move the report through a human review decision.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          <Sparkles className="mr-2" size={18} /> Generate Draft
        </Button>
      </div>

      <div className="mt-7 rounded-[1.5rem] border border-green-100 bg-green-50/55 p-5 sm:p-6">
        {loading && <p className="text-sm font-semibold text-forest">Reading field updates and preparing a human-review draft...</p>}
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
            <section className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leaf">Editable report draft</p>
                  <h3 className="mt-2 display-font text-2xl font-extrabold text-ink">{report.title}</h3>
                </div>
                <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-forest">Readiness {report.confidence}%</span>
              </div>

              <label className="sr-only" htmlFor="impact-report-editor">Editable impact report draft</label>
              <textarea
                id="impact-report-editor"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                rows={15}
                disabled={isFinalApproved}
                className="mt-5 min-h-[480px] w-full rounded-2xl border border-green-100 bg-green-50/35 p-5 text-base leading-8 text-slate-700 outline-none transition focus:border-leaf focus:ring-4 focus:ring-green-100 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </section>

            <aside className="space-y-5">
              <section className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-soft">
                <p className="text-sm font-extrabold text-ink">Review status</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[reportStatus] || statusStyles.draft}`}>{statusLabels[reportStatus] || 'Draft in progress'}</span>
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">Human review required</span>
                  {campaign.dbBacked && savedReportId && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Saved</span>}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-soft">
                <p className="text-sm font-extrabold text-ink">Suggested next actions</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {report.suggestedActions.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </section>

              <section className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-soft">
                <label className="block text-sm font-extrabold text-ink" htmlFor="review-notes">Review notes</label>
                <p className="mt-2 text-xs leading-5 text-slate-500">Use this only when the report needs correction, missing evidence, or clarification.</p>
                <textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  rows={4}
                  placeholder="Example: Verify attendance count before external sharing."
                  className="mt-3 w-full rounded-2xl border border-green-100 bg-green-50/40 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-leaf focus:ring-4 focus:ring-green-100"
                />
              </section>

              <section className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-soft">
                <p className="text-sm font-extrabold text-ink">Actions</p>
                <div className="mt-4 grid gap-3">
                  <Button variant="secondary" onClick={handleCopy} className="justify-center"><Copy className="mr-2" size={18} /> Copy Draft</Button>
                  <Button variant="secondary" onClick={handleSaveDraft} disabled={saving || isFinalApproved} className="justify-center"><Save className="mr-2" size={18} /> Save Draft</Button>
                  <Button onClick={() => handleStatusChange('under_review')} disabled={saving || isFinalApproved} className="justify-center"><Send className="mr-2" size={18} /> Send for Review</Button>
                  <Button variant="secondary" onClick={() => handleStatusChange('needs_revision')} disabled={saving || isFinalApproved} className="justify-center"><RotateCcw className="mr-2" size={18} /> Needs Revision</Button>
                  <Button onClick={() => handleStatusChange('approved')} disabled={saving || isFinalApproved} className="justify-center"><CheckCircle2 className="mr-2" size={18} /> Approve Report</Button>
                </div>
              </section>

              <div className="space-y-3">
                <FeedbackMessage type="error" message={errorMessage} />
                <FeedbackMessage type="success" message={successMessage} />
              </div>

              <section className="rounded-[1.5rem] bg-white p-5 text-xs leading-5 text-slate-500 shadow-soft">
                {report.disclaimer}
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
