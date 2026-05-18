import { useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import FormField from './FormField.jsx'
import { assignVolunteerToCampaign } from '../../services/campaignService.js'

const initialForm = {
  volunteerId: '',
  assignmentRole: 'Field Support',
}

function validateAssignment(form) {
  const errors = {}
  if (!form.volunteerId) errors.volunteerId = 'Select a volunteer.'
  if (form.assignmentRole.trim().length < 2) errors.assignmentRole = 'Assignment role is required.'
  return errors
}

export default function AssignVolunteerPanel({ campaign, volunteers = [], backendReady, onAssigned }) {
  const assignedIds = useMemo(() => new Set((campaign?.volunteers || []).map((volunteer) => volunteer.id).filter(Boolean)), [campaign])
  const assignableVolunteers = useMemo(
    () => volunteers.filter((volunteer) => volunteer.availability !== 'unavailable' && !assignedIds.has(volunteer.id)),
    [volunteers, assignedIds]
  )

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
    const validationErrors = validateAssignment(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    if (!backendReady || !campaign?.dbBacked) {
      setSubmitError('Connect Supabase and select a backend campaign before assigning volunteers.')
      return
    }

    if (assignedIds.has(form.volunteerId)) {
      setSubmitError('This volunteer is already assigned to the selected campaign.')
      return
    }

    setSubmitting(true)
    const { assignment, error } = await assignVolunteerToCampaign({
      campaignId: campaign.id,
      volunteerId: form.volunteerId,
      assignmentRole: form.assignmentRole,
    })
    setSubmitting(false)

    if (error) {
      setSubmitError(error.message || 'Volunteer could not be assigned. Please check backend permissions.')
      return
    }

    setForm(initialForm)
    onAssigned?.(assignment)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leaf">Selected campaign</p>
        <p className="mt-2 font-bold text-ink">{campaign?.title || 'No campaign selected'}</p>
        {campaign?.location && <p className="mt-1 text-sm text-slate-600">{campaign.location}</p>}
      </div>

      {volunteers.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          No volunteer profiles exist yet. Add a volunteer first, then assign them to this campaign.
        </div>
      )}

      {volunteers.length > 0 && assignableVolunteers.length === 0 && (
        <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm leading-6 text-slate-600">
          All currently assignable volunteers are already assigned to this campaign.
        </div>
      )}

      <div className="rounded-2xl border border-green-100 bg-white p-4 text-xs leading-5 text-slate-600">
        Volunteers already active in other campaigns remain selectable, but they are labelled in the list so coordinators can avoid overloading the same person. Unavailable volunteers are hidden from this assignment flow.
      </div>

      <FormField label="Volunteer" error={errors.volunteerId}>
        <select
          value={form.volunteerId}
          onChange={(event) => updateField('volunteerId', event.target.value)}
          className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none"
          disabled={assignableVolunteers.length === 0}
        >
          <option value="">Select volunteer</option>
          {assignableVolunteers.map((volunteer) => (
            <option key={volunteer.id} value={volunteer.id}>
              {volunteer.name} — {volunteer.role} ({volunteer.assignmentSummary || volunteer.availabilityLabel || volunteer.availability})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Campaign assignment role" error={errors.assignmentRole}>
        <input
          value={form.assignmentRole}
          onChange={(event) => updateField('assignmentRole', event.target.value)}
          className="focus-ring w-full rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm outline-none"
          placeholder="Teaching support, feeding route lead, documentation, etc."
          disabled={assignableVolunteers.length === 0}
        />
      </FormField>

      <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 text-xs leading-5 text-slate-600">
        Assignment creates the connection between a volunteer profile and a specific campaign. This helps reports and metrics reflect real coordination work.
      </div>

      {submitError && <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}

      <Button type="submit" disabled={submitting || assignableVolunteers.length === 0} className="disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? 'Assigning volunteer...' : 'Assign Volunteer'}
      </Button>
    </form>
  )
}
