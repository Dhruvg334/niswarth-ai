import { useState } from 'react'
import SectionHeader from '../components/common/SectionHeader.jsx'
import Button from '../components/common/Button.jsx'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <section className="gradient-bg pb-20 pt-24 lg:pb-24 lg:pt-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Contact" title="Map your impact workflow" description="Share your NGO workflow details so the platform can be mapped around your campaigns, volunteers, and reporting needs." />
        <form onSubmit={handleSubmit} className="mt-14 rounded-[2rem] border border-green-100 bg-white/90 p-6 shadow-soft backdrop-blur md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-bold text-ink">Name<input required className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none focus:border-leaf" /></label>
            <label className="text-sm font-bold text-ink">NGO/Foundation Name<input required className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none focus:border-leaf" /></label>
            <label className="text-sm font-bold text-ink">City<input required className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none focus:border-leaf" /></label>
            <label className="text-sm font-bold text-ink">Number of Volunteers<select required className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none focus:border-leaf"><option value="">Select range</option><option>1–10</option><option>11–50</option><option>51–200</option><option>200+</option></select></label>
            <label className="text-sm font-bold text-ink md:col-span-2">Campaign Type<select required className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none focus:border-leaf"><option value="">Select campaign type</option><option>Education</option><option>Animal Welfare</option><option>Environment</option><option>Other</option></select></label>
            <label className="text-sm font-bold text-ink md:col-span-2">Message<textarea required rows="5" className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/30 px-4 py-3 outline-none focus:border-leaf" /></label>
          </div>
          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button type="submit">Map Your Impact Workflow</Button>
            {submitted && <p className="text-sm font-semibold text-forest">Workflow details captured for review.</p>}
          </div>
        </form>
      </div>
    </section>
  )
}
