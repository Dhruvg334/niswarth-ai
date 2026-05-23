import { useEffect, useMemo, useState } from 'react'
import { Activity, Database, FilePlus2, Plus, RefreshCw, ShieldCheck, Trash2, UserPlus, Users, WifiOff } from 'lucide-react'
import SectionHeader from '../components/common/SectionHeader.jsx'
import MetricCard from '../components/common/MetricCard.jsx'
import Button from '../components/common/Button.jsx'
import SlideOver from '../components/common/SlideOver.jsx'
import CampaignSelector from '../components/demo/CampaignSelector.jsx'
import ImpactReportGenerator from '../components/demo/ImpactReportGenerator.jsx'
import ReportsHistory from '../components/demo/ReportsHistory.jsx'
import CreateCampaignPanel from '../components/forms/CreateCampaignPanel.jsx'
import AddFieldUpdatePanel from '../components/forms/AddFieldUpdatePanel.jsx'
import AddVolunteerPanel from '../components/forms/AddVolunteerPanel.jsx'
import AssignVolunteerPanel from '../components/forms/AssignVolunteerPanel.jsx'
import { deleteCampaign, getCampaignsWithRelations } from '../services/campaignService.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { calculateGlobalMetrics, calculateQualityMetrics, calculateVolunteerMetrics } from '../utils/calculateMetrics.js'

