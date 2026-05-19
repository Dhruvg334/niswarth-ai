import { useState } from 'react'
import Button from '../common/Button.jsx'
import FormField from './FormField.jsx'
import { createCampaign } from '../../services/campaignService.js'

const initialForm = {
  title: '',
  type: 'education',
  location: '',
  status: 'planning',
  goal: '',
  startDate: '',
  endDate: '',
}

function validateCampaign(form) {
  const errors = {}
  if (form.title.trim().length < 4) errors.title = 'Campaign title should be at least 4 characters.'
  if (!form.type) errors.type = 'Select a campaign type.'
  if (form.location.trim().length < 2) errors.location = 'Location is required.'
  if (form.goal.trim().length > 0 && form.goal.trim().length < 12) errors.goal = 'Goal should be more descriptive or left blank.'
  if (form.startDate && form.endDate && form.endDate < form.startDate) errors.endDate = 'End date cannot be before start date.'
  return errors
}

export default function CreateCampaignPanel({ backendReady, organizationId, onCreated }) {
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
    const validationErrors = validateCampaign(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    if (!backendReady || !organizationId) {
      setSubmitError('Create or select a workspace before creating campaign records.')
      return
    }

    setSubmitting(true)
    const { campaign, error } = await createCampaign({ organizationId, ...form })
    setSubmitting(false)

    if (error) {
      setSubmitError(error.message || 'Campaign could not be created. Please check backend permissions.')
      return
    }

    setForm(initialForm)
    onCreated?.(campaign)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Campaign title" error={errors.title}>
        <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none" placeholder="Weekend Learning Support" />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Campaign type" error={errors.type}>
          <select value={form.type} onChange={(event) => updateField('type', event.target.value)} className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none">
            <option value="education">Education</option>
            <option value="animal_welfare">Animal Welfare</option>
            <option value="environment">Environment</option>
            <option value="other">Other</option>
          </select>
        </FormField>

        <FormField label="Status">
          <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none">
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </FormField>
      </div>

      <FormField label="Location" error={errors.location}>
        <input value={form.location} onChange={(event) => updateField('location', event.target.value)} className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none" placeholder="City or field location" />
      </FormField>

      <FormField label="Campaign goal" error={errors.goal}>
        <textarea value={form.goal} onChange={(event) => updateField('goal', event.target.value)} rows="4" className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm leading-6 outline-none" placeholder="Describe what this campaign is trying to achieve." />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Start date">
          <input type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none" />
        </FormField>
        <FormField label="End date" error={errors.endDate}>
          <input type="date" value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none" />
        </FormField>
      </div>

      <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 text-xs leading-5 text-slate-600">
        This creates a campaign record in Supabase. Field updates and report drafts can then be attached to this campaign.
      </div>

      {submitError && <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={submitting} className="disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Creating campaign...' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  )
}
