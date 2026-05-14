export default function MetricCard({ label, value, helper }) {
  return (
    <div className="card-hover premium-card rounded-[1.75rem] p-6">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 display-font text-4xl font-black text-forest">{value}</p>
      {helper && <p className="mt-2 text-xs font-medium text-slate-500">{helper}</p>}
    </div>
  )
}
