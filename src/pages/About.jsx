import { Code2, GitBranch, ShieldCheck, Sparkles } from 'lucide-react'
import Button from '../components/common/Button.jsx'

const buildNotes = [
  ['Full-stack product build', 'React, Vite, Tailwind, Supabase Auth/Postgres/RLS, Vercel API routes, Gemini, and CI checks.'],
  ['Human-reviewed AI', 'AI drafts are handled as working drafts with evidence, missing information, risk flags, and reviewer decisions.'],
  ['Organisation-scoped data', 'Workspaces, memberships, roles, campaigns, volunteers, updates, and reports remain tied to the selected organisation.'],
]

export default function About() {
  return (
    <section className="gradient-bg pb-20 pt-20 lg:pb-24 lg:pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-green-200 bg-white/90 px-4 py-2 text-sm font-bold text-forest shadow-sm">About the project</p>
            <h1 className="display-font mt-6 text-5xl font-black leading-[1] tracking-[-0.055em] text-ink md:text-6xl">Built to make NGO reporting more accountable.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Niswarth AI started as a practical exploration of how AI can support social-impact teams without replacing human judgment.</p>
          </div>
          <div className="rounded-[2rem] border border-green-100 bg-white/90 p-6 shadow-[0_26px_80px_-54px_rgba(20,83,45,0.6)] md:p-8">
            <div className="flex items-center gap-3 text-forest"><Sparkles size={22} /><p className="font-black">Current stage</p></div>
            <h2 className="mt-5 display-font text-3xl font-black tracking-[-0.04em] text-ink">Active product prototype, not a finished SaaS.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">The project already includes working auth, organisation workspaces, role-aware dashboards, structured AI reporting, audit logs, version history, and member workflows. It is still being refined before being positioned as production software.</p>
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {buildNotes.map(([title, copy]) => (
            <article key={title} className="rounded-[1.75rem] border border-green-100 bg-white/88 p-6 shadow-[0_20px_55px_-44px_rgba(20,83,45,0.55)]">
              <h2 className="text-xl font-black text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-8 rounded-[2.25rem] border border-green-100 bg-white/88 p-6 shadow-[0_24px_80px_-58px_rgba(20,83,45,0.58)] md:p-8 lg:grid-cols-[0.75fr_1.25fr] lg:p-10">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-forest"><Code2 size={26} /></div>
            <h2 className="mt-6 display-font text-4xl font-black tracking-[-0.045em] text-ink">Built by Dhruv Gupta.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">Computer Science undergraduate focused on AI workflow systems, full-stack product engineering, and practical automation.</p>
            <div className="mt-7"><Button to="/contact" variant="secondary">Contact Dhruv</Button></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-green-50/75 p-5">
              <div className="flex items-center gap-2 text-forest"><GitBranch size={18} /><p className="font-black">Engineering focus</p></div>
              <p className="mt-3 text-sm leading-6 text-slate-600">Service-layer separation, Supabase RLS, server-side AI calls, workflow tests, and clean git phases.</p>
            </div>
            <div className="rounded-[1.5rem] bg-green-50/75 p-5">
              <div className="flex items-center gap-2 text-forest"><ShieldCheck size={18} /><p className="font-black">Design focus</p></div>
              <p className="mt-3 text-sm leading-6 text-slate-600">A calm interface that keeps technical depth inside the system and shows simple decisions to the NGO user.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
