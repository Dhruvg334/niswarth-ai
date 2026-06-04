import { ArrowRight, ClipboardCheck, FileText, MessageSquareText, ShieldCheck, Users } from 'lucide-react'
import Button from '../components/common/Button.jsx'

const steps = [
  {
    title: 'Create the campaign record',
    copy: 'Set the campaign type, location, goal, status, and expected field timeline before work begins.',
    icon: ClipboardCheck,
  },
  {
    title: 'Assign the right volunteers',
    copy: 'Keep volunteer roles, contact details, availability, and campaign assignments visible to the team.',
    icon: Users,
  },
  {
    title: 'Collect field updates',
    copy: 'Turn field notes, attendance details, observations, and community feedback into structured updates.',
    icon: MessageSquareText,
  },
  {
    title: 'Prepare a draft report',
    copy: 'Generate a first draft from available evidence, including missing information and review cautions.',
    icon: FileText,
  },
  {
    title: 'Review and approve',
    copy: 'Send drafts to reviewers, capture notes, approve clean reports, or send weak drafts back for revision.',
    icon: ShieldCheck,
  },
]

const examples = [
  ['Education support', 'Track sessions, volunteers, student attendance, follow-up needs, and parent feedback.'],
  ['Animal welfare', 'Coordinate feeding routes, rescue updates, vaccination notes, and follow-up care.'],
  ['Health or nutrition drive', 'Capture attendance, session notes, community questions, and evidence before reporting claims.'],
  ['Environment campaign', 'Organize plantation sites, volunteer duties, field updates, and post-activity follow-up.'],
]

function FlowStep({ step, index }) {
  const Icon = step.icon
  const offset = index % 2 === 0 ? 'lg:mr-28' : 'lg:ml-28'

  return (
    <article className={`relative rounded-[2rem] border border-green-100 bg-white/92 p-6 shadow-[0_22px_60px_-46px_rgba(20,83,45,0.58)] ${offset}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-forest text-white shadow-[0_16px_32px_-22px_rgba(20,83,45,0.75)]">
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-black text-forest">Step {index + 1}</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-ink">{step.title}</h2>
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

        <div className="mt-16 rounded-[2.25rem] border border-green-100 bg-white/50 p-4 shadow-[0_24px_80px_-60px_rgba(20,83,45,0.58)] md:p-6 lg:p-8">
          <div className="relative space-y-6 lg:space-y-8">
            <div className="absolute left-1/2 top-6 hidden h-[calc(100%-3rem)] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-green-200 to-transparent lg:block" />
            {steps.map((step, index) => (
              <FlowStep key={step.title} step={step} index={index} />
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-8 rounded-[2.25rem] border border-green-100 bg-white/90 p-6 shadow-[0_24px_75px_-56px_rgba(20,83,45,0.55)] md:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:p-10">
          <div>
            <h2 className="display-font text-4xl font-black tracking-[-0.045em] text-ink">Where this workflow fits.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">The product works best where field activity needs evidence-backed reporting, reviewer control, and a clear history of decisions.</p>
            <div className="mt-7"><Button to="/demo" variant="secondary">Open Dashboard <ArrowRight className="ml-2" size={17} /></Button></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {examples.map(([title, copy]) => (
              <article key={title} className="rounded-[1.5rem] border border-green-100 bg-green-50/65 p-5">
                <h3 className="font-black text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
