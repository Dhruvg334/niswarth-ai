import { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, FileText, RotateCcw } from 'lucide-react'
import Button from '../common/Button.jsx'
import InfoHint from '../common/InfoHint.jsx'
import { updateImpactReportStatus } from '../../services/reportService.js'
import { REPORT_STATUS, canReviewReportDecision, getReportStatusLabel, getReportStatusStyle, getReportWorkflowHint } from '../../utils/reportWorkflow.js'

const statusIcons = {
  draft: FileText,
  under_review: Clock3,
  approved: CheckCircle2,
  needs_revision: RotateCcw,
}

function formatDate(value) {
  if (!value) return 'Recently created'
  return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatSource(value) {
  if (value === 'gemini') return 'Gemini'
  if (value === 'local-fallback') return 'Local fallback'
  return value || 'Not recorded'
}

function getLatestLog(report) {
  return Array.isArray(report.ai_generation_logs) ? report.ai_generation_logs[0] : null
}

function getVersions(report) {
  return Array.isArray(report.report_versions) ? report.report_versions.slice(0, 4) : []
}

function SmallMeta({ label, value }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-green-50/55 p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
    </div>
  )
}

function ReportReviewActions({ report, canReviewReports, onReportStatusChanged }) {
  const [notes, setNotes] = useState(report.review_notes || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  if (!canReviewReportDecision(report.status, { canReviewReports })) return null

  async function updateStatus(nextStatus) {
    setMessage('')
    setErrorMessage('')

    if (nextStatus === REPORT_STATUS.needsRevision && notes.trim().length < 8) {
      setErrorMessage('Add a short review note before requesting revision.')
      return
    }

    setSaving(true)
    const { error } = await updateImpactReportStatus({ reportId: report.id, status: nextStatus, reviewNotes: notes })
    setSaving(false)

    if (error) {
      setErrorMessage(error.message || 'Could not update report review status.')
      return
    }

    setMessage(nextStatus === REPORT_STATUS.approved ? 'Report approved.' : 'Report sent back for revision.')
    onReportStatusChanged?.()
  }

  return (
    <div className="mt-4 rounded-2xl border border-green-100 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-extrabold text-ink"><CheckCircle2 size={16} /> Reviewer action</div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        placeholder="Optional approval note, or required note for revision."
        className="mt-3 w-full rounded-2xl border border-green-100 bg-green-50/40 p-3 text-sm leading-6 text-slate-700 outline-none focus:border-leaf focus:ring-4 focus:ring-green-100"
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => updateStatus(REPORT_STATUS.needsRevision)} disabled={saving} className="min-w-[150px] justify-center"><RotateCcw className="mr-2" size={16} /> Needs Revision</Button>
        <Button onClick={() => updateStatus(REPORT_STATUS.approved)} disabled={saving} className="min-w-[150px] justify-center"><CheckCircle2 className="mr-2" size={16} /> Approve</Button>
      </div>
      {errorMessage && <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800"><AlertCircle size={14} /> {errorMessage}</p>}
      {message && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800">{message}</p>}
    </div>
  )
}

export default function ReportsHistory({ reports = [], canReviewReports = false, onReportStatusChanged }) {
  return (
    <div className="premium-card rounded-[1.75rem] p-6 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="display-font text-xl font-black text-ink">Report history</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Drafts, decisions, and audit details.</p>
        </div>
        <InfoHint label="Reports move from draft to review, then approval or revision. Audit trail keeps the generation and version details collapsed until needed." />
      </div>

      <div className="mt-4 space-y-3">
        {reports.length === 0 ? (
          <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm leading-6 text-slate-600">
            No reports yet. Admins and coordinators can generate a draft once field updates are available.
          </div>
        ) : (
          reports.map((report) => {
            const Icon = statusIcons[report.status] || FileText
            const text = report.edited_text || report.draft_text || ''
            const latestLog = getLatestLog(report)
            const versions = getVersions(report)

            return (
              <article key={report.id} className="rounded-2xl border border-green-100 bg-white/85 p-4 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-green-50 p-2 text-forest"><Icon size={18} /></div>
                    <div>
                      <p className="text-sm font-extrabold text-ink">Impact report</p>
                      <p className="text-xs font-semibold text-slate-500">{formatDate(report.created_at)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getReportStatusStyle(report.status)}`}>{getReportStatusLabel(report.status)}</span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{text}</p>
                <p className="mt-3 rounded-2xl border border-green-100 bg-green-50/45 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
                  {getReportWorkflowHint(report.status, { canReviewReports })}
                </p>

                {report.review_notes && (
                  <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-800"><span className="font-extrabold">Review note:</span> {report.review_notes}</p>
                )}

                {(latestLog || versions.length > 0 || canReviewReports) && (
                  <details className="mt-3 rounded-2xl border border-green-100 bg-green-50/45 p-3 text-sm text-slate-600">
                    <summary className="cursor-pointer select-none text-sm font-extrabold text-forest">Audit trail</summary>

                    {latestLog && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <SmallMeta label="Source" value={formatSource(latestLog.generation_source)} />
                        <SmallMeta label="Model" value={latestLog.ai_model || 'Not recorded'} />
                        <SmallMeta label="Readiness" value={Number.isFinite(Number(latestLog.confidence)) ? `${latestLog.confidence}%` : 'Not recorded'} />
                      </div>
                    )}

                    {versions.length > 0 && (
                      <div className="mt-3 rounded-2xl bg-white/80 p-3">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Version history</p>
                        <div className="mt-3 space-y-2">
                          {versions.map((version) => (
                            <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-green-100 bg-white px-3 py-2">
                              <span className="text-sm font-bold text-ink">Version {version.version_number}</span>
                              <span className="text-xs font-semibold text-slate-500">{getReportStatusLabel(version.status)} · {formatDate(version.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <ReportReviewActions report={report} canReviewReports={canReviewReports} onReportStatusChanged={onReportStatusChanged} />
                  </details>
                )}
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
