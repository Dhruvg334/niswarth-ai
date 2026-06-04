export default function CampaignSelector({ campaigns, selectedId, onSelect }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {campaigns.map((campaign) => {
        const active = campaign.id === selectedId
        return (
          <button
            key={campaign.id}
            onClick={() => onSelect(campaign.id)}
            className={`focus-ring card-hover rounded-[1.5rem] border p-5 text-left transition ${active ? 'border-leaf bg-green-50/90 shadow-soft' : 'border-green-100 bg-white/85 hover:border-green-300'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-forest shadow-sm">{campaign.type}</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-extrabold text-forest">{campaign.status}</span>
            </div>
            <h3 className="mt-4 line-clamp-2 text-base font-extrabold leading-6 text-ink">{campaign.title}</h3>
            <p className="mt-3 text-xs font-bold text-slate-500">{campaign.location}</p>
          </button>
        )
      })}
    </div>
  )
}
