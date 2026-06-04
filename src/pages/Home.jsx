import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, Layers3, ShieldCheck, Users } from 'lucide-react'
import Button from '../components/common/Button.jsx'

const workflowSteps = [
  ['01', 'Set up the campaign', 'Create a clean record for the goal, location, status, timeline, and coordination needs.'],
  ['02', 'Bring people and updates together', 'Assign volunteers, record field notes, and keep evidence linked to the active campaign.'],
  ['03', 'Draft from evidence', 'Generate a structured report draft from the campaign updates, missing information, and review cautions.'],
  ['04', 'Review before sharing', 'Coordinators send drafts for review, while reviewers approve or request revision with notes.'],
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
  return (
    <div className="rounded-[2.25rem] border border-green-100 bg-white/90 p-4 shadow-[0_32px_90px_-56px_rgba(20,83,45,0.55)] backdrop-blur">
      <div className="rounded-[1.75rem] border border-green-100 bg-gradient-to-br from-white via-green-50/60 to-white p-4">
        <div className="flex items-center justify-between gap-4 border-b border-green-100 pb-4">
          <div>
            <p className="text-xs font-bold text-slate-500">Selected campaign</p>
            <p className="mt-1 text-base font-black text-ink">Reading Support Drive</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-forest">Under review</span>
        </div>

        <div className="grid gap-3 py-4 sm:grid-cols-3">
          {[
            ['16', 'students reached'],
            ['3', 'field updates'],
            ['2', 'review notes'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-[0_14px_36px_-30px_rgba(20,83,45,0.65)]">
              <p className="text-2xl font-black tabular-nums text-forest">{value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.5rem] border border-green-100 bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-black text-ink"><FileText size={18} className="text-leaf" /> AI report draft</div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-forest">Human review required</span>
          </div>
          <p className="text-sm leading-6 text-slate-600">Draft prepared from field updates. Missing evidence and review cautions are visible before approval.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {['Evidence used', 'Missing information', 'Risk flags', 'Next actions'].map((item) => (
              <div key={item} className="rounded-2xl border border-green-100 bg-green-50/55 px-4 py-3 text-xs font-bold text-slate-700">{item}</div>
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
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-20 lg:pt-14">
          <div>
            <p className="inline-flex rounded-full border border-green-200 bg-white/90 px-4 py-2 text-sm font-bold text-forest shadow-sm">AI-assisted NGO workflow platform</p>
            <h1 className="display-font mt-6 max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.06em] text-ink md:text-6xl lg:text-7xl">
              Coordinate field work. <span className="text-forest">Report with evidence.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Niswarth AI helps NGOs manage campaigns, volunteers, field updates, and human-reviewed impact reports in one workspace.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/signup">Create Workspace <ArrowRight className="ml-2" size={18} /></Button>
              <Button to="/use-cases" variant="secondary">See Workflow</Button>
            </div>
            <p className="mt-5 max-w-lg text-sm font-medium leading-6 text-slate-500">AI assists with draft preparation. People still review, revise, and approve final reports.</p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="soft-section py-18 lg:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <h2 className="display-font text-4xl font-black tracking-[-0.045em] text-ink md:text-5xl">Built around the actual NGO workflow.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">The product does not start with AI. It starts with the everyday work that happens before a report is written.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {productPillars.map(({ title, copy, icon: Icon }) => (
                <article key={title} className="rounded-[1.75rem] border border-green-100 bg-white/90 p-6 shadow-[0_20px_55px_-42px_rgba(20,83,45,0.55)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-forest"><Icon size={22} /></div>
                  <h3 className="mt-5 text-lg font-black text-ink">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="warm-section py-18 lg:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <h2 className="display-font text-4xl font-black tracking-[-0.045em] text-ink md:text-5xl">From scattered updates to a reviewed report.</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">The workflow is intentionally narrow: organize campaign evidence, draft from that evidence, and keep review authority with the team.</p>
              <div className="mt-8"><Button to="/demo" variant="secondary">Open Dashboard</Button></div>
            </div>
            <div className="space-y-4">
              {workflowSteps.map(([num, title, copy]) => (
                <article key={title} className="grid gap-4 rounded-[1.75rem] border border-green-100 bg-white/88 p-5 shadow-[0_20px_55px_-44px_rgba(20,83,45,0.55)] sm:grid-cols-[88px_1fr] sm:p-6">
                  <div className="display-font text-4xl font-black text-green-200">{num}</div>
                  <div>
                    <h3 className="text-xl font-black text-ink">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-18 lg:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[2.25rem] border border-green-100 bg-forest shadow-[0_30px_95px_-54px_rgba(20,83,45,0.75)] lg:grid-cols-[1fr_0.9fr]">
            <div className="p-8 text-white md:p-10 lg:p-12">
              <h2 className="display-font text-4xl font-black tracking-[-0.045em] md:text-5xl">AI drafts. People approve.</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-green-50/80">Niswarth AI keeps reporting accountable with evidence used, missing information, risk flags, version history, and reviewer decisions.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {['Structured output', 'Evidence snapshot', 'Review notes', 'Version history'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-green-50"><CheckCircle2 size={17} /> {item}</div>
                ))}
              </div>
            </div>
            <div className="bg-green-50 p-8 md:p-10 lg:p-12">
              <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_22px_60px_-44px_rgba(20,83,45,0.65)]">
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
        </div>
      </section>
    </>
  )
}
