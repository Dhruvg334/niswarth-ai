import { useEffect, useMemo, useState } from 'react'
import { Activity, BriefcaseBusiness, Database, FilePlus2, FolderOpen, Plus, RefreshCw, ShieldCheck, Trash2, UserCog, UserPlus, Users, WifiOff } from 'lucide-react'
import SectionHeader from '../components/common/SectionHeader.jsx'
import MetricCard from '../components/common/MetricCard.jsx'
import Button from '../components/common/Button.jsx'
import SlideOver from '../components/common/SlideOver.jsx'
import InfoHint from '../components/common/InfoHint.jsx'
import CampaignSelector from '../components/demo/CampaignSelector.jsx'
import ImpactReportGenerator from '../components/demo/ImpactReportGenerator.jsx'
import ReportsHistory from '../components/demo/ReportsHistory.jsx'
import CreateCampaignPanel from '../components/forms/CreateCampaignPanel.jsx'
import EditCampaignPanel from '../components/forms/EditCampaignPanel.jsx'
import AddFieldUpdatePanel from '../components/forms/AddFieldUpdatePanel.jsx'
import AddVolunteerPanel from '../components/forms/AddVolunteerPanel.jsx'
import AssignVolunteerPanel from '../components/forms/AssignVolunteerPanel.jsx'
import WorkspaceMembersPanel from '../components/demo/WorkspaceMembersPanel.jsx'
import { deleteCampaign, getCampaignsWithRelations } from '../services/campaignService.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { calculateGlobalMetrics, calculateQualityMetrics, calculateVolunteerMetrics } from '../utils/calculateMetrics.js'
import { getRoleLabel, getWorkspacePermissions } from '../utils/permissions.js'

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-green-50/60 px-4 py-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 display-font text-2xl font-black leading-none text-forest">{value}</p>
    </div>
  )
}

function SectionShell({ children, className = '' }) {
  return <div className={`premium-card rounded-[1.75rem] p-5 sm:p-6 ${className}`}>{children}</div>
}

