import { useState } from 'react'
import Button from '../common/Button.jsx'
import FormField from './FormField.jsx'
import { createFieldUpdate } from '../../services/campaignService.js'

const initialForm = {
  updateText: '',
  location: '',
  submittedBy: '',
  evidenceType: 'text',
}

function validateFieldUpdate(form) {
  const errors = {}
  if (form.updateText.trim().length < 12) errors.updateText = 'Field update should be at least 12 characters.'
  if (form.location.trim().length < 2) errors.location = 'Location is required.'
  if (form.submittedBy.trim().length < 2) errors.submittedBy = 'Submitted by is required for traceability.'
  return errors
}

export default function AddFieldUpdatePanel({ campaign, backendReady, organizationId, onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateFieldUpdate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    if (!backendReady || !organizationId || !campaign?.dbBacked) {
      setSubmitError('Select a workspace-backed campaign before adding field updates.')
      return
    }

    setSubmitting(true)
    const { fieldUpdate, error } = await createFieldUpdate({ organizationId, campaignId: campaign.id, ...form })
    setSubmitting(false)

    if (error) {
      setSubmitError(error.message || 'Field update could not be saved. Please check backend permissions.')
      return
    }

    setForm(initialForm)
    onCreated?.(fieldUpdate)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leaf">Selected campaign</p>
        <p className="mt-2 font-bold text-ink">{campaign?.title || 'No campaign selected'}</p>
        {campaign?.location && <p className="mt-1 text-sm text-slate-600">{campaign.location}</p>}
      </div>

      <FormField label="Field update" error={errors.updateText}>
        <textarea value={form.updateText} onChange={(event) => updateField('updateText', event.target.value)} rows="5" className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm leading-6 outline-none" placeholder="Describe what happened in the field. Include only observed activity or verified notes." />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Location" error={errors.location}>
          <input value={form.location} onChange={(event) => updateField('location', event.target.value)} className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none" placeholder="Field location" />
        </FormField>
        <FormField label="Submitted by" error={errors.submittedBy}>
          <input value={form.submittedBy} onChange={(event) => updateField('submittedBy', event.target.value)} className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none" placeholder="Volunteer or coordinator name" />
        </FormField>
      </div>

      <FormField label="Evidence type">
        <select value={form.evidenceType} onChange={(event) => updateField('evidenceType', event.target.value)} className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none">
          <option value="text">Text note</option>
          <option value="image">Image evidence</option>
          <option value="document">Document</option>
          <option value="mixed">Mixed evidence</option>
        </select>
      </FormField>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
        Quality rule: report drafts should be generated from actual field updates. Avoid adding assumptions or unverified claims.
      </div>

      {submitError && <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}

      <Button type="submit" disabled={submitting} className="disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? 'Saving update...' : 'Add Field Update'}
      </Button>
    </form>
  )
}
