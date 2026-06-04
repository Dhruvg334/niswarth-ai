import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import LogoMark from '../common/LogoMark.jsx'
import Button from '../common/Button.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/demo' },
  { label: 'Use Cases', to: '/use-cases' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, workspace, workspaces, switchWorkspace, workspaceLoading, signOut } = useAuth()
  const roleLabel = workspace?.role ? `${workspace.role.charAt(0).toUpperCase()}${workspace.role.slice(1)}` : ''
  const linkClass = ({ isActive }) => `rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-green-100 text-forest shadow-sm' : 'text-slate-700 hover:bg-green-50 hover:text-forest'}`

  async function handleSignOut() {
    await signOut()
    setOpen(false)
    navigate('/', { replace: true })
  }

  async function handleWorkspaceChange(event) {
    await switchWorkspace(event.target.value)
    setOpen(false)
    navigate('/demo')
  }

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

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && workspace?.name && (
            workspaces?.length > 1 ? (
              <label className="sr-only" htmlFor="workspace-switcher">Workspace</label>
            ) : null
          )}
          {isAuthenticated && workspace?.name && (
            workspaces?.length > 1 ? (
              <select
                id="workspace-switcher"
                value={workspace.id}
                onChange={handleWorkspaceChange}
                disabled={workspaceLoading}
                className="max-w-[240px] rounded-full border border-green-100 bg-green-50 px-4 py-2 text-xs font-bold text-forest outline-none focus:border-leaf focus:ring-4 focus:ring-green-100 disabled:opacity-60"
              >
                {workspaces.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} · {item.role.charAt(0).toUpperCase() + item.role.slice(1)}</option>
                ))}
              </select>
            ) : (
              <span className="max-w-[220px] truncate rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-forest">{workspace.name}{roleLabel ? ` · ${roleLabel}` : ''}</span>
            )
          )}
          {isAuthenticated ? (
            <button onClick={handleSignOut} className="inline-flex items-center rounded-full border border-green-200 bg-white/80 px-4 py-2 text-sm font-bold text-forest hover:bg-green-50 focus-ring">
              <LogOut className="mr-2" size={16} /> Sign Out
            </button>
          ) : (
            <Button to="/signup">Create Workspace</Button>
          )}
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
            {isAuthenticated && workspace?.name && (
              workspaces?.length > 1 ? (
                <select
                  value={workspace.id}
                  onChange={handleWorkspaceChange}
                  disabled={workspaceLoading}
                  className="rounded-full border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-forest outline-none focus:border-leaf focus:ring-4 focus:ring-green-100 disabled:opacity-60"
                  aria-label="Workspace"
                >
                  {workspaces.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} · {item.role.charAt(0).toUpperCase() + item.role.slice(1)}</option>
                  ))}
                </select>
              ) : (
                <p className="px-4 py-2 text-xs font-bold text-forest">Workspace: {workspace.name}{roleLabel ? ` · ${roleLabel}` : ''}</p>
              )
            )}
            {isAuthenticated ? (
              <button onClick={handleSignOut} className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-green-200 bg-white px-6 py-3 text-sm font-bold text-forest hover:bg-green-50 focus-ring">
                <LogOut className="mr-2" size={16} /> Sign Out
              </button>
            ) : (
              <Button to="/signup" onClick={() => setOpen(false)} className="mt-2 w-full">Create Workspace</Button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
