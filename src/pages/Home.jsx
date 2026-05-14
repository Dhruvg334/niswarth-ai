import Hero from '../components/landing/Hero.jsx'
import ProblemSection from '../components/landing/ProblemSection.jsx'
import FeaturesSection from '../components/landing/FeaturesSection.jsx'
import HowItWorks from '../components/landing/HowItWorks.jsx'
import UseCases from '../components/landing/UseCases.jsx'
import TrustSection from '../components/landing/TrustSection.jsx'
import Button from '../components/common/Button.jsx'

function SolutionSection() {
  const items = [
    ['Volunteers', 'Onboard, assign, retain'],
    ['Campaigns', 'Plan, run, learn'],
    ['Field updates', 'Capture from anywhere'],
    ['Reports', 'Drafted by AI, owned by you'],
  ]
  return (
    <section className="warm-section py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="inline-flex rounded-full border border-green-200 bg-green-100/80 px-5 py-2 text-sm font-extrabold text-forest shadow-sm">The solution</p>
          <h2 className="display-font mt-8 text-4xl font-black tracking-[-0.045em] text-ink md:text-5xl lg:text-6xl">A workflow platform shaped around your mission.</h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Niswarth AI gives small social-impact teams the structure of a modern product, without losing the warmth of how NGO work actually happens.</p>
          <div className="mt-10 space-y-5 text-base font-bold text-ink">
            {['One calm workspace for volunteers, campaigns, and events.', 'A simple way for field teams to send updates from anywhere.', 'AI that drafts impact reports — so humans review, not retype.'].map((point) => (
              <div key={point} className="flex items-start gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-white">✓</span><span>{point}</span></div>
            ))}
          </div>
          <div className="mt-10"><Button to="/demo">Open Workflow Dashboard</Button></div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <div key={label} className="card-hover premium-card rounded-[2rem] p-8">
              <p className="text-sm font-black uppercase tracking-wide text-forest">{label}</p>
              <h3 className="mt-5 display-font text-2xl font-extrabold leading-tight text-ink">{value}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorks />
      <UseCases />
      <TrustSection />
    </>
  )
}
