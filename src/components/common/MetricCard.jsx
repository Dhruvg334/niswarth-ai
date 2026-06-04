export default function MetricCard({ label, value, helper, compact = false }) {
  return (
    <div className={`card-hover premium-card rounded-[1.5rem] ${compact ? 'px-5 py-4' : 'p-6'}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`display-font font-black leading-none text-forest ${compact ? 'mt-3 text-3xl' : 'mt-3 text-4xl'}`}>{value}</p>
      {helper && <p className="mt-2 text-xs font-semibold leading-4 text-slate-500">{helper}</p>}
    </div>
  )
}
