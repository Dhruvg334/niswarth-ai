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
    copy: 'Keep volunteer roles, availability, contact details, and campaign assignments visible to the team.',
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

export default function UseCasesPage() {
  return (
    <section className="gradient-bg pb-20 pt-20 lg:pb-24 lg:pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-full border border-green-200 bg-white/90 px-4 py-2 text-sm font-bold text-forest shadow-sm">How it works</p>
            <h1 className="display-font mt-6 max-w-3xl text-5xl font-black leading-[1] tracking-[-0.055em] text-ink md:text-6xl">A clear path from field work to reviewed reporting.</h1>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600 lg:pb-3">Niswarth AI is built around one focused workflow: collect campaign evidence, draft from it, and keep approval with the organisation.</p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-5">
          {steps.map(({ title, copy, icon: Icon }, index) => (
            <article key={title} className={`rounded-[1.75rem] border border-green-100 bg-white/90 p-6 shadow-[0_20px_55px_-44px_rgba(20,83,45,0.55)] ${index === 2 ? 'lg:-mt-5' : ''}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-forest"><Icon size={22} /></div>
              <p className="mt-6 text-xs font-black text-green-300">0{index + 1}</p>
              <h2 className="mt-2 text-lg font-black leading-tight text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-8 rounded-[2.25rem] border border-green-100 bg-white/88 p-6 shadow-[0_24px_75px_-56px_rgba(20,83,45,0.55)] md:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
          <div>
            <h2 className="display-font text-4xl font-black tracking-[-0.045em] text-ink">Where this workflow fits.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">The product is not limited to one sector. It works best wherever field activity needs evidence-backed reporting.</p>
            <div className="mt-7"><Button to="/demo" variant="secondary">Open Dashboard <ArrowRight className="ml-2" size={17} /></Button></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {examples.map(([title, copy]) => (
              <article key={title} className="rounded-[1.5rem] bg-green-50/75 p-5">
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
