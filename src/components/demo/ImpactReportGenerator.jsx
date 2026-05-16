import { useState } from 'react'
import { Sparkles, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '../common/Button.jsx'
import { generateImpactReport } from '../../utils/generateImpactReport.js'
import { markReportReviewed, saveImpactReportDraft } from '../../services/reportService.js'

export default function ImpactReportGenerator({ campaign, onReportSaved }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [report, setReport] = useState(null)
  const [savedReportId, setSavedReportId] = useState(null)
  const [approved, setApproved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleGenerate() {
    if (!campaign?.updates?.length) {
      setErrorMessage('Add at least one field update before generating an impact report. Reports should be grounded in field evidence.')
      return
    }

    setApproved(false)
    setLoading(true)
    setSaving(false)
    setReport(null)
    setSavedReportId(null)
    setErrorMessage('')

    window.setTimeout(async () => {
      const generatedReport = generateImpactReport(campaign)
      setReport(generatedReport)
      setLoading(false)

      if (campaign.dbBacked) {
        setSaving(true)
        const { report: savedReport, error } = await saveImpactReportDraft({
          campaignId: campaign.id,
          draftText: generatedReport.summary,
        })
        setSaving(false)

        if (error) {
          setErrorMessage('Draft generated locally, but saving to the database failed. Check Supabase table policies and environment variables.')
          return
        }

        if (savedReport?.id) {
          setSavedReportId(savedReport.id)
        }
      }
    }, 700)
  }

  async function handleMarkReviewed() {
    setErrorMessage('')
    if (!savedReportId) {
      setApproved(true)
      return
    }

    const { error } = await markReportReviewed(savedReportId)
    if (error) {
      setErrorMessage('The report was generated, but the review status could not be saved. Check Supabase update policy for impact_reports.')
      return
    }

    setApproved(true)
  }

  async function handleCopy() {
    if (!report) return
    await navigator.clipboard?.writeText(report.summary)
  }

  return (
    <div className="premium-card rounded-[2rem] p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="display-font text-3xl font-extrabold text-ink">AI impact report draft</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">AI-assisted draft generated from selected campaign updates.</p>
        </div>
        <Button onClick={handleGenerate} disabled={!campaign?.updates?.length || loading || saving} className="disabled:cursor-not-allowed disabled:opacity-60"><Sparkles className="mr-2" size={18} /> Generate Draft</Button>
      </div>

      <div className="mt-7 rounded-[1.5rem] border border-green-100 bg-green-50/60 p-6">
        {loading && <p className="text-sm font-semibold text-forest">Reading field updates and preparing a human-review draft...</p>}
        {saving && <p className="mt-3 text-xs font-bold text-forest">Saving draft to the backend workflow record...</p>}
        {!loading && !report && <p className="max-w-xl text-sm leading-7 text-slate-600">{campaign?.updates?.length ? "Click “Generate Draft” to turn field updates into a concise impact summary for human review." : "Add field updates before generating an impact report. This keeps report drafts evidence-based."}</p>}
        {errorMessage && (
          <div className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <p>{errorMessage}</p>
          </div>
        )}
        {report && (
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-forest">Draft readiness: {report.confidence}%</span>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">Human review required</span>
              {campaign.dbBacked && savedReportId && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Saved to backend</span>}
              {approved && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 size={14} /> Reviewed</span>}
            </div>
            <h3 className="display-font text-xl font-extrabold text-ink">{report.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">{report.summary}</p>
            <div className="mt-6">
              <p className="text-sm font-extrabold text-ink">Suggested next actions</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">{report.suggestedActions.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
            <p className="mt-6 rounded-2xl bg-white p-4 text-xs leading-5 text-slate-500">{report.disclaimer}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={handleCopy}><Copy className="mr-2" size={18} /> Copy Draft</Button>
              <Button onClick={handleMarkReviewed}>Mark Reviewed</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
