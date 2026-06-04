import { useEffect, useMemo, useState } from 'react'
import { Mail, RefreshCw, Trash2, UserPlus, Users } from 'lucide-react'
import Button from '../common/Button.jsx'
import { addWorkspaceMember, getWorkspaceMembers, memberRoles, removeWorkspaceMember, updateWorkspaceMemberRole } from '../../services/memberService.js'
import { getRoleDescription, getRoleLabel } from '../../utils/permissions.js'

function roleClass(role) {
  if (role === 'admin') return 'bg-emerald-100 text-emerald-800'
  if (role === 'coordinator') return 'bg-blue-100 text-blue-800'
  return 'bg-amber-100 text-amber-800'
}

function MemberRow({ member, currentUserId, onRoleChange, onRemove, busy }) {
  const isCurrentUser = member.user_id === currentUserId
  const isAdmin = member.role === 'admin'

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold text-ink">{member.full_name || member.email || 'Workspace member'}</p>
            {isCurrentUser && <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-forest">You</span>}
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Mail size={14} /> {member.email || 'Email not available'}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{getRoleDescription(member.role)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${roleClass(member.role)}`}>{getRoleLabel(member.role)}</span>
          <select
            value={member.role}
            onChange={(event) => onRoleChange(member, event.target.value)}
            disabled={busy || isCurrentUser}
            className="rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-bold text-forest outline-none focus:border-leaf focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`Change role for ${member.email}`}
          >
            {memberRoles.map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}
          </select>
          <button
            type="button"
            onClick={() => onRemove(member)}
            disabled={busy || isCurrentUser || isAdmin}
            className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="mr-1.5" size={14} /> Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WorkspaceMembersPanel({ organizationId, currentUserId, backendReady, onChanged }) {
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('reviewer')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const adminCount = useMemo(() => members.filter((member) => member.role === 'admin').length, [members])

  async function loadMembers() {
    if (!backendReady || !organizationId) return
    setLoading(true)
    setErrorMessage('')
    const { members: loadedMembers, error } = await getWorkspaceMembers({ organizationId })
    setLoading(false)
    if (error) {
      setErrorMessage(error.message || 'Could not load workspace members.')
      return
    }
    setMembers(loadedMembers)
  }

  useEffect(() => {
    loadMembers()
  }, [organizationId, backendReady])

  async function handleAddMember(event) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!email.trim()) {
      setErrorMessage('Enter the email used by the member when they signed up.')
      return
    }

    setSaving(true)
    const { error } = await addWorkspaceMember({ organizationId, email, role })
    setSaving(false)

    if (error) {
      setErrorMessage(error.message || 'Could not add member. Ask the person to sign up first, then try again.')
      return
    }

    setEmail('')
    setRole('reviewer')
    setMessage('Member added.')
    await loadMembers()
    onChanged?.()
  }

  async function handleRoleChange(member, nextRole) {
    setMessage('')
    setErrorMessage('')

    if (member.role === 'admin' && nextRole !== 'admin' && adminCount <= 1) {
      setErrorMessage('Keep at least one admin in the workspace.')
      return
    }

    setSaving(true)
    const { error } = await updateWorkspaceMemberRole({ organizationId, membershipId: member.membership_id, role: nextRole })
    setSaving(false)

    if (error) {
      setErrorMessage(error.message || 'Could not update member role.')
      return
    }

    setMessage('Role updated.')
    await loadMembers()
    onChanged?.()
  }

  async function handleRemove(member) {
    const confirmed = window.confirm(`Remove ${member.email || 'this member'} from the workspace?`)
    if (!confirmed) return

    setMessage('')
    setErrorMessage('')
    setSaving(true)
    const { error } = await removeWorkspaceMember({ organizationId, membershipId: member.membership_id })
    setSaving(false)

    if (error) {
      setErrorMessage(error.message || 'Could not remove member.')
      return
    }

    setMessage('Member removed.')
    await loadMembers()
    onChanged?.()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4 text-sm leading-6 text-slate-600">
        <p className="font-extrabold text-ink">Add existing Niswarth AI users.</p>
        <p className="mt-1">Ask the person to sign up first, then add their email here. They can switch workspaces from the top bar.</p>
      </div>

      <form onSubmit={handleAddMember} className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label htmlFor="member-email" className="block text-sm font-extrabold text-ink">Member email</label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="reviewer.test@example.com"
              className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/40 px-4 py-3 text-sm text-slate-700 outline-none focus:border-leaf focus:ring-4 focus:ring-green-100"
            />
          </div>
          <div>
            <label htmlFor="member-role" className="block text-sm font-extrabold text-ink">Role</label>
            <select
              id="member-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-green-100 bg-green-50/40 px-4 py-3 text-sm font-bold text-forest outline-none focus:border-leaf focus:ring-4 focus:ring-green-100 lg:w-44"
            >
              {memberRoles.map((item) => <option key={item} value={item}>{getRoleLabel(item)}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving || loading}><UserPlus className="mr-2" size={18} /> Add Member</Button>
          <button type="button" onClick={loadMembers} disabled={saving || loading} className="inline-flex items-center rounded-full border border-green-200 px-4 py-2 text-sm font-bold text-forest hover:bg-green-50 disabled:opacity-50"><RefreshCw className="mr-2" size={16} /> Refresh</button>
        </div>
      </form>

      {errorMessage && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">{errorMessage}</div>}
      {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">{message}</div>}

      <section>
        <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink"><Users size={18} /> Workspace members</div>
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-green-100 bg-white p-4 text-sm text-slate-600">Loading members...</div>
          ) : members.length ? (
            members.map((member) => (
              <MemberRow key={member.membership_id} member={member} currentUserId={currentUserId} onRoleChange={handleRoleChange} onRemove={handleRemove} busy={saving || loading} />
            ))
          ) : (
            <div className="rounded-2xl border border-green-100 bg-white p-4 text-sm leading-6 text-slate-600">No workspace members found yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}
