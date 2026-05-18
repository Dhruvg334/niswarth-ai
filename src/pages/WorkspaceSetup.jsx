import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, MapPin, ShieldCheck } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function WorkspaceSetup() {
  const navigate = useNavigate()
  const { isAuthenticated, hasWorkspace, setupWorkspace, workspaceLoading } = useAuth()
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
      setError(workspaceError.message)
      return
    }

    navigate('/demo', { replace: true })
  }

  return (
    <div className="gradient-bg">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
        <div className="premium-card rounded-[2rem] p-8 lg:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-leaf">NGO workspace</p>
          <h1 className="mt-3 display-font text-4xl font-black text-ink sm:text-5xl">Create your organization workspace</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Your campaigns, volunteers, field updates, and impact reports will be created inside this workspace.
          </p>
          <div className="mt-8 space-y-4">
            {['Starter campaign data will be created for testing.', 'You will be added as the workspace admin.', 'Dashboard data will be scoped to this organization.'].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-green-100 bg-white/75 p-4 text-sm font-semibold text-slate-700">
                <ShieldCheck className="mt-0.5 shrink-0 text-leaf" size={18} />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="premium-card rounded-[2rem] p-8 lg:p-10">
          <h2 className="display-font text-3xl font-black text-ink">Workspace details</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use a real or test NGO name. Starter records will be generated under this workspace.</p>

          <label className="mt-7 block text-sm font-bold text-ink" htmlFor="name">NGO/Foundation name</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <Building2 size={18} className="text-leaf" />
            <input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Example: Niswarth Foundation" />
          </div>

          <label className="mt-5 block text-sm font-bold text-ink" htmlFor="city">City</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <MapPin size={18} className="text-leaf" />
            <input id="city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Example: Pune" />
          </div>

          {error && <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</p>}

          <Button type="submit" disabled={submitting || workspaceLoading} className="mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60">
            {submitting || workspaceLoading ? 'Creating workspace...' : 'Create Workspace'}
          </Button>
        </form>
      </section>
    </div>
  )
}
