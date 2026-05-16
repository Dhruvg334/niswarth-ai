import { X } from 'lucide-react'

export default function SlideOver({ open, title, description, children, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close panel overlay"
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-green-100 bg-white shadow-[0_40px_100px_-50px_rgba(20,83,45,0.65)]">
        <div className="sticky top-0 z-10 border-b border-green-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="display-font text-2xl font-black text-ink">{title}</h2>
              {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-full border border-green-100 bg-green-50 p-2 text-forest transition hover:bg-green-100"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="px-6 py-6">{children}</div>
      </aside>
    </div>
  )
}
