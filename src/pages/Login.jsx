import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, hasWorkspace } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const destination = location.state?.from?.pathname || (hasWorkspace ? '/demo' : '/workspace-setup')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required.')
      return
    }

    setSubmitting(true)
    const { error: signInError } = await signIn(form)
    setSubmitting(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    setMessage('Signed in successfully. Opening your workspace...')
    navigate(destination, { replace: true })
  }

  return (
    <div className="gradient-bg">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <div className="premium-card rounded-[2rem] p-8 lg:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-leaf">Workspace access</p>
          <h1 className="mt-3 display-font text-4xl font-black text-ink sm:text-5xl">Sign in to Niswarth AI</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Access your NGO workspace, manage campaign records, assign volunteers, and review AI-assisted impact report drafts.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-green-100 bg-green-50/70 p-5 text-sm leading-7 text-slate-700">
            Dashboard access is protected so campaign records, volunteers, field updates, and reports can be scoped to the right NGO workspace.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="premium-card rounded-[2rem] p-8 lg:p-10">
          <h2 className="display-font text-3xl font-black text-ink">Login</h2>
          <p className="mt-2 text-sm text-slate-600">Use the email and password linked to your workspace.</p>

          <label className="mt-7 block text-sm font-bold text-ink" htmlFor="email">Email</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <Mail size={18} className="text-leaf" />
            <input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="you@example.com" />
          </div>

          <label className="mt-5 block text-sm font-bold text-ink" htmlFor="password">Password</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <LockKeyhole size={18} className="text-leaf" />
            <input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Your password" />
          </div>

          {error && <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</p>}
          {message && <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</p>}

          <Button type="submit" disabled={submitting} className="mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to Niswarth AI? <Link to="/signup" className="font-bold text-forest hover:text-leaf">Create an account</Link>
          </p>
        </form>
      </section>
    </div>
  )
}
