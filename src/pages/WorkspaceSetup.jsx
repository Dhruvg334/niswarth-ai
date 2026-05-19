import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, ClipboardCheck, Leaf, MapPin, ShieldCheck } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import LogoMark from '../components/common/LogoMark.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

const workspaceNotes = [
  {
    icon: ClipboardCheck,
    title: 'Starter campaigns are included',
    text: 'A few example records are added so you can test the dashboard immediately. Admins can delete them later.',
  },
  {
    icon: ShieldCheck,
    title: 'You become the workspace admin',
    text: 'Admin access lets you create campaigns, manage volunteers, and control campaign records.',
  },
  {
    icon: Leaf,
    title: 'Your work stays inside this workspace',
    text: 'Campaigns, volunteers, updates, and reports are connected to the NGO workspace you create.',
  },
]

export default function WorkspaceSetup() {
  const navigate = useNavigate()
  const { isAuthenticated, hasWorkspace, setupWorkspace } = useAuth()
  const [form, setForm] = useState({ name: '', city: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (hasWorkspace) return <Navigate to="/demo" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.name.trim().length < 2) {
      setError('Enter the NGO or foundation name.')
      return
    }

    setSubmitting(true)
    const { error: workspaceError } = await setupWorkspace(form)
    setSubmitting(false)

    if (workspaceError) {
      setError(workspaceError.message || 'Workspace could not be created. Please try again.')
      return
    }

    navigate('/demo', { replace: true })
  }

  return (
    <div className="gradient-bg">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
        <aside className="overflow-hidden rounded-[2rem] border border-green-100 bg-white/85 shadow-[0_28px_70px_-45px_rgba(20,83,45,0.5)] backdrop-blur">
          <div className="relative p-8 lg:p-10">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-green-200/40 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-emerald-100/70 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <LogoMark size="sm" />
                <div>
                  <p className="display-font text-lg font-black text-ink">Niswarth <span className="text-forest">AI</span></p>
                  <p className="text-xs font-semibold text-slate-500">Selfless service, smarter impact</p>
                </div>
              </div>

              <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.24em] text-leaf">NGO workspace</p>
              <h1 className="mt-3 display-font text-4xl font-black leading-tight text-ink sm:text-5xl">
                Create one home for your foundation’s work.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                This workspace keeps your campaign activity, volunteer coordination, field evidence, and report drafts organized under one NGO identity.
              </p>

              <div className="mt-8 space-y-3">
                {workspaceNotes.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-[1.45rem] border border-green-100 bg-white/80 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-leaf">
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="font-extrabold text-ink">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="premium-card self-start rounded-[2rem] p-8 lg:p-10">
          <h2 className="display-font text-3xl font-black text-ink">Workspace details</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use the NGO or foundation name you want to see across the dashboard.</p>

          <label className="mt-7 block text-sm font-bold text-ink" htmlFor="name">NGO/Foundation name</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <Building2 size={18} className="text-leaf" />
            <input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Example: Niswarth Foundation" disabled={submitting} />
          </div>

          <label className="mt-5 block text-sm font-bold text-ink" htmlFor="city">City</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <MapPin size={18} className="text-leaf" />
            <input id="city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Example: Pune" disabled={submitting} />
          </div>

          <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm leading-6 text-slate-600">
            Starter records will appear in the dashboard to help you understand the workflow. You can remove campaigns after testing.
          </div>

          {error && <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</p>}

          <Button type="submit" disabled={submitting} className="mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Creating workspace...' : 'Create Workspace'}
          </Button>
        </form>
      </section>
    </div>
  )
}
