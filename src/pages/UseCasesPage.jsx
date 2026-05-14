import SectionHeader from '../components/common/SectionHeader.jsx'
import { useCases } from '../data/useCases.js'
import Button from '../components/common/Button.jsx'
import UseCaseIllustration from '../components/common/UseCaseIllustration.jsx'

export default function UseCasesPage() {
  return (
    <section className="gradient-bg pb-20 pt-24 lg:pb-24 lg:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Use cases" title="Workflow patterns for social-impact teams" description="These examples show how Niswarth AI can support different campaign types while keeping human coordinators in control." />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {useCases.map((item) => (
            <article key={item.title} className="card-hover premium-card rounded-[2rem] p-8">
              <UseCaseIllustration title={item.title} />
              <h2 className="display-font text-3xl font-extrabold text-ink">{item.title}</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">{item.summary}</p>
              <div className="mt-7 space-y-3">
                {item.details.map((detail) => <div key={detail} className="rounded-2xl border border-green-100 bg-green-50/70 px-5 py-4 text-sm font-semibold text-slate-700">{detail}</div>)}
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 text-center"><Button to="/demo">Open workflow dashboard</Button></div>
      </div>
    </section>
  )
}
