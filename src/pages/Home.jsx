import { ArrowRight, CheckCircle2, ClipboardCheck, FileCheck2, FileText, Layers3, MessageSquareText, ShieldCheck, Users } from 'lucide-react'
import Button from '../components/common/Button.jsx'

const workflowSteps = [
  ['1', 'Campaign record', 'Keep the goal, location, status, people, and reporting context in one place.'],
  ['2', 'Field evidence', 'Attach updates, observations, volunteer notes, and review context to the active campaign.'],
  ['3', 'Reviewed report', 'Prepare a draft from evidence, then send it through human review and approval.'],
]

const productPillars = [
  {
    title: 'Campaign workspace',
    copy: 'Keep active drives, status, field evidence, and report progress tied to one organisation workspace.',
    icon: ClipboardCheck,
  },
  {
    title: 'Volunteer visibility',
    copy: 'Track volunteer roles, contact details, availability, and where each person is assigned.',
    icon: Users,
  },
  {
    title: 'Reviewed AI reports',
    copy: 'Use AI for first drafts while preserving human review, approval, audit trail, and version history.',
    icon: ShieldCheck,
  },
]

function ProductPreview() {
  const reviewItems = [
    ['Evidence used', FileCheck2],
    ['Missing info', MessageSquareText],
    ['Risk flags', ShieldCheck],
    ['Next actions', CheckCircle2],
  ]

  return (
    <div className="rounded-[2rem] border border-green-100 bg-white p-4 shadow-[0_34px_95px_-60px_rgba(20,83,45,0.58)]">
      <div className="rounded-[1.5rem] border border-green-100 bg-gradient-to-br from-white via-green-50/55 to-white p-5">
        <div className="flex items-start justify-between gap-4 border-b border-green-100 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Selected campaign</p>
            <p className="mt-2 text-lg font-black text-ink">Reading Support Drive</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Delhi · Education · Coordinator review</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-forest">Under review</span>
        </div>

        <div className="grid gap-3 py-5 sm:grid-cols-3">
          {[
            ['16', 'students reached'],
            ['3', 'field updates'],
            ['2', 'review notes'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-green-100 bg-white px-4 py-4 shadow-[0_14px_34px_-30px_rgba(20,83,45,0.65)]">
              <p className="text-3xl font-black tabular-nums text-forest">{value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-[0_18px_50px_-42px_rgba(20,83,45,0.55)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-forest"><FileText size={20} /></span>
              <div>
                <p className="font-black text-ink">AI report draft</p>
                <p className="text-xs font-semibold text-slate-500">Prepared from field updates</p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-forest">Human review required</span>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">The draft shows evidence, gaps, review cautions, and next actions before approval.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {reviewItems.map(([item, Icon]) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50/55 px-4 py-3 text-xs font-bold text-slate-700">
                <Icon size={15} className="text-forest" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <>
      <section className="gradient-bg">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-20 lg:pt-16">
          <div>
            <h1 className="display-font max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.06em] text-ink md:text-6xl lg:text-7xl">
              Coordinate field work. <span className="text-forest">Report with evidence.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Niswarth AI helps NGOs manage campaigns, volunteers, field updates, and human-reviewed impact reports in one workspace.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/signup">Create Workspace <ArrowRight className="ml-2" size={18} /></Button>
              <Button to="/use-cases" variant="secondary">See Use Cases</Button>
            </div>
            <p className="mt-5 max-w-lg text-sm font-medium leading-6 text-slate-500">AI assists with draft preparation. People still review, revise, and approve final reports.</p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div className="lg:pt-4">
              <h2 className="display-font text-4xl font-black tracking-[-0.045em] text-ink md:text-5xl">Built around the actual NGO workflow.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">The product does not start with AI. It starts with the everyday coordination that happens before a report is written.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {productPillars.map(({ title, copy, icon: Icon }) => (
                <article key={title} className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_22px_60px_-48px_rgba(20,83,45,0.6)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-forest"><Icon size={22} /></div>
                  <h3 className="mt-6 text-lg font-black text-ink">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="gradient-bg py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <h2 className="display-font text-4xl font-black tracking-[-0.045em] text-ink md:text-5xl">From scattered updates to a reviewed report.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">The workflow is intentionally narrow: organise campaign evidence, draft from that evidence, and keep review authority with the team.</p>
              <div className="mt-8"><Button to="/demo" variant="secondary">Open Dashboard</Button></div>
            </div>
            <div className="grid gap-5">
              {workflowSteps.map(([num, title, copy]) => (
                <article key={title} className="grid gap-5 rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_22px_70px_-54px_rgba(20,83,45,0.58)] sm:grid-cols-[72px_1fr]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-xl font-black text-white shadow-[0_14px_30px_-22px_rgba(20,83,45,0.8)]">{num}</div>
                  <div>
                    <h3 className="text-2xl font-black tracking-[-0.025em] text-ink">{title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-[2.25rem] bg-forest p-6 shadow-[0_30px_95px_-54px_rgba(20,83,45,0.75)] md:p-8 lg:grid-cols-[1fr_0.9fr] lg:p-10">
            <div className="text-white">
              <h2 className="display-font text-4xl font-black tracking-[-0.045em] md:text-5xl">AI drafts. People approve.</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-green-50/85">Niswarth AI keeps reporting accountable with evidence used, missing information, risk flags, version history, and reviewer decisions.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {['Structured output', 'Evidence snapshot', 'Review notes', 'Version history'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-green-50"><CheckCircle2 size={17} /> {item}</div>
                ))}
              </div>
            </div>
            <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_22px_60px_-44px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-3 text-forest"><Layers3 size={22} /><p className="font-black">Organisation roles</p></div>
              <div className="mt-5 space-y-3">
                {[
                  ['Admin', 'Sets up workspace, campaigns, and members.'],
                  ['Coordinator', 'Adds field updates and prepares drafts for review.'],
                  ['Reviewer', 'Checks reports before approval or revision.'],
                ].map(([role, copy]) => (
                  <div key={role} className="rounded-2xl border border-green-100 bg-green-50/60 p-4">
                    <p className="font-black text-ink">{role}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
