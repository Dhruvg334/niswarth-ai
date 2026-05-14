export default function SectionHeader({ eyebrow, title, description, align = 'center' }) {
  const alignment = align === 'left' ? 'items-start text-left' : 'items-center text-center mx-auto'
  return (
    <div className={`flex max-w-4xl flex-col gap-5 ${alignment}`}>
      {eyebrow && <p className="inline-flex rounded-full border border-green-200 bg-green-100/80 px-5 py-2 text-sm font-extrabold text-forest shadow-sm">{eyebrow}</p>}
      <h2 className="display-font text-4xl font-black tracking-[-0.045em] text-ink md:text-5xl lg:text-6xl">{title}</h2>
      {description && <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg">{description}</p>}
    </div>
  )
}
