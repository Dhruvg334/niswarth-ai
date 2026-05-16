export default function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-ink">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
    </label>
  )
}
