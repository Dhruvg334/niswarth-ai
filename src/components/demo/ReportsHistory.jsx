import { CheckCircle2, Clock3, FileText, RotateCcw } from 'lucide-react'

const statusStyles = {
  draft: 'bg-slate-100 text-slate-700',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  needs_revision: 'bg-amber-100 text-amber-800',
}

const statusLabels = {
  draft: 'Draft',
  under_review: 'Under review',
  approved: 'Approved',
  needs_revision: 'Needs revision',
}

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

export default function ReportsHistory({ reports = [] }) {
  return (
    <div className="premium-card rounded-[2rem] p-7">
      <div>
        <h2 className="display-font text-3xl font-extrabold text-ink">Report history</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Track drafts, review decisions, and the latest AI generation details for this campaign.</p>
      </div>

      <div className="mt-6 space-y-4">
        {reports.length === 0 ? (
          <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5 text-sm leading-7 text-slate-600">
            No reports have been created for this campaign yet. Generate an evidence-based draft after field updates are available.
          </div>
        ) : (
          reports.map((report) => {
            const Icon = statusIcons[report.status] || FileText
            const text = report.edited_text || report.draft_text || ''
            const latestLog = getLatestLog(report)
            const versions = getVersions(report)

            return (
              <article key={report.id} className="rounded-2xl border border-green-100 bg-white/80 p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-green-50 p-2 text-forest"><Icon size={18} /></div>
                    <div>
                      <p className="text-sm font-extrabold text-ink">Impact report</p>
                      <p className="text-xs font-semibold text-slate-500">{formatDate(report.created_at)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusStyles[report.status] || statusStyles.draft}`}>{statusLabels[report.status] || 'Draft'}</span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">{text}</p>

                {report.review_notes && (
                  <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-800"><span className="font-extrabold">Review note:</span> {report.review_notes}</p>
                )}

                {(latestLog || versions.length > 0) && (
                  <details className="mt-4 rounded-2xl border border-green-100 bg-green-50/45 p-4 text-sm text-slate-600">
                    <summary className="cursor-pointer select-none text-sm font-extrabold text-forest">View audit trail</summary>

                    {latestLog && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <SmallMeta label="Source" value={formatSource(latestLog.generation_source)} />
                        <SmallMeta label="Model" value={latestLog.ai_model || 'Not recorded'} />
                        <SmallMeta label="Readiness" value={Number.isFinite(Number(latestLog.confidence)) ? `${latestLog.confidence}%` : 'Not recorded'} />
                      </div>
                    )}

                    {versions.length > 0 && (
                      <div className="mt-4 rounded-2xl bg-white/80 p-4">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Version history</p>
                        <div className="mt-3 space-y-2">
                          {versions.map((version) => (
                            <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-green-100 bg-white px-3 py-2">
                              <span className="text-sm font-bold text-ink">Version {version.version_number}</span>
                              <span className="text-xs font-semibold text-slate-500">{statusLabels[version.status] || version.status || 'Draft'} · {formatDate(version.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
