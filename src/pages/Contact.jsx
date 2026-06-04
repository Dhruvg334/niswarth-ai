import { useState } from 'react'
import { CheckCircle2, Mail, MessageSquareText, ShieldCheck } from 'lucide-react'
import SectionHeader from '../components/common/SectionHeader.jsx'
import Button from '../components/common/Button.jsx'
import { submitContactInquiry } from '../services/contactService.js'

const initialForm = {
  name: '',
  email: '',
  organization: '',
  city: '',
  inquiryType: '',
  message: '',
  website: '',
}

const inquiryTypes = [
  'Project feedback',
  'Collaboration',
  'NGO workflow discussion',
  'Recruiter / internship discussion',
  'Technical question',
  'Other',
]

function validateContactForm(form) {
  if (!form.name.trim()) return 'Please enter your name.'
  if (!form.email.trim()) return 'Please enter your email address.'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email address.'
  if (!form.organization.trim()) return 'Please enter your NGO or organization name.'
  if (!form.inquiryType) return 'Please select an inquiry type.'
  if (form.message.trim().length < 20) return 'Please share a little more context so the inquiry is useful.'
  return null
}

export default function Contact() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (status !== 'submitting') {
      setStatus('idle')
      setMessage('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateContactForm(form)
    if (validationError) {
      setStatus('error')
      setMessage(validationError)
      return
    }

    try {
      setStatus('submitting')
      setMessage('')
      await submitContactInquiry(form)
      setForm(initialForm)
      setStatus('success')
      setMessage('Thanks. Your message has been received.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'The message could not be sent right now. Please try again in a moment.')
    }
  }

  return (
    <section className="gradient-bg pb-20 pt-24 lg:pb-24 lg:pt-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Contact the developer about Niswarth AI"
          description="Share feedback, collaboration ideas, NGO workflow questions, or technical discussion around the project."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.35fr] lg:items-start">
          <aside className="rounded-[2rem] border border-green-100 bg-white/85 p-6 shadow-soft backdrop-blur md:p-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-leaf">What to share</p>
            <h3 className="mt-4 display-font text-3xl font-black tracking-[-0.04em] text-ink">Keep it specific and practical.</h3>
            <p className="mt-4 leading-7 text-slate-600">
              The most useful messages explain what you want to discuss, test, review, or improve in the product.
            </p>

            <div className="mt-7 space-y-4">
              <div className="rounded-3xl border border-green-100 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-green-50 p-3 text-forest shadow-sm"><MessageSquareText size={20} /></span>
                  <div>
                    <p className="font-bold text-ink">Workflow context</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">For NGO discussions, mention the campaign workflow and where coordination currently becomes difficult.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-green-100 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-green-50 p-3 text-forest"><ShieldCheck size={20} /></span>
                  <div>
                    <p className="font-bold text-ink">Human-reviewed AI</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">The project is built around draft generation, evidence checks, review, and approval rather than automatic publishing.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-green-100 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-green-50 p-3 text-forest"><Mail size={20} /></span>
                  <div>
                    <p className="font-bold text-ink">Direct inquiry</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">You can also write directly to dhruvg3304@gmail.com for project or internship-related discussion.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-green-100 bg-white/95 p-6 shadow-soft backdrop-blur md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={updateField}
                className="hidden"
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />

              <label className="text-sm font-bold text-ink">
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                  className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none transition focus:border-leaf focus:bg-white"
                  placeholder="Your name"
                />
              </label>

              <label className="text-sm font-bold text-ink">
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  required
                  className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none transition focus:border-leaf focus:bg-white"
                  placeholder="you@example.com"
                />
              </label>

              <label className="text-sm font-bold text-ink">
                Organisation / Company
                <input
                  name="organization"
                  value={form.organization}
                  onChange={updateField}
                  required
                  className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none transition focus:border-leaf focus:bg-white"
                  placeholder="Organisation, company, or project name"
                />
              </label>

              <label className="text-sm font-bold text-ink">
                City
                <input
                  name="city"
                  value={form.city}
                  onChange={updateField}
                  className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none transition focus:border-leaf focus:bg-white"
                  placeholder="City or region"
                />
              </label>

              <label className="text-sm font-bold text-ink md:col-span-2">
                Inquiry type
                <select
                  name="inquiryType"
                  value={form.inquiryType}
                  onChange={updateField}
                  required
                  className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none transition focus:border-leaf focus:bg-white"
                >
                  <option value="">Select inquiry type</option>
                  {inquiryTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-bold text-ink md:col-span-2">
                Message
                <textarea
                  name="message"
                  value={form.message}
                  onChange={updateField}
                  required
                  rows="7"
                  className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none transition focus:border-leaf focus:bg-white"
                  placeholder="Describe the project feedback, workflow question, collaboration idea, or technical discussion you want to start."
                />
              </label>
            </div>

            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button type="submit" disabled={status === 'submitting'} className={status === 'submitting' ? 'cursor-not-allowed opacity-70' : ''}>
                {status === 'submitting' ? 'Sending...' : 'Send Message'}
              </Button>
              {message && (
                <p className={`text-sm font-semibold leading-6 ${status === 'success' ? 'text-forest' : 'text-red-700'}`}>
                  {status === 'success' && <CheckCircle2 className="mr-1 inline" size={17} />}
                  {message}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