function CampaignOverview({ campaign, roleLabel, permissions, onSwitchCampaign, onEdit, onDelete, deleting }) {
  return (
    <SectionShell className="h-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="display-font text-2xl font-black text-ink">Campaign overview</h2>
            <InfoHint label="The active campaign for the dashboard. Switch campaigns when you want to view another workstream." />
          </div>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">{campaign.type} · {roleLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSwitchCampaign}
            className="inline-flex items-center justify-center rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-extrabold text-forest transition hover:bg-green-50"
          >
            <FolderOpen className="mr-2" size={14} /> Switch campaign
          </button>
          {permissions.canEditCampaigns && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center justify-center rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-extrabold text-forest transition hover:bg-green-50"
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="mr-2" size={14} /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-green-100 bg-green-50/55 p-4 sm:col-span-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Campaign</p>
          <p className="mt-1 font-bold leading-6 text-ink">{campaign.title}</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-white/80 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Location</p>
          <p className="mt-1 font-bold text-ink">{campaign.location}</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-white/80 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-1 font-bold text-ink">{campaign.status}</p>
        </div>
        {campaign.goal && (
          <p className="rounded-2xl border border-green-100 bg-white/80 p-4 leading-6 sm:col-span-2">
            <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">Goal</span>
            <span className="mt-1 block text-sm text-slate-700">{campaign.goal}</span>
          </p>
        )}
      </div>

      <div className="mt-5 h-2.5 rounded-full bg-green-100">
        <div className="h-2.5 rounded-full bg-leaf" style={{ width: `${campaign.completion}%` }} />
      </div>
      <p className="mt-3 text-xs font-medium leading-5 text-slate-500">Progress combines status, field updates, volunteers, and report activity.</p>
    </SectionShell>
  )
}

function VolunteerPoolPanel({ volunteers, campaigns, selectedCampaignId, volunteerMetrics, permissions, onAddVolunteer, onAssignVolunteer }) {
  const assignmentsByVolunteer = new Map()
  campaigns.forEach((campaign) => {
    campaign.volunteers?.forEach((volunteer) => {
      const key = volunteer.id || volunteer.name
      const current = assignmentsByVolunteer.get(key) || []
      current.push({ campaignId: campaign.id, title: campaign.title, role: volunteer.assignmentRole })
      assignmentsByVolunteer.set(key, current)
    })
  })

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniStat label="Total profiles" value={volunteerMetrics.totalVolunteers} />
        <MiniStat label="Available now" value={volunteerMetrics.availableVolunteers} />
        <MiniStat label="Free profiles" value={volunteerMetrics.unassignedVolunteers} />
        <MiniStat label="Can assign here" value={volunteerMetrics.assignableToSelectedCampaign} />
      </div>

      {permissions.canManageVolunteers && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onAssignVolunteer} className="w-full sm:w-auto"><Users className="mr-2" size={18} /> Assign to campaign</Button>
          <Button variant="secondary" onClick={onAddVolunteer} className="w-full sm:w-auto"><UserPlus className="mr-2" size={18} /> Add profile</Button>
        </div>
      )}

      <div className="space-y-3">
        {volunteers.length > 0 ? volunteers.map((volunteer) => {
          const assignments = assignmentsByVolunteer.get(volunteer.id || volunteer.name) || []
          const assignedHere = assignments.some((assignment) => assignment.campaignId === selectedCampaignId)
          return (
            <div key={volunteer.id || volunteer.name} className="rounded-[1.25rem] border border-green-100 bg-green-50/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-ink">{volunteer.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{volunteer.role}</p>
                  {volunteer.city && <p className="mt-1 text-xs font-bold text-slate-500">{volunteer.city}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${assignedHere ? 'bg-green-100 text-forest' : 'bg-white text-slate-500'}`}>
                  {assignedHere ? 'Assigned here' : volunteer.availabilityLabel || volunteer.availability || 'Profile'}
                </span>
              </div>
              <div className="mt-3 border-t border-green-100 pt-3">
                {assignments.length > 0 ? (
                  <div className="space-y-2">
                    {assignments.slice(0, 3).map((assignment) => (
                      <p key={`${assignment.campaignId}-${assignment.role}`} className="text-xs font-semibold leading-5 text-slate-600">
                        {assignment.title} · {assignment.role}
                      </p>
                    ))}
                    {assignments.length > 3 && <p className="text-xs font-bold text-slate-500">+{assignments.length - 3} more assignment{assignments.length - 3 > 1 ? 's' : ''}</p>}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-500">Not assigned to any campaign yet.</p>
                )}
              </div>
            </div>
          )
        }) : (
          <div className="rounded-[1.25rem] border border-green-100 bg-green-50/60 p-5 text-sm leading-6 text-slate-600">
            No volunteer profiles yet. Add profiles first, then assign them to campaign work.
          </div>
        )}
      </div>
    </div>
  )
}

function AssignedVolunteers({ campaign, permissions, onOpenVolunteerDrawer }) {
  const updates = campaign.fieldUpdates || []

  return (
    <SectionShell className="h-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="display-font text-2xl font-black text-ink">Assigned volunteers</h2>
            <InfoHint label="People currently linked to this campaign, with the number of updates connected to each name." />
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">People active on this campaign.</p>
        </div>
        {permissions.canManageVolunteers && <Button variant="secondary" onClick={onOpenVolunteerDrawer}><Users className="mr-2" size={18} /> Manage</Button>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {campaign.volunteers.length > 0 ? campaign.volunteers.map((volunteer) => {
          const updateCount = updates.filter((update) => (update.submitted_by || '').trim().toLowerCase() === volunteer.name.trim().toLowerCase()).length
          return (
            <div key={volunteer.id || `${volunteer.name}-${volunteer.assignmentRole}`} className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{volunteer.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{volunteer.assignmentRole}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-forest">{volunteer.availabilityLabel}</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">Profile role: {volunteer.role}</p>
              {volunteer.city && <p className="mt-1 text-xs font-semibold text-slate-500">{volunteer.city}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-600">{updateCount} update{updateCount === 1 ? '' : 's'}</span>
                {volunteer.assignmentCount > 1 && (
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                    Also in {volunteer.assignmentCount - 1} other campaign{volunteer.assignmentCount - 1 > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )
        }) : (
          <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5 text-sm leading-6 text-slate-600 sm:col-span-2">
            No volunteers assigned yet. Admins and coordinators can manage the volunteer pool and assign people to this campaign.
          </div>
        )}
      </div>
    </SectionShell>
  )
}

function FieldUpdates({ campaign, permissions, onAddUpdate }) {
  return (
    <SectionShell className="h-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="display-font text-2xl font-black text-ink">Field updates</h2>
            <InfoHint label="Field notes are the evidence used for report drafts. Add specific, verified updates before generating reports." />
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">Evidence notes for this campaign.</p>
        </div>
        {permissions.canAddFieldUpdates && <Button variant="secondary" onClick={onAddUpdate}><FilePlus2 className="mr-2" size={18} /> Add Update</Button>}
      </div>

      <div className="mt-4 grid gap-3">
        {campaign.fieldUpdates?.length > 0 ? campaign.fieldUpdates.map((update, index) => (
          <div key={update.id || `${update.update_text}-${index}`} className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-extrabold text-leaf">Update {index + 1}</p>
              <p className="text-xs font-semibold text-slate-500">{update.location || campaign.location}</p>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-700">{update.update_text}</p>
            {update.submitted_by && <p className="mt-3 text-xs font-semibold text-slate-500">Submitted by {update.submitted_by}</p>}
          </div>
        )) : (
          <p className="rounded-2xl border border-green-100 bg-green-50/70 p-5 text-sm leading-6 text-slate-600">No field updates added yet. Report generation should be based on field evidence.</p>
        )}
      </div>
    </SectionShell>
  )
}

export default function Demo() {
  const { workspace, user, refreshWorkspace } = useAuth()
  const workspaceId = workspace?.id || null
  const workspaceRole = workspace?.role || 'viewer'
  const roleLabel = getRoleLabel(workspaceRole)
  const permissions = useMemo(() => getWorkspacePermissions(workspaceRole), [workspaceRole])
  const [campaigns, setCampaigns] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [source, setSource] = useState('loading')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [campaignDrawerOpen, setCampaignDrawerOpen] = useState(false)
  const [volunteerPoolOpen, setVolunteerPoolOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [volunteerOpen, setVolunteerOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [actionNotice, setActionNotice] = useState('')
  const [starterNoticeVisible, setStarterNoticeVisible] = useState(false)
  const [deletingCampaignId, setDeletingCampaignId] = useState(null)

  async function loadCampaigns({ preserveSelection = false, preferredId = null } = {}) {
    setLoading(true)
    const result = await getCampaignsWithRelations({ organizationId: workspaceId })
    setCampaigns(result.campaigns)
    setVolunteers(result.volunteers || [])
    setSource(result.source)
    setErrorMessage(result.error?.message || '')
    setSelectedId((currentId) => {
      if (preferredId && result.campaigns.some((item) => item.id === preferredId)) return preferredId
      if (preserveSelection && currentId && result.campaigns.some((item) => item.id === currentId)) return currentId
      return result.campaigns[0]?.id || null
    })
    setLoading(false)
  }

  useEffect(() => {
    loadCampaigns()
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) {
      setStarterNoticeVisible(false)
      return
    }

    const noticeKey = `niswarth-starter-notice-${workspaceId}`
    const dismissed = window.localStorage.getItem(noticeKey)

    if (dismissed === 'dismissed') {
      setStarterNoticeVisible(false)
      return
    }

    setStarterNoticeVisible(true)
    window.localStorage.setItem(noticeKey, 'dismissed')
  }, [workspaceId])

  const campaign = useMemo(() => campaigns.find((item) => item.id === selectedId), [campaigns, selectedId])
  const globalMetrics = useMemo(() => calculateGlobalMetrics(campaigns), [campaigns])
  const qualityMetrics = useMemo(() => calculateQualityMetrics(campaigns), [campaigns])
  const volunteerMetrics = useMemo(() => calculateVolunteerMetrics(volunteers, campaigns, selectedId), [volunteers, campaigns, selectedId])
  const backendReady = source === 'supabase'

  async function handleCampaignCreated(createdCampaign) {
    setCreateOpen(false)
    setActionNotice('Campaign created and synced with Supabase.')
    await loadCampaigns({ preferredId: createdCampaign?.id })
  }

  async function handleCampaignUpdated(updatedCampaign) {
    setEditOpen(false)
    setActionNotice('Campaign details updated.')
    await loadCampaigns({ preferredId: updatedCampaign?.id || campaign?.id, preserveSelection: true })
  }

  async function handleFieldUpdateCreated() {
    setUpdateOpen(false)
    setActionNotice('Field update saved. Report drafts can now use this evidence.')
    await loadCampaigns({ preserveSelection: true })
  }

  async function handleVolunteerCreated() {
    setVolunteerOpen(false)
    setActionNotice('Volunteer profile created. You can now assign this person to a campaign.')
    await loadCampaigns({ preserveSelection: true })
  }

  async function handleVolunteerAssigned() {
    setAssignOpen(false)
    setActionNotice('Volunteer assigned to the selected campaign.')
    await loadCampaigns({ preserveSelection: true })
  }

  function dismissStarterNotice() {
    if (workspaceId) window.localStorage.setItem(`niswarth-starter-notice-${workspaceId}`, 'dismissed')
    setStarterNoticeVisible(false)
  }

  async function handleDeleteCampaign() {
    if (!campaign?.id || !permissions.canDeleteCampaigns) return

    const confirmed = window.confirm(`Delete "${campaign.title}"? This will also remove its field updates, volunteer assignments, and report history from this workspace.`)
    if (!confirmed) return

    setDeletingCampaignId(campaign.id)
    setActionNotice('')
    setErrorMessage('')

    const { error } = await deleteCampaign({ organizationId: workspaceId, campaignId: campaign.id })

    setDeletingCampaignId(null)

    if (error) {
      setErrorMessage(error.message || 'Unable to delete campaign.')
      return
    }

    setActionNotice('Campaign deleted. Related updates, assignments, and reports were removed from this workspace.')
    await loadCampaigns({ preserveSelection: false })
  }

  function selectCampaignFromDrawer(campaignId) {
    setSelectedId(campaignId)
    setCampaignDrawerOpen(false)
  }

  return (
    <div className="gradient-bg">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <SectionHeader title="NGO workflow dashboard" description={workspace?.name ? `${workspace.name} · ${roleLabel}. Manage campaign work, field evidence, and reviewed impact reports.` : 'Manage campaign work, field evidence, and reviewed impact reports.'} />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-green-100 bg-white/80 p-4 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-slate-600">
              {backendReady ? <Database className="text-leaf" size={18} /> : <WifiOff className="text-amber-600" size={18} />}
              <p>
                {backendReady
                  ? `Connected as ${roleLabel}. Data shown here belongs to the selected workspace.`
                  : 'Using local fallback data. Connect Supabase to work with live records.'}
              </p>
            </div>
            <button onClick={() => loadCampaigns({ preserveSelection: true })} className="inline-flex items-center gap-2 rounded-full border border-green-200 px-4 py-2 font-bold text-forest hover:bg-green-50">
              <RefreshCw size={16} /> Refresh data
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            {permissions.canManageMembers && <Button variant="secondary" onClick={() => setMembersOpen(true)}><UserCog className="mr-2" size={18} /> Members</Button>}
            {permissions.canCreateCampaigns && <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2" size={18} /> New Campaign</Button>}
          </div>
        </div>

        {!backendReady && (
          <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Creation forms require Supabase. The dashboard remains usable with local fallback records for visual review.
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Backend connection warning: {errorMessage}
          </div>
        )}

        {actionNotice && (
          <div className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <p>{actionNotice}</p>
          </div>
        )}

        {starterNoticeVisible && backendReady && (
          <div className="mt-4 rounded-[1.5rem] border border-green-200 bg-white/90 p-5 shadow-soft">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-1 shrink-0 text-leaf" />
                <div>
                  <p className="font-extrabold text-ink">Starter data is ready.</p>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    Sample campaigns, volunteers, and field updates are available so you can test the workflow quickly. Admins can replace them with real records anytime.
                  </p>
                </div>
              </div>
              <button onClick={dismissStarterNotice} className="rounded-full border border-green-200 px-4 py-2 text-sm font-bold text-forest hover:bg-green-50">Got it</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-12 premium-card rounded-[2rem] p-8 text-center text-slate-600">
            Loading workflow records...
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="mt-12 premium-card rounded-[2rem] p-8 text-center text-slate-600">
            No campaigns yet. Admins can create the first campaign to start the workflow.
          </div>
        )}

        {!loading && campaigns.length > 0 && campaign && (
          <>
            <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
              <CampaignOverview
                campaign={campaign}
                roleLabel={roleLabel}
                permissions={permissions}
                onSwitchCampaign={() => setCampaignDrawerOpen(true)}
                onEdit={() => setEditOpen(true)}
                onDelete={handleDeleteCampaign}
                deleting={deletingCampaignId === campaign.id}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard label="Campaigns" value={globalMetrics.activeCampaigns} helper="Active now" compact />
                <MetricCard label="Volunteers" value={globalMetrics.volunteersAssigned} helper="Assigned" compact />
                <MetricCard label="Field Updates" value={globalMetrics.fieldUpdates} helper="Evidence items" compact />
                <MetricCard label="Pending Reviews" value={globalMetrics.pendingApprovals} helper="Need decision" compact />
              </div>
            </div>

            {permissions.canManageVolunteers && (
              <div className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-green-100 bg-white/80 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-green-100 p-3 text-forest"><BriefcaseBusiness size={20} /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="display-font text-xl font-black text-ink">Volunteer coordination</h2>
                      <InfoHint align="left" label="Open the volunteer pool to see profiles, availability, and current assignments." />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Manage volunteer profiles and assignments from one drawer.</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setVolunteerPoolOpen(true)}><Users className="mr-2" size={18} /> Open Volunteer Pool</Button>
              </div>
            )}

            <div className="mt-6 grid gap-6 xl:grid-cols-2 xl:items-start">
              <AssignedVolunteers campaign={campaign} permissions={permissions} onOpenVolunteerDrawer={() => setVolunteerPoolOpen(true)} />
              <FieldUpdates campaign={campaign} permissions={permissions} onAddUpdate={() => setUpdateOpen(true)} />
            </div>

            <div className="mt-7">
              <ImpactReportGenerator campaign={campaign} organizationId={workspaceId} permissions={permissions} onReportSaved={() => loadCampaigns({ preserveSelection: true })} />
            </div>

            <div className="mt-7 grid gap-6 xl:grid-cols-[0.85fr_1.15fr] xl:items-start">
              <SectionShell>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-green-100 p-3 text-forest"><Activity size={20} /></div>
                    <div>
                      <div className="flex items-center gap-2"><h2 className="display-font text-xl font-black text-ink">Workflow quality</h2><InfoHint label="Quick indicators for evidence depth and review follow-through across the workspace." /></div>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Evidence and review health across this workspace.</p>
                    </div>
                  </div>
                  <p className="rounded-full bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-800">Human-reviewed AI drafts</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Updates / campaign" value={qualityMetrics.updatesPerCampaign} />
                  <MiniStat label="Approval rate" value={qualityMetrics.approvalRate} />
                  <MiniStat label="Review queue" value={qualityMetrics.reviewQueue} />
                  <MiniStat label="Needs revision" value={qualityMetrics.needsRevision} />
                  <MiniStat label="Evidence-ready" value={qualityMetrics.evidenceReadyCampaigns} />
                </div>
              </SectionShell>

              <ReportsHistory reports={campaign.reports || []} canReviewReports={permissions.canReviewReports} onReportStatusChanged={() => loadCampaigns({ preserveSelection: true })} />
            </div>
          </>
        )}
      </section>

      <SlideOver open={campaignDrawerOpen} title="Switch campaign" description="Select the campaign you want to work on in this workspace." onClose={() => setCampaignDrawerOpen(false)}>
        <CampaignSelector campaigns={campaigns} selectedId={selectedId} onSelect={selectCampaignFromDrawer} />
      </SlideOver>

      <SlideOver open={volunteerPoolOpen} title="Volunteer pool" description="Review volunteer profiles, availability, and where people are currently assigned." onClose={() => setVolunteerPoolOpen(false)}>
        <VolunteerPoolPanel
          volunteers={volunteers}
          campaigns={campaigns}
          selectedCampaignId={selectedId}
          volunteerMetrics={volunteerMetrics}
          permissions={permissions}
          onAssignVolunteer={() => {
            setVolunteerPoolOpen(false)
            setAssignOpen(true)
          }}
          onAddVolunteer={() => {
            setVolunteerPoolOpen(false)
            setVolunteerOpen(true)
          }}
        />
      </SlideOver>

      <SlideOver open={createOpen} title="Create campaign" description="Add a campaign record that can receive volunteers, field updates, and report drafts." onClose={() => setCreateOpen(false)}>
        <CreateCampaignPanel backendReady={backendReady} organizationId={workspaceId} onCreated={handleCampaignCreated} />
      </SlideOver>

      <SlideOver open={editOpen} title="Edit campaign" description="Update campaign details without changing its volunteers, field updates, or reports." onClose={() => setEditOpen(false)}>
        <EditCampaignPanel campaign={campaign} backendReady={backendReady} organizationId={workspaceId} onUpdated={handleCampaignUpdated} onCancel={() => setEditOpen(false)} />
      </SlideOver>

      <SlideOver open={updateOpen} title="Add field update" description="Capture verified field evidence before generating impact reports." onClose={() => setUpdateOpen(false)}>
        <AddFieldUpdatePanel campaign={campaign} backendReady={backendReady} organizationId={workspaceId} onCreated={handleFieldUpdateCreated} />
      </SlideOver>

      <SlideOver open={volunteerOpen} title="Add volunteer" description="Create a reusable volunteer profile before assigning them to a campaign." onClose={() => setVolunteerOpen(false)}>
        <AddVolunteerPanel backendReady={backendReady} organizationId={workspaceId} onCreated={handleVolunteerCreated} />
      </SlideOver>

      <SlideOver open={assignOpen} title="Assign volunteer" description="Link an existing volunteer to the selected campaign with a clear assignment role." onClose={() => setAssignOpen(false)}>
        <AssignVolunteerPanel campaign={campaign} volunteers={volunteers} backendReady={backendReady} onAssigned={handleVolunteerAssigned} />
      </SlideOver>

      <SlideOver open={membersOpen} title="Workspace members" description="Add existing users to this workspace and assign simple roles." onClose={() => setMembersOpen(false)}>
        <WorkspaceMembersPanel organizationId={workspaceId} currentUserId={user?.id} backendReady={backendReady} onChanged={refreshWorkspace} />
      </SlideOver>
    </div>
  )
}
