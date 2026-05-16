import { useEffect, useMemo, useState } from 'react'
import { Database, RefreshCw, WifiOff } from 'lucide-react'
import SectionHeader from '../components/common/SectionHeader.jsx'
import MetricCard from '../components/common/MetricCard.jsx'
import CampaignSelector from '../components/demo/CampaignSelector.jsx'
import ImpactReportGenerator from '../components/demo/ImpactReportGenerator.jsx'
import { getCampaignsWithRelations } from '../services/campaignService.js'
import { calculateGlobalMetrics } from '../utils/calculateMetrics.js'

export default function Demo() {
  const [campaigns, setCampaigns] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [source, setSource] = useState('loading')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadCampaigns({ preserveSelection = false } = {}) {
    setLoading(true)
    const result = await getCampaignsWithRelations()
    setCampaigns(result.campaigns)
    setSource(result.source)
    setErrorMessage(result.error?.message || '')
    setSelectedId((currentId) => {
      if (preserveSelection && currentId && result.campaigns.some((campaign) => campaign.id === currentId)) {
        return currentId
      }
      return result.campaigns[0]?.id || null
    })
    setLoading(false)
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  const campaign = useMemo(() => campaigns.find((item) => item.id === selectedId), [campaigns, selectedId])
  const globalMetrics = useMemo(() => calculateGlobalMetrics(campaigns), [campaigns])

  return (
    <div className="gradient-bg">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader eyebrow="Workflow dashboard" title="NGO workflow dashboard" description="Select a campaign to see how volunteers, field updates, metrics, and AI-assisted impact reporting can work together." />

        <div className="mt-8 flex flex-col gap-3 rounded-[1.5rem] border border-green-100 bg-white/80 p-4 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-slate-600">
            {source === 'supabase' ? <Database className="text-leaf" size={18} /> : <WifiOff className="text-amber-600" size={18} />}
            <p>
              {source === 'supabase'
                ? 'Connected to Supabase backend. Campaigns, updates, and report records are loaded from the database.'
                : 'Using local fallback data. Add Supabase environment variables to connect live backend records.'}
            </p>
          </div>
          <button onClick={() => loadCampaigns({ preserveSelection: true })} className="inline-flex items-center gap-2 rounded-full border border-green-200 px-4 py-2 font-bold text-forest hover:bg-green-50">
            <RefreshCw size={16} /> Refresh data
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Backend connection warning: {errorMessage}
          </div>
        )}

        {loading && (
          <div className="mt-14 premium-card rounded-[2rem] p-8 text-center text-slate-600">
            Loading workflow records...
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="mt-14 premium-card rounded-[2rem] p-8 text-center text-slate-600">
            No campaigns found. Add seed data in Supabase or create campaign records in the next milestone.
          </div>
        )}

        {!loading && campaigns.length > 0 && campaign && (
          <>
            <div className="mt-14">
              <CampaignSelector campaigns={campaigns} selectedId={selectedId} onSelect={setSelectedId} />
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
              <MetricCard label="Active Campaigns" value={globalMetrics.activeCampaigns} helper="Backend records" />
              <MetricCard label="Volunteers Assigned" value={globalMetrics.volunteersAssigned} helper="Linked to campaigns" />
              <MetricCard label="Field Updates" value={globalMetrics.fieldUpdates} helper="Field records" />
              <MetricCard label="Reports Generated" value={globalMetrics.reportsGenerated} helper="Saved drafts" />
              <MetricCard label="Reports Approved" value={globalMetrics.reportsApproved} helper="Human reviewed" />
              <MetricCard label="Pending Reviews" value={globalMetrics.pendingApprovals} helper="Review queue" />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="premium-card rounded-[2rem] p-7 lg:col-span-1">
                <h2 className="display-font text-3xl font-extrabold text-ink">Campaign overview</h2>
                <div className="mt-6 space-y-4 text-sm text-slate-600">
                  <p><span className="font-bold text-ink">Title:</span> {campaign.title}</p>
                  <p><span className="font-bold text-ink">Location:</span> {campaign.location}</p>
                  <p><span className="font-bold text-ink">Status:</span> {campaign.status}</p>
                  {campaign.goal && <p><span className="font-bold text-ink">Goal:</span> {campaign.goal}</p>}
                </div>
                <div className="mt-7 h-3 rounded-full bg-green-100">
                  <div className="h-3 rounded-full bg-leaf" style={{ width: `${campaign.completion}%` }} />
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500">Progress calculated from campaign status, field updates, and report activity.</p>
              </div>

              <div className="premium-card rounded-[2rem] p-7 lg:col-span-2">
                <h2 className="display-font text-3xl font-extrabold text-ink">Assigned volunteers</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {campaign.volunteers.length > 0 ? campaign.volunteers.map((volunteer) => (
                    <div key={`${volunteer.name}-${volunteer.role}`} className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                      <p className="font-bold text-ink">{volunteer.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{volunteer.role}</p>
                      {volunteer.city && <p className="mt-2 text-xs font-semibold text-slate-500">{volunteer.city}</p>}
                    </div>
                  )) : (
                    <p className="rounded-2xl border border-green-100 bg-green-50/70 p-5 text-sm text-slate-600">No volunteers assigned yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="premium-card rounded-[2rem] p-7">
                <h2 className="display-font text-3xl font-extrabold text-ink">Field updates</h2>
                <div className="mt-6 space-y-4">
                  {campaign.updates.length > 0 ? campaign.updates.map((update, index) => (
                    <div key={`${update}-${index}`} className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                      <p className="text-xs font-extrabold text-leaf">Update {index + 1}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">{update}</p>
                    </div>
                  )) : (
                    <p className="rounded-2xl border border-green-100 bg-green-50/70 p-5 text-sm text-slate-600">No field updates added yet. Report generation should be based on field evidence.</p>
                  )}
                </div>
              </div>
              <ImpactReportGenerator campaign={campaign} onReportSaved={() => loadCampaigns({ preserveSelection: true })} />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
