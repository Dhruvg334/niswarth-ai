export default function MetricCard({ label, value, helper, compact = false }) {
  return (
    <div className={`card-hover premium-card rounded-[1.75rem] ${compact ? 'p-5' : 'p-6'}`}>
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 display-font font-black text-forest ${compact ? 'text-3xl' : 'text-4xl'}`}>{value}</p>
      {helper && <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p>}
    </div>
  )
}
