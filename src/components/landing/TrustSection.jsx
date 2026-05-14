import SectionHeader from '../common/SectionHeader.jsx'

const trustItems = [
  ['Human-reviewed AI drafts', 'AI-generated impact summaries stay in draft mode until a responsible team member reviews them.'],
  ['Transparent update history', 'Campaign summaries are based on visible field notes, not hidden black-box claims.'],
  ['AI drafts require review', 'AI-generated drafts may contain inaccuracies, so coordinators should review every report before sharing.'],
  ['Designed to support teams', 'The platform helps coordinators reduce administrative effort without replacing human judgment.'],
]

export default function TrustSection() {
  return (
    <section className="warm-section py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Trust" title="AI assistance with human control." description="For social-impact work, clarity and responsibility matter more than automation hype." />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {trustItems.map(([title, desc]) => (
            <div key={title} className="card-hover premium-card rounded-[2rem] p-7">
              <h3 className="display-font text-xl font-extrabold text-ink">{title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
