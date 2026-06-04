import { Info } from 'lucide-react'

export default function InfoHint({ label, align = 'right' }) {
  if (!label) return null

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-green-100 bg-green-50 text-forest transition hover:bg-green-100"
        aria-label={label}
      >
        <Info size={15} />
      </button>
      <span
        className={`pointer-events-none absolute top-10 z-20 hidden w-64 rounded-2xl border border-green-100 bg-white p-3 text-xs font-semibold leading-5 text-slate-600 shadow-soft group-hover:block group-focus-within:block ${align === 'left' ? 'left-0' : 'right-0'}`}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  )
}
