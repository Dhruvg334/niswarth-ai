import { useState } from 'react'
import Button from '../common/Button.jsx'
import FormField from './FormField.jsx'
import { createVolunteer } from '../../services/campaignService.js'

const initialForm = {
  name: '',
  role: 'Field Volunteer',
  city: '',
  phone: '',
  email: '',
  availability: 'available',
}

function validateVolunteer(form) {
  const errors = {}
  if (form.name.trim().length < 2) errors.name = 'Volunteer name is required.'
  if (form.role.trim().length < 2) errors.role = 'Role is required.'
  if (form.city.trim().length < 2) errors.city = 'City is required.'
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email or leave it blank.'
  if (form.phone.trim() && form.phone.trim().length < 7) errors.phone = 'Enter a usable phone number or leave it blank.'
  if (!form.availability) errors.availability = 'Select availability.'
  return errors
}

export default function AddVolunteerPanel({ backendReady, organizationId, onCreated }) {
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
    const validationErrors = validateVolunteer(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    if (!backendReady || !organizationId) {
      setSubmitError('Create or select a workspace before creating volunteer records.')
      return
    }

    setSubmitting(true)
    const { volunteer, error } = await createVolunteer({ organizationId, ...form })
    setSubmitting(false)

    if (error) {
      setSubmitError(error.message || 'Volunteer could not be created. Please check backend permissions.')
      return
    }

    setForm(initialForm)
    onCreated?.(volunteer)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Volunteer name" error={errors.name}>
        <input
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
          className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none"
          placeholder="Volunteer or coordinator name"
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Role" error={errors.role}>
          <input
            value={form.role}
            onChange={(event) => updateField('role', event.target.value)}
            className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none"
            placeholder="Field Volunteer"
          />
        </FormField>

        <FormField label="City" error={errors.city}>
          <input
            value={form.city}
            onChange={(event) => updateField('city', event.target.value)}
            className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none"
            placeholder="City"
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Phone" error={errors.phone}>
          <input
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none"
            placeholder="Optional phone number"
          />
        </FormField>

        <FormField label="Email" error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none"
            placeholder="Optional email address"
          />
        </FormField>
      </div>

      <FormField label="Availability" error={errors.availability}>
        <select
          value={form.availability}
          onChange={(event) => updateField('availability', event.target.value)}
          className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none"
        >
          <option value="available">Available</option>
          <option value="limited">Limited availability</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </FormField>

      <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 text-xs leading-5 text-slate-600">
        This creates a reusable volunteer profile. Contact details are optional and stay inside the selected workspace.
      </div>

      {submitError && <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}

      <Button type="submit" disabled={submitting} className="disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? 'Adding volunteer...' : 'Add Volunteer'}
      </Button>
    </form>
  )
}
