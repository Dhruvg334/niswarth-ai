import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import LogoMark from '../common/LogoMark.jsx'
import Button from '../common/Button.jsx'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/demo' },
  { label: 'Use Cases', to: '/use-cases' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const linkClass = ({ isActive }) => `rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-green-100 text-forest shadow-sm' : 'text-slate-700 hover:bg-green-50 hover:text-forest'}`

  return (
    <header className="sticky top-0 z-50 border-b border-green-100 bg-white/95 text-ink shadow-[0_14px_45px_-38px_rgba(20,83,45,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 rounded-xl focus-ring">
          <LogoMark size="sm" />
          <div>
            <p className="display-font text-base font-extrabold leading-none text-ink">Niswarth <span className="text-forest">AI</span></p>
            <p className="text-xs font-semibold text-slate-500">Selfless service, smarter impact</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} className={linkClass}>{link.label}</NavLink>)}
        </nav>

        <div className="hidden md:block">
          <Button to="/contact">Map Your Impact Workflow</Button>
        </div>

        <button className="rounded-xl border border-green-100 bg-green-50 p-2 text-forest md:hidden focus-ring" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-green-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className={linkClass}>{link.label}</NavLink>
            ))}
            <Button to="/contact" onClick={() => setOpen(false)} className="mt-2 w-full">Map Your Impact Workflow</Button>
          </nav>
        </div>
      )}
    </header>
  )
}
