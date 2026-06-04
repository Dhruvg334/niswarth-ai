import { ArrowRight, ClipboardCheck, FileText, MessageSquareText, ShieldCheck, Users } from 'lucide-react'
import Button from '../components/common/Button.jsx'

const steps = [
  {
    title: 'Create the campaign record',
    copy: 'Set the goal, location, status, timeline, and coordination context before work begins.',
    icon: ClipboardCheck,
  },
  {
    title: 'Assign the right volunteers',
    copy: 'Keep roles, contact details, availability, and campaign assignments visible to the team.',
    icon: Users,
  },
  {
    title: 'Collect field updates',
    copy: 'Turn field notes, attendance details, observations, and community feedback into useful evidence.',
    icon: MessageSquareText,
  },
  {
    title: 'Prepare a draft report',
    copy: 'Generate a first draft from available updates, including missing information and review cautions.',
    icon: FileText,
  },
  {
    title: 'Review and approve',
    copy: 'Send drafts to reviewers, capture notes, approve clean reports, or send weak drafts back.',
    icon: ShieldCheck,
  },
]

const examples = [
  ['Education support', 'Sessions, student attendance, volunteer notes, follow-up needs, and parent feedback.'],
  ['Animal welfare', 'Feeding routes, rescue updates, volunteer assignments, and follow-up care notes.'],
  ['Health or nutrition drive', 'Attendance, awareness-session notes, community questions, and evidence before claims.'],
  ['Environment campaign', 'Plantation sites, volunteer duties, field updates, and post-activity follow-up.'],
]

function FlowStep({ step, index }) {
  const Icon = step.icon
  const align = index % 2 === 0 ? 'lg:mr-20' : 'lg:ml-20'

  return (
    <article className={`rounded-[2rem] bg-white p-6 shadow-[0_22px_70px_-52px_rgba(20,83,45,0.6)] ring-1 ring-green-100 ${align}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-forest text-white shadow-[0_18px_34px_-22px_rgba(20,83,45,0.82)]">
          <Icon size={25} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black tabular-nums text-forest">0{index + 1}</span>
            <span className="h-px w-10 bg-green-200" />
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.02em] text-ink">{step.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{step.copy}</p>
        </div>
      </div>
    </article>
  )
}

export default function UseCasesPage() {
  return (
    <section className="gradient-bg pb-20 pt-16 lg:pb-24 lg:pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <h1 className="display-font max-w-3xl text-5xl font-black leading-[1] tracking-[-0.055em] text-ink md:text-6xl">A clear path from field work to reviewed reporting.</h1>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600 lg:pb-3">Niswarth AI is built around one focused workflow: collect campaign evidence, draft from it, and keep approval with the organisation.</p>
        </div>

        <div className="mt-16 space-y-7 lg:space-y-9">
          {steps.map((step, index) => (
            <FlowStep key={step.title} step={step} index={index} />
          ))}
        </div>

        <div className="mt-16 rounded-[2.25rem] bg-white p-6 shadow-[0_26px_80px_-56px_rgba(20,83,45,0.58)] ring-1 ring-green-100 md:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <h2 className="display-font text-4xl font-black tracking-[-0.045em] text-ink">Where this workflow fits.</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">The product works best where field activity needs evidence-backed reporting, reviewer control, and a clear history of decisions.</p>
              <div className="mt-7"><Button to="/demo" variant="secondary">Open Dashboard <ArrowRight className="ml-2" size={17} /></Button></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {examples.map(([title, copy]) => (
                <article key={title} className="rounded-[1.5rem] border border-green-100 bg-green-50/45 p-5">
                  <h3 className="font-black text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
