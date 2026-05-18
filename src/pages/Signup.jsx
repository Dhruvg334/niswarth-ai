import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound, Workflow } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

const setupSteps = [
  'Create your account',
  'Set up NGO workspace',
  'Start with campaign data',
]

export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (form.fullName.trim().length < 2) {
      setError('Enter your full name.')
      return
    }
    if (!form.email.trim()) {
      setError('Email is required.')
      return
    }
    if (form.password.length < 8) {
      setError('Password should be at least 8 characters.')
      return
    }

    setSubmitting(true)
    const { data, error: signUpError } = await signUp(form)
    setSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data?.session) {
      navigate('/workspace-setup', { replace: true })
      return
    }

    setMessage('Account created. Check your email to confirm your account, then sign in to create your NGO workspace.')
  }

  return (
    <div className="gradient-bg">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
        <div className="premium-card overflow-hidden rounded-[2rem] p-0">
          <div className="relative bg-gradient-to-br from-emerald-50 via-white to-green-100 p-8 lg:p-10">
            <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full bg-green-200/50 blur-2xl sm:block" />
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-leaf">Create workspace access</p>
            <h1 className="mt-3 display-font text-4xl font-black leading-tight text-ink sm:text-5xl">Start with an NGO account</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              Create an account, set up your NGO workspace, and manage campaigns, volunteers, field updates, and AI-assisted impact reports inside one private workspace.
            </p>

            <div className="mt-8 grid gap-3">
              {setupSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-green-100 bg-white/80 p-4 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-forest">{index + 1}</span>
                  <p className="text-sm font-bold text-slate-700">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-green-100 bg-white/85 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-leaf">
                  <Workflow size={21} />
                </div>
                <div>
                  <p className="font-extrabold text-ink">Built like a real workspace flow</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">User account → NGO workspace → organization-scoped campaigns, volunteers, updates, and reports.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="premium-card rounded-[2rem] p-8 lg:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-leaf">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="display-font text-3xl font-black text-ink">Sign up</h2>
              <p className="mt-2 text-sm text-slate-600">Use a valid email address for account access.</p>
            </div>
          </div>

          <label className="mt-7 block text-sm font-bold text-ink" htmlFor="fullName">Full name</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <UserRound size={18} className="text-leaf" />
            <input id="fullName" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Your name" />
          </div>

          <label className="mt-5 block text-sm font-bold text-ink" htmlFor="email">Email</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <Mail size={18} className="text-leaf" />
            <input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="you@example.com" />
          </div>

          <label className="mt-5 block text-sm font-bold text-ink" htmlFor="password">Password</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <LockKeyhole size={18} className="text-leaf" />
            <input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Minimum 8 characters" />
          </div>

          <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm leading-6 text-slate-600">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-leaf" size={18} />
              <p>Your account is used to create and access a private NGO workspace. Public visitors cannot access the dashboard workflow.</p>
            </div>
          </div>

          {error && <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</p>}
          {message && <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</p>}

          <Button type="submit" disabled={submitting} className="mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account? <Link to="/login" className="font-bold text-forest hover:text-leaf">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  )
}
