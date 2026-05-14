import SectionHeader from '../common/SectionHeader.jsx'
import { useCases } from '../../data/useCases.js'
import Button from '../common/Button.jsx'
import UseCaseIllustration from '../common/UseCaseIllustration.jsx'

export default function UseCases() {
  return (
    <section className="soft-section py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Use cases" title="Designed for different types of social-impact work." description="Three realistic NGO campaign types show how coordination, field updates, and reporting can work together." />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {useCases.map((item) => (
            <div key={item.title} className="card-hover premium-card rounded-[2rem] p-7">
              <UseCaseIllustration title={item.title} />
              <h3 className="display-font text-2xl font-extrabold text-ink">{item.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{item.summary}</p>
              <ul className="mt-6 space-y-3 text-sm font-medium text-slate-600">
                {item.details.map((detail) => <li key={detail}>• {detail}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center"><Button to="/use-cases" variant="secondary">View use case details</Button></div>
      </div>
    </section>
  )
}
