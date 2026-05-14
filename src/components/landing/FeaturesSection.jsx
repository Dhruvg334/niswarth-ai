import SectionHeader from '../common/SectionHeader.jsx'
import { features } from '../../data/features.js'

export default function FeaturesSection() {
  return (
    <section className="soft-section py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Features" title="Built for real NGO workflows." description="The platform focuses on coordination, visibility, and human-reviewed communication, not automation hype." />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <div key={title} className={`card-hover premium-card rounded-[2rem] p-7 ${index === 4 ? 'lg:col-span-1' : ''}`}>
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-forest"><Icon size={26} /></div>
              <h3 className="display-font text-xl font-extrabold text-ink">{title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
