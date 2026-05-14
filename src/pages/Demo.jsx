import { useMemo, useState } from 'react'
import SectionHeader from '../components/common/SectionHeader.jsx'
import MetricCard from '../components/common/MetricCard.jsx'
import CampaignSelector from '../components/demo/CampaignSelector.jsx'
import ImpactReportGenerator from '../components/demo/ImpactReportGenerator.jsx'
import { campaigns } from '../data/campaigns.js'

export default function Demo() {
  const [selectedId, setSelectedId] = useState(campaigns[0].id)
  const campaign = useMemo(() => campaigns.find((item) => item.id === selectedId), [selectedId])

  return (
    <div className="gradient-bg">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader eyebrow="Workflow dashboard" title="NGO workflow dashboard" description="Select a campaign to see how volunteers, field updates, metrics, and AI-assisted impact reporting can work together." />

        <div className="mt-14">
          <CampaignSelector campaigns={campaigns} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Volunteers Assigned" value={campaign.metrics.volunteersAssigned} helper="Campaign record" />
          <MetricCard label="Field Updates" value={campaign.metrics.fieldUpdates} helper="Field records" />
          <MetricCard label="Events Completed" value={campaign.metrics.eventsCompleted} helper="Planned activities" />
          <MetricCard label="Pending Approvals" value={campaign.metrics.pendingApprovals} helper="Human review" />
          <MetricCard label="Completion" value={`${campaign.completion}%`} helper="Campaign progress" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="premium-card rounded-[2rem] p-7 lg:col-span-1">
            <h2 className="display-font text-3xl font-extrabold text-ink">Campaign overview</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <p><span className="font-bold text-ink">Title:</span> {campaign.title}</p>
              <p><span className="font-bold text-ink">Location:</span> {campaign.location}</p>
              <p><span className="font-bold text-ink">Status:</span> {campaign.status}</p>
            </div>
            <div className="mt-7 h-3 rounded-full bg-green-100">
              <div className="h-3 rounded-full bg-leaf" style={{ width: `${campaign.completion}%` }} />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">Progress shown from the current campaign record.</p>
          </div>

          <div className="premium-card rounded-[2rem] p-7 lg:col-span-2">
            <h2 className="display-font text-3xl font-extrabold text-ink">Assigned volunteers</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {campaign.volunteers.map((volunteer) => (
                <div key={volunteer.name} className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="font-bold text-ink">{volunteer.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{volunteer.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="premium-card rounded-[2rem] p-7">
            <h2 className="display-font text-3xl font-extrabold text-ink">Field updates</h2>
            <div className="mt-6 space-y-4">
              {campaign.updates.map((update, index) => (
                <div key={update} className="rounded-2xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-xs font-extrabold text-leaf">Update {index + 1}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{update}</p>
                </div>
              ))}
            </div>
          </div>
          <ImpactReportGenerator campaign={campaign} />
        </div>
      </section>
    </div>
  )
}
