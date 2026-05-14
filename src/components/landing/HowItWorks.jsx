import SectionHeader from '../common/SectionHeader.jsx'

const steps = [
  ['01', 'Create a campaign', 'Define the campaign type, location, activity goal, and coordination requirements.'],
  ['02', 'Assign volunteers', 'Map volunteers to roles, events, and follow-up actions.'],
  ['03', 'Collect field updates', 'Convert scattered notes into structured campaign updates.'],
  ['04', 'Review AI draft', 'Let AI prepare a summary, then keep humans in control before approval.'],
]

export default function HowItWorks() {
  return (
    <section className="warm-section py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Workflow" title="From field work to impact report in four steps." description="This architecture keeps AI useful but controlled: it assists, drafts, and organizes, while humans approve final communication." />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(([num, title, desc]) => (
            <div key={title} className="card-hover premium-card rounded-[2rem] p-7">
              <p className="display-font text-3xl font-black text-green-200">{num}</p>
              <h3 className="mt-5 display-font text-xl font-extrabold text-ink">{title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
