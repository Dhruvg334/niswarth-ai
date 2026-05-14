import SectionHeader from '../common/SectionHeader.jsx'
import { FolderKanban, MessageCircle, BarChart3, CalendarDays } from 'lucide-react'

const problems = [
  ['Volunteer info lives in too many places', 'Assignments, roles, attendance, and contact details become hard to manage as campaigns grow.', FolderKanban],
  ['Field updates get lost in chats', 'Photos and notes from ground teams are scattered, hard to revisit, and difficult to connect to a campaign.', MessageCircle],
  ['Impact reports take weeks to write', 'Founders need clear narratives, but pulling numbers and stories together is slow and manual.', BarChart3],
  ['Events are difficult to coordinate', 'Drive dates, volunteer availability, locations, and follow-ups often move across disconnected tools.', CalendarDays],
]

export default function ProblemSection() {
  return (
    <section className="soft-section py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="The problem" title="NGO teams do meaningful work — on broken tooling." description="Most platforms are built for corporates. NGOs often stitch together spreadsheets, WhatsApp groups, paper forms, and scattered documents that slow the actual mission." />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {problems.map(([title, desc, Icon]) => (
            <div key={title} className="card-hover premium-card rounded-[2rem] p-7">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-forest"><Icon size={26} /></div>
              <h3 className="display-font text-xl font-extrabold leading-tight text-ink">{title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
