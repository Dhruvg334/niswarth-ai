import SectionHeader from '../components/common/SectionHeader.jsx'

export default function About() {
  return (
    <section className="gradient-bg pb-20 pt-24 lg:pb-24 lg:pt-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="About" title="Why Niswarth AI exists" description="Niswarth means selfless. The platform is inspired by the people who coordinate social-impact work every day, often with limited tools and heavy responsibility." />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="card-hover premium-card rounded-[2rem] p-8">
            <h2 className="display-font text-3xl font-extrabold text-ink">Product idea</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">Many NGOs already do strong field work, but coordination and reporting often remain manual. Niswarth AI brings campaign visibility, volunteer coordination, structured updates, and AI-assisted reporting into one calm workflow.</p>
          </div>
          <div className="card-hover premium-card rounded-[2rem] p-8">
            <h2 className="display-font text-3xl font-extrabold text-ink">What the platform supports</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">The platform experience focuses on structured campaign records, volunteer visibility, field update collection, and AI-assisted summaries that remain under human review before sharing.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
