import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HandHeart, Lock, Mail, ShieldCheck, Users } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import LogoMark from '../components/common/LogoMark.jsx'
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
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
        <aside className="overflow-hidden rounded-[2rem] border border-green-100 bg-white/85 shadow-[0_28px_70px_-45px_rgba(20,83,45,0.5)] backdrop-blur">
          <div className="relative p-8 lg:p-10">
            <div className="absolute -left-20 top-12 h-52 w-52 rounded-full bg-green-200/35 blur-3xl" />
            <div className="absolute -right-16 -bottom-12 h-56 w-56 rounded-full bg-emerald-100/80 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <LogoMark size="sm" />
                <div>
                  <p className="display-font text-lg font-black text-ink">Niswarth <span className="text-forest">AI</span></p>
                  <p className="text-xs font-semibold text-slate-500">Selfless service, smarter impact</p>
                </div>
              </div>

              <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.24em] text-leaf">Welcome back</p>
              <h1 className="mt-3 display-font text-4xl font-black leading-tight text-ink sm:text-5xl">
                Continue your NGO workflow from where your team left off.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                Open your workspace to review campaigns, assign volunteers, add field updates, and prepare human-reviewed impact reports.
              </p>

              <div className="mt-8 grid gap-4">
                <div className="rounded-[1.5rem] border border-green-100 bg-green-50/80 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 shrink-0 text-leaf" size={21} />
                    <div>
                      <p className="font-extrabold text-ink">Workspace access is protected</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Dashboard records are shown only after login and workspace verification.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-green-100 bg-white/80 p-4">
                    <Users className="text-leaf" size={22} />
                    <p className="mt-3 text-sm font-extrabold text-ink">Campaign coordination</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Keep volunteer and field activity connected to campaigns.</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-green-100 bg-white/80 p-4">
                    <HandHeart className="text-leaf" size={22} />
                    <p className="mt-3 text-sm font-extrabold text-ink">Human-reviewed reports</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Use AI drafts as a starting point, not the final voice.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="premium-card self-start rounded-[2rem] p-8 lg:p-10">
          <h2 className="display-font text-3xl font-black text-ink">Sign in</h2>
          <p className="mt-2 text-sm text-slate-600">Use the email and password linked to your NGO workspace.</p>

          <label className="mt-7 block text-sm font-bold text-ink" htmlFor="email">Email</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <Mail size={18} className="text-leaf" />
            <input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="you@example.com" />
          </div>

          <label className="mt-5 block text-sm font-bold text-ink" htmlFor="password">Password</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3">
            <Lock size={18} className="text-leaf" />
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