export default function Demo() {
  const { workspace } = useAuth()
  const workspaceId = workspace?.id || null
  const workspaceRole = workspace?.role || 'viewer'
  const roleLabel = workspaceRole ? `${workspaceRole.charAt(0).toUpperCase()}${workspaceRole.slice(1)}` : 'Viewer'
  const isAdmin = workspaceRole === 'admin'
  const [campaigns, setCampaigns] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [source, setSource] = useState('loading')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [volunteerOpen, setVolunteerOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
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
      if (preferredId && result.campaigns.some((campaign) => campaign.id === preferredId)) return preferredId
      if (preserveSelection && currentId && result.campaigns.some((campaign) => campaign.id === currentId)) return currentId
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
    if (!campaign?.id || !isAdmin) return

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

  return (
    <div className="gradient-bg">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader eyebrow="Workflow dashboard" title="NGO workflow dashboard" description={workspace?.name ? `Workspace: ${workspace.name}. Your role: ${roleLabel}. Create campaigns, assign volunteers, collect field updates, review metrics, and prepare AI-assisted impact reports with human control.` : 'Create campaigns, assign volunteers, collect field updates, review metrics, and prepare AI-assisted impact reports with human control.'} />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-green-100 bg-white/80 p-4 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-slate-600">
              {backendReady ? <Database className="text-leaf" size={18} /> : <WifiOff className="text-amber-600" size={18} />}
              <p>
                {backendReady
                  ? `Connected to ${workspace?.name || 'your NGO workspace'} as ${roleLabel}. Campaigns, volunteers, updates, and report records are organization-scoped.`
                  : 'Using local fallback data. Add Supabase environment variables to connect live backend records.'}
              </p>
            </div>
            <button onClick={() => loadCampaigns({ preserveSelection: true })} className="inline-flex items-center gap-2 rounded-full border border-green-200 px-4 py-2 font-bold text-forest hover:bg-green-50">
              <RefreshCw size={16} /> Refresh data
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            {isAdmin && <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2" size={18} /> New Campaign</Button>}
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
                  <p className="font-extrabold text-ink">Starter workspace data has been added for testing.</p>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    Your workspace includes sample campaigns, volunteers, and field updates so you can test the workflow immediately. Admins can delete these campaigns and create their own records whenever they are ready.
                  </p>
                </div>
              </div>
              <button onClick={dismissStarterNotice} className="rounded-full border border-green-200 px-4 py-2 text-sm font-bold text-forest hover:bg-green-50">Got it</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-14 premium-card rounded-[2rem] p-8 text-center text-slate-600">
            Loading workflow records...
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="mt-14 premium-card rounded-[2rem] p-8 text-center text-slate-600">
            No campaigns found. Create the first campaign to begin the workflow.
          </div>
        )}

        {!loading && campaigns.length > 0 && campaign && (
          <>
            <div className="mt-14">
              <CampaignSelector campaigns={campaigns} selectedId={selectedId} onSelect={setSelectedId} />
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Active Campaigns" value={globalMetrics.activeCampaigns} helper="Backend records" />
              <MetricCard label="Volunteers Assigned" value={globalMetrics.volunteersAssigned} helper="Linked to campaigns" />
              <MetricCard label="Field Updates" value={globalMetrics.fieldUpdates} helper="Field records" />
              <MetricCard label="Reports Generated" value={globalMetrics.reportsGenerated} helper="Saved drafts" />
              <MetricCard label="Under Review" value={globalMetrics.reportsUnderReview} helper="Awaiting decision" />
              <MetricCard label="Needs Revision" value={globalMetrics.reportsNeedingRevision} helper="Quality control" />
              <MetricCard label="Reports Approved" value={globalMetrics.reportsApproved} helper="Human reviewed" />
              <MetricCard label="Pending Reviews" value={globalMetrics.pendingApprovals} helper="Review queue" />
            </div>

            <div className="mt-8 premium-card rounded-[2rem] p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-green-100 p-3 text-forest"><Users size={20} /></div>
                  <div>
                    <h2 className="display-font text-2xl font-black text-ink">Volunteer coordination</h2>
                    <p className="mt-1 text-sm text-slate-600">Track reusable volunteer profiles and campaign assignments.</p>
                  </div>
                </div>
                {isAdmin && <Button variant="secondary" onClick={() => setVolunteerOpen(true)}><UserPlus className="mr-2" size={18} /> Add Volunteer</Button>}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total volunteers</p>
                  <p className="mt-2 display-font text-3xl font-black text-forest">{volunteerMetrics.totalVolunteers}</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Free profiles</p>
                  <p className="mt-2 display-font text-3xl font-black text-forest">{volunteerMetrics.unassignedVolunteers}</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Available now</p>
                  <p className="mt-2 display-font text-3xl font-black text-forest">{volunteerMetrics.availableVolunteers}</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Can assign here</p>
                  <p className="mt-2 display-font text-3xl font-black text-forest">{volunteerMetrics.assignableToSelectedCampaign}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="premium-card rounded-[2rem] p-7 lg:col-span-1">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="display-font text-3xl font-extrabold text-ink">Campaign overview</h2>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Managed by {roleLabel}</p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleDeleteCampaign}
                      disabled={deletingCampaignId === campaign.id}
                      className="inline-flex items-center justify-center rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="mr-2" size={14} /> {deletingCampaignId === campaign.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
                <div className="mt-6 space-y-4 text-sm text-slate-600">
                  <p><span className="font-bold text-ink">Title:</span> {campaign.title}</p>
                  <p><span className="font-bold text-ink">Location:</span> {campaign.location}</p>
                  <p><span className="font-bold text-ink">Status:</span> {campaign.status}</p>
                  {campaign.goal && <p><span className="font-bold text-ink">Goal:</span> {campaign.goal}</p>}
                </div>
                <div className="mt-7 h-3 rounded-full bg-green-100">
                  <div className="h-3 rounded-full bg-leaf" style={{ width: `${campaign.completion}%` }} />
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500">Progress calculated from campaign status, field updates, volunteers, and report activity.</p>
              </div>

              <div className="premium-card rounded-[2rem] p-7 lg:col-span-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="display-font text-3xl font-extrabold text-ink">Assigned volunteers</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">People connected to this campaign and the role they play in the workflow.</p>
                  </div>
                  {isAdmin && <Button variant="secondary" onClick={() => setAssignOpen(true)}><Users className="mr-2" size={18} /> Assign Volunteer</Button>}
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {campaign.volunteers.length > 0 ? campaign.volunteers.map((volunteer) => (
                    <div key={volunteer.id || `${volunteer.name}-${volunteer.assignmentRole}`} className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">{volunteer.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{volunteer.assignmentRole}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-forest">{volunteer.availabilityLabel}</span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-500">Profile role: {volunteer.role}</p>
                      {volunteer.city && <p className="mt-1 text-xs font-semibold text-slate-500">{volunteer.city}</p>}
                      {volunteer.assignmentCount > 1 && (
                        <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                          Also active in {volunteer.assignmentCount - 1} other campaign{volunteer.assignmentCount - 1 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5 text-sm leading-6 text-slate-600">
                      No volunteers assigned yet. Admins can add volunteer profiles and assign them to this campaign.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <ImpactReportGenerator campaign={campaign} organizationId={workspaceId} onReportSaved={() => loadCampaigns({ preserveSelection: true })} />
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-2">
              <div className="premium-card rounded-[2rem] p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="display-font text-3xl font-extrabold text-ink">Field updates</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Evidence collected from volunteers and field teams for the selected campaign.</p>
                  </div>
                  {isAdmin && <Button variant="secondary" onClick={() => setUpdateOpen(true)}><FilePlus2 className="mr-2" size={18} /> Add Update</Button>}
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  {campaign.fieldUpdates?.length > 0 ? campaign.fieldUpdates.map((update, index) => (
                    <div key={update.id || `${update.update_text}-${index}`} className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-extrabold text-leaf">Update {index + 1}</p>
                        <p className="text-xs font-semibold text-slate-500">{update.location || campaign.location}</p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-700">{update.update_text}</p>
                      {update.submitted_by && <p className="mt-3 text-xs font-semibold text-slate-500">Submitted by {update.submitted_by}</p>}
                    </div>
                  )) : (
                    <p className="rounded-2xl border border-green-100 bg-green-50/70 p-5 text-sm text-slate-600">No field updates added yet. Report generation should be based on field evidence.</p>
                  )}
                </div>
              </div>
              <ReportsHistory reports={campaign.reports || []} />
            </div>

            <div className="mt-8 premium-card rounded-[2rem] p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-green-100 p-3 text-forest"><Activity size={20} /></div>
                  <div>
                    <h2 className="display-font text-2xl font-black text-ink">Workflow quality</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                      A compact check on evidence depth and review discipline. This stays below the main working areas so NGO users can focus first on action.
                    </p>
                  </div>
                </div>
                <p className="rounded-full bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-800">AI drafts remain human-reviewed</p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Updates / Campaign</p>
                  <p className="mt-2 display-font text-3xl font-black text-forest">{qualityMetrics.updatesPerCampaign}</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Approval Rate</p>
                  <p className="mt-2 display-font text-3xl font-black text-forest">{qualityMetrics.approvalRate}</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Review Queue</p>
                  <p className="mt-2 display-font text-3xl font-black text-forest">{qualityMetrics.reviewQueue}</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Needs Revision</p>
                  <p className="mt-2 display-font text-3xl font-black text-forest">{qualityMetrics.needsRevision}</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Evidence-Ready</p>
                  <p className="mt-2 display-font text-3xl font-black text-forest">{qualityMetrics.evidenceReadyCampaigns}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <SlideOver open={createOpen} title="Create campaign" description="Add a campaign record that can receive volunteers, field updates, and report drafts." onClose={() => setCreateOpen(false)}>
        <CreateCampaignPanel backendReady={backendReady} organizationId={workspaceId} onCreated={handleCampaignCreated} />
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
    </div>
  )
}
