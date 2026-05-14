import { ArrowRight, ClipboardCheck, Users, CalendarDays, MapPin, FileText } from 'lucide-react'
import Button from '../common/Button.jsx'

function StatusPill({ children, tone = 'green' }) {
  const toneClass = tone === 'gray' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-forest'
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}>{children}</span>
}

function DashboardMock() {
  return (
    <div className="dashboard-shell relative overflow-hidden rounded-[2rem] border border-green-200/80 bg-white/90 shadow-soft backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-green-100 bg-white/85 px-5 py-4">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-red-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-300" />
          <span className="h-3 w-3 rounded-full bg-teal-300" />
        </div>
        <span className="rounded-full bg-green-50 px-8 py-2 text-xs font-semibold text-slate-500">app.niswarth.ai</span>
        <span className="hidden text-xs font-bold text-green-700 sm:inline">workflow view</span>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2 rounded-[1.65rem] border border-green-100 bg-gradient-to-br from-white to-green-50/70 p-5 shadow-[0_18px_48px_-36px_rgba(20,83,45,0.55)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-base font-extrabold text-ink"><ClipboardCheck className="text-leaf" size={20} /> Active Campaigns</div>
            <span className="text-sm font-semibold text-slate-500">3 running</span>
          </div>
          <div className="space-y-3">
            {[
              ['School Supplies — Pune', 'On track', 'green'],
              ['Stray Care Drive — Jaipur', 'Needs review', 'gray'],
              ['Tree Plantation — Goa', 'On track', 'green'],
            ].map(([item, status, tone]) => (
              <div key={item} className="flex items-center justify-between rounded-2xl bg-white/92 px-4 py-3 text-sm shadow-sm">
                <span className="font-semibold text-slate-800">{item}</span>
                <StatusPill tone={tone}>{status}</StatusPill>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.65rem] border border-green-100 bg-white/92 p-5 shadow-[0_18px_48px_-38px_rgba(20,83,45,0.45)]">
          <div className="flex items-center gap-3 text-base font-extrabold text-ink"><Users className="text-leaf" size={20} /> Volunteers Assigned</div>
          <p className="mt-5 text-3xl font-black text-ink">Active team</p>
          <div className="mt-5 flex -space-x-2">
            {[0,1,2,3,4].map((i) => <span key={i} className={`h-9 w-9 rounded-full border-2 border-white ${i === 4 ? 'bg-green-200' : 'bg-emerald-400'}`} />)}
          </div>
        </div>

        <div className="rounded-[1.65rem] border border-green-100 bg-white/92 p-5 shadow-[0_18px_48px_-38px_rgba(20,83,45,0.45)]">
          <div className="flex items-center gap-3 text-base font-extrabold text-ink"><CalendarDays className="text-leaf" size={20} /> Upcoming Events</div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center gap-3"><span className="rounded-2xl bg-green-100 px-3 py-2 text-xs font-black text-forest">12<br/>JUN</span><span className="font-semibold text-slate-700">Volunteer Orientation</span></div>
            <div className="flex items-center gap-3"><span className="rounded-2xl bg-green-100 px-3 py-2 text-xs font-black text-forest">18<br/>JUN</span><span className="font-semibold text-slate-700">Field Visit — Goa</span></div>
          </div>
        </div>

        <div className="rounded-[1.65rem] border border-green-100 bg-white/92 p-5 shadow-[0_18px_48px_-38px_rgba(20,83,45,0.45)]">
          <div className="flex items-center gap-3 text-base font-extrabold text-ink"><MapPin className="text-leaf" size={20} /> Field Updates</div>
          <p className="mt-4 text-sm leading-7 text-slate-600"><strong>Pune</strong> · Distributed school kits.<br/><strong>Jaipur</strong> · Vaccination notes added.<br/><strong>Goa</strong> · Plantation photos received.</p>
        </div>

        <div className="rounded-[1.65rem] border border-green-100 bg-gradient-to-br from-green-50 to-white p-5 shadow-[0_18px_48px_-38px_rgba(20,83,45,0.45)]">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 text-base font-extrabold text-ink"><FileText className="text-leaf" size={20} /> AI Impact Report</div><StatusPill>Draft</StatusPill></div>
          <p className="mt-4 text-sm leading-7 text-slate-600">AI has drafted a summary from campaign updates. Human review is required before sharing.</p>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="gradient-bg">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-20 lg:pt-10">
        <div className="lg:-mt-8">
          <div className="mb-5 inline-flex rounded-full border border-green-200 bg-white/90 px-4 py-2 text-sm font-bold text-forest shadow-sm">AI-assisted NGO workflow platform</div>
          <h1 className="display-font text-5xl font-black tracking-[-0.055em] text-ink md:text-6xl lg:text-7xl">
            Selfless Service, <span className="block text-forest">Smarter Impact</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Niswarth AI helps NGOs coordinate volunteers, manage campaigns, collect field updates, and create human-reviewed impact reports with AI-assisted clarity.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button to="/contact">Map Your Impact Workflow <ArrowRight className="ml-2" size={18} /></Button>
            <Button to="/demo" variant="secondary">Explore Workflow Dashboard</Button>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">AI-generated drafts may contain inaccuracies; human review is required before sharing.</p>
        </div>
        <DashboardMock />
      </div>
    </section>
  )
}
