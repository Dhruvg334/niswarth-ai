export default function CampaignSelector({ campaigns, selectedId, onSelect }) {
  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => {
        const active = campaign.id === selectedId
        return (
          <button
            key={campaign.id}
            onClick={() => onSelect(campaign.id)}
            className={`focus-ring w-full rounded-[1.25rem] border p-4 text-left transition ${active ? 'border-leaf bg-green-50/90 shadow-soft' : 'border-green-100 bg-white/85 hover:border-green-300 hover:bg-green-50/40'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-forest shadow-sm">{campaign.type}</span>
                <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-6 text-ink">{campaign.title}</h3>
                <p className="mt-2 text-xs font-bold text-slate-500">{campaign.location}</p>
              </div>
              <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-[11px] font-extrabold text-forest">{campaign.status}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
