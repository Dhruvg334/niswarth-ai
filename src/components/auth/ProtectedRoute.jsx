import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function ProtectedRoute({ children, requireWorkspace = true }) {
  const { loading, workspaceLoading, isAuthenticated, hasWorkspace, isSupabaseConfigured } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) {
    return (
      <div className="gradient-bg">
        <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="premium-card rounded-[2rem] p-8 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-leaf">Backend required</p>
            <h1 className="mt-3 display-font text-3xl font-black text-ink">Supabase is not configured</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The workflow dashboard requires authentication and an NGO workspace. Add your Supabase environment variables before using this area.
            </p>
          </div>
        </section>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="gradient-bg">
        <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="premium-card rounded-[2rem] p-8 text-center text-slate-600">Checking your session...</div>
        </section>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requireWorkspace && !hasWorkspace && workspaceLoading) {
    return (
      <div className="gradient-bg">
        <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="premium-card rounded-[2rem] p-8 text-center text-slate-600">Preparing your workspace...</div>
        </section>
      </div>
    )
  }

  if (requireWorkspace && !hasWorkspace) {
    return <Navigate to="/workspace-setup" replace />
  }

  return children
}
