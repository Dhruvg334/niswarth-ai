import { useEffect, useMemo, useState } from 'react'
import { Building2, ClipboardCheck, FileText, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getCampaignsWithRelations } from '../services/campaignService.js'
import { getWorkspaceMembers } from '../services/memberService.js'

function roleLabel(role = '') {
  return role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : 'Member'
}

function groupMembers(members) {
  return members.reduce((groups, member) => {
    const role = member.role || 'reviewer'
    if (!groups[role]) groups[role] = []
    groups[role].push(member)
    return groups
  }, { admin: [], coordinator: [], reviewer: [] })
}

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-[1.5rem] border border-green-100 bg-white/90 p-5 shadow-[0_18px_50px_-42px_rgba(20,83,45,0.55)]">
      <p className="text-3xl font-black tabular-nums text-forest">{value}</p>
      <p className="mt-2 text-sm font-black text-ink">{label}</p>
      {helper && <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{helper}</p>}
    </div>
  )
}

function MemberList({ title, members }) {
  return (
    <section className="rounded-[1.75rem] border border-green-100 bg-white/90 p-6 shadow-[0_20px_55px_-44px_rgba(20,83,45,0.55)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-ink">{title}</h2>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-forest">{members.length}</span>
      </div>
      <div className="mt-5 space-y-3">
        {members.length > 0 ? members.map((member) => (
          <div key={member.membership_id || member.id || member.email} className="rounded-2xl bg-green-50/65 p-4">
            <p className="font-black text-ink">{member.full_name || member.email || 'Workspace member'}</p>
            <p className="mt-1 text-sm leading-5 text-slate-600">{member.email || 'Email not available'}</p>
          </div>
        )) : (
          <p className="rounded-2xl bg-green-50/65 p-4 text-sm leading-6 text-slate-600">No members listed in this role yet.</p>
        )}
      </div>
    </section>
  )
}

export default function Organisation() {
  const { workspace, workspaces, workspaceLoading } = useAuth()
  const [members, setMembers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadOrganisationData() {
      if (!workspace?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const [membersResult, campaignsResult] = await Promise.all([
        getWorkspaceMembers({ organizationId: workspace.id }),
        getCampaignsWithRelations({ organizationId: workspace.id }),
      ])

      if (!active) return

      if (membersResult.error || campaignsResult.error) {
        setError(membersResult.error?.message || campaignsResult.error?.message || 'Organisation details could not be loaded.')
      }

      setMembers(membersResult.members || [])
      setCampaigns(campaignsResult.campaigns || [])
      setVolunteers(campaignsResult.volunteers || [])
      setLoading(false)
    }

    loadOrganisationData()

    return () => {
      active = false
    }
  }, [workspace?.id])

  const memberGroups = useMemo(() => groupMembers(members), [members])
  const reportCount = campaigns.reduce((total, campaign) => total + (campaign.reports?.length || 0), 0)
  const activeCampaigns = campaigns.filter((campaign) => ['active', 'in_progress', 'planning'].includes(campaign.rawStatus)).length

  if (workspaceLoading || loading) {
    return (
      <section className="gradient-bg py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-green-100 bg-white/90 p-8 shadow-soft">
            <p className="font-bold text-forest">Loading organisation overview...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!workspace?.id) {
    return (
      <section className="gradient-bg py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="display-font text-5xl font-black tracking-[-0.055em] text-ink">No organisation selected.</h1>
          <p className="mt-5 text-base leading-8 text-slate-600">Create or switch into a workspace to view organisation details.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="gradient-bg pb-20 pt-20 lg:pb-24 lg:pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-full border border-green-200 bg-white/90 px-4 py-2 text-sm font-bold text-forest shadow-sm">Organisation overview</p>
            <h1 className="display-font mt-6 text-5xl font-black leading-[1] tracking-[-0.055em] text-ink md:text-6xl">{workspace.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">An information center for the selected workspace, its roles, volunteers, campaigns, and report activity.</p>
          </div>
          <div className="rounded-[2rem] border border-green-100 bg-white/90 p-6 shadow-[0_26px_80px_-54px_rgba(20,83,45,0.6)]">
            <div className="flex items-center gap-3 text-forest"><Building2 size={22} /><p className="font-black">Current workspace</p></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-green-50/70 p-4">
                <p className="text-xs font-bold text-slate-500">Your role</p>
                <p className="mt-1 text-lg font-black text-ink">{roleLabel(workspace.role)}</p>
              </div>
              <div className="rounded-2xl bg-green-50/70 p-4">
                <p className="text-xs font-bold text-slate-500">Workspace city</p>
                <p className="mt-1 text-lg font-black text-ink">{workspace.city || 'Not specified'}</p>
              </div>
            </div>
            {workspaces?.length > 1 && <p className="mt-4 text-sm leading-6 text-slate-500">Use the workspace switcher in the navbar to view another organisation.</p>}
          </div>
        </div>

        {error && <p className="mt-8 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</p>}

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Campaigns" value={campaigns.length} helper={`${activeCampaigns} active or planning`} />
          <StatCard label="Volunteers" value={volunteers.length} helper="Profiles in this workspace" />
          <StatCard label="Members" value={members.length} helper="Admins, coordinators, reviewers" />
          <StatCard label="Reports" value={reportCount} helper="Drafts, reviews, approvals" />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <MemberList title="Admins" members={memberGroups.admin || []} />
          <MemberList title="Coordinators" members={memberGroups.coordinator || []} />
          <MemberList title="Reviewers" members={memberGroups.reviewer || []} />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] border border-green-100 bg-white/90 p-6 shadow-[0_20px_65px_-50px_rgba(20,83,45,0.6)] md:p-8">
            <div className="flex items-center gap-3 text-forest"><ClipboardCheck size={22} /><h2 className="text-xl font-black text-ink">Recent campaign activity</h2></div>
            <div className="mt-6 space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="rounded-2xl border border-green-100 bg-green-50/55 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-black text-ink">{campaign.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-forest">{campaign.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{campaign.location || 'No location'} · {campaign.fieldUpdates?.length || 0} updates · {campaign.reports?.length || 0} reports</p>
                </div>
              ))}
              {!campaigns.length && <p className="rounded-2xl bg-green-50/65 p-4 text-sm leading-6 text-slate-600">No campaigns have been created in this workspace yet.</p>}
            </div>
          </section>

          <section className="rounded-[2rem] border border-green-100 bg-forest p-6 text-white shadow-[0_20px_65px_-50px_rgba(20,83,45,0.75)] md:p-8">
            <div className="flex items-center gap-3"><ShieldCheck size={22} /><h2 className="text-xl font-black">What this page is for</h2></div>
            <p className="mt-5 text-sm leading-7 text-green-50/80">This page is an information center for the selected organisation. It shows structure, roles, campaign activity, and reporting context.</p>
            <p className="mt-4 text-sm leading-7 text-green-50/80">Member changes, role edits, and campaign operations stay inside the dashboard so this page remains clean and read-only.</p>
          </section>
        </div>
      </div>
    </section>
  )
}
