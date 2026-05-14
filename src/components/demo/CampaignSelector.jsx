export default function CampaignSelector({ campaigns, selectedId, onSelect }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {campaigns.map((campaign) => {
        const active = campaign.id === selectedId
        return (
          <button key={campaign.id} onClick={() => onSelect(campaign.id)} className={`focus-ring card-hover rounded-[1.75rem] border p-6 text-left transition ${active ? 'border-leaf bg-green-50/90 shadow-soft' : 'border-green-100 bg-white/85 hover:border-green-300'}`}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="display-font text-xl font-extrabold text-ink">{campaign.type}</h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-forest shadow-sm">{campaign.status}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-600">{campaign.title}</p>
            <p className="mt-5 text-xs font-bold text-slate-500">{campaign.location}</p>
          </button>
        )
      })}
    </div>
  )
}
