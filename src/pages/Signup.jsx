import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HandHeart, Leaf, Lock, Mail, Sparkles, Users } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import LogoMark from '../components/common/LogoMark.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

const workspaceSteps = [
  {
    title: 'Create your account',
    text: 'Use a private login for your NGO workspace.',
  },
  {
    title: 'Name your workspace',
    text: 'Create one place for your foundation, city, and team activity.',
  },
  {
    title: 'Start with guided records',
    text: 'Sample campaigns are added so you can test the workflow immediately.',
  },
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
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
        <aside className="overflow-hidden rounded-[2rem] border border-green-100 bg-white/85 shadow-[0_28px_70px_-45px_rgba(20,83,45,0.5)] backdrop-blur">
          <div className="relative p-8 lg:p-10">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-green-200/40 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-emerald-100/70 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <LogoMark size="sm" />
                <div>
                  <p className="display-font text-lg font-black text-ink">Niswarth <span className="text-forest">AI</span></p>
                  <p className="text-xs font-semibold text-slate-500">Selfless service, smarter impact</p>
                </div>
              </div>

              <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.24em] text-leaf">Private NGO workspace</p>
              <h1 className="mt-3 display-font text-4xl font-black leading-tight text-ink sm:text-5xl">
                Organize impact work without scattered follow-ups.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                Create a workspace where your campaigns, volunteers, field updates, and report drafts stay connected in one calm workflow.
              </p>

              <div className="mt-8 space-y-3">
                {workspaceSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-4 rounded-[1.4rem] border border-green-100 bg-white/80 p-4 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-sm font-black text-forest">{index + 1}</span>
                    <div>
                      <p className="font-extrabold text-ink">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-green-100 bg-green-50/80 p-4">
                  <HandHeart className="text-leaf" size={22} />
                  <p className="mt-3 text-sm font-extrabold text-ink">Built for service teams</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Simple language, human review, and practical campaign records.</p>
                </div>
                <div className="rounded-[1.4rem] border border-green-100 bg-white/80 p-4">
                  <Leaf className="text-leaf" size={22} />
                  <p className="mt-3 text-sm font-extrabold text-ink">Ready to test quickly</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Starter campaigns help you understand the workflow after setup.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="premium-card self-start rounded-[2rem] p-8 lg:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-leaf">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="display-font text-3xl font-black text-ink">Create account</h2>
              <p className="mt-2 text-sm text-slate-600">This account will be used to create and access your NGO workspace.</p>
            </div>
          </div>

          <label className="mt-7 block text-sm font-bold text-ink" htmlFor="fullName">Full name</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <Users size={18} className="text-leaf" />
            <input id="fullName" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Your name" />
          </div>

          <label className="mt-5 block text-sm font-bold text-ink" htmlFor="email">Email</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <Mail size={18} className="text-leaf" />
            <input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="you@example.com" />
          </div>

          <label className="mt-5 block text-sm font-bold text-ink" htmlFor="password">Password</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <Lock size={18} className="text-leaf" />
            <input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Minimum 8 characters" />
          </div>

          <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm leading-6 text-slate-600">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 shrink-0 text-leaf" size={18} />
              <p>Public visitors can explore the website. Only signed-in users can open the workflow dashboard.</p>
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
