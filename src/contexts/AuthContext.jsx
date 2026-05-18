import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentSession, onAuthStateChange, signInWithEmail, signOutUser, signUpWithEmail } from '../services/authService.js'
import { createWorkspace, getUserWorkspace } from '../services/workspaceService.js'
import { isSupabaseConfigured } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

function withTimeout(promise, timeoutMs = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('Workspace lookup timed out. Please refresh and try again.')), timeoutMs)
    }),
  ])
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadWorkspace(userId) {
    if (!userId || !isSupabaseConfigured) {
      setWorkspace(null)
      return null
    }

    setWorkspaceLoading(true)
    try {
      const { workspace: loadedWorkspace, error: workspaceError } = await withTimeout(getUserWorkspace(userId))

      if (workspaceError) {
        setError(workspaceError.message)
        setWorkspace(null)
        return null
      }

      setWorkspace(loadedWorkspace)
      return loadedWorkspace
    } catch (loadError) {
      setError(loadError.message || 'Unable to load workspace.')
      setWorkspace(null)
      return null
    } finally {
      setWorkspaceLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function initializeAuth() {
      setLoading(true)
      try {
        const { session: currentSession, error: sessionError } = await getCurrentSession()
        if (!active) return

        if (sessionError) setError(sessionError.message)
        setSession(currentSession)

        if (currentSession?.user?.id) {
          await loadWorkspace(currentSession.user.id)
        } else {
          setWorkspace(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    initializeAuth()

    const subscription = onAuthStateChange(async (nextSession) => {
      setSession(nextSession)
      setError('')
      if (nextSession?.user?.id) {
        await loadWorkspace(nextSession.user.id)
      } else {
        setWorkspace(null)
        setWorkspaceLoading(false)
      }
    })

    return () => {
      active = false
      subscription?.unsubscribe?.()
    }
  }, [])

  async function signUp({ email, password, fullName }) {
    setError('')
    const { data, error: signUpError } = await signUpWithEmail({ email, password, fullName })
    if (signUpError) {
      setError(signUpError.message)
      return { data, error: signUpError }
    }
    return { data, error: null }
  }

  async function signIn({ email, password }) {
    setError('')
    const { data, error: signInError } = await signInWithEmail({ email, password })
    if (signInError) {
      setError(signInError.message)
      return { data, error: signInError }
    }
    setSession(data.session)
    if (data.session?.user?.id) await loadWorkspace(data.session.user.id)
    return { data, error: null }
  }

  async function signOut() {
    setError('')
    const { error: signOutError } = await signOutUser()
    if (signOutError) {
      setError(signOutError.message)
      return { error: signOutError }
    }
    setSession(null)
    setWorkspace(null)
    setWorkspaceLoading(false)
    return { error: null }
  }

  async function setupWorkspace({ name, city }) {
    setError('')
    setWorkspaceLoading(true)
    try {
      const { workspace: createdWorkspace, error: workspaceError } = await withTimeout(createWorkspace({ name, city }), 15000)
      if (workspaceError) {
        setError(workspaceError.message)
        return { workspace: null, error: workspaceError }
      }
      setWorkspace(createdWorkspace)
      return { workspace: createdWorkspace, error: null }
    } catch (workspaceError) {
      setError(workspaceError.message || 'Unable to create workspace.')
      return { workspace: null, error: workspaceError }
    } finally {
      setWorkspaceLoading(false)
    }
  }

  async function refreshWorkspace() {
    if (!session?.user?.id) return null
    return loadWorkspace(session.user.id)
  }

  const value = useMemo(() => ({
    isSupabaseConfigured,
    session,
    user: session?.user || null,
    workspace,
    loading,
    workspaceLoading,
    error,
    isAuthenticated: Boolean(session?.user),
    hasWorkspace: Boolean(workspace?.id),
    signUp,
    signIn,
    signOut,
    setupWorkspace,
    refreshWorkspace,
  }), [session, workspace, loading, workspaceLoading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
