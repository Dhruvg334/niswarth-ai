import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getCurrentSession, onAuthStateChange, signInWithEmail, signOutUser, signUpWithEmail } from '../services/authService.js'
import { createWorkspace, getUserWorkspace } from '../services/workspaceService.js'
import { isSupabaseConfigured } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

function withTimeout(promise, timeoutMs = 9000, message = 'The request took too long. Please try again.') {
  let timeoutId

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => window.clearTimeout(timeoutId))
}

function getWorkspaceStorageKey(userId) {
  return userId ? `niswarth-active-workspace-${userId}` : null
}

function readStoredWorkspaceId(userId) {
  const key = getWorkspaceStorageKey(userId)
  if (!key) return null
  return window.localStorage.getItem(key)
}

function storeWorkspaceId(userId, workspaceId) {
  const key = getWorkspaceStorageKey(userId)
  if (!key || !workspaceId) return
  window.localStorage.setItem(key, workspaceId)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [error, setError] = useState('')

  const activeRef = useRef(true)
  const sessionRef = useRef(null)
  const workspaceRef = useRef(null)
  const workspaceRequestIdRef = useRef(0)

  const loadWorkspace = useCallback(async (userId, options = {}) => {
    const { preserveExisting = true, showLoading = true, preferredWorkspaceId = null } = options

    if (!userId || !isSupabaseConfigured) {
      workspaceRef.current = null
      setWorkspace(null)
      setWorkspaces([])
      return null
    }

    const requestId = workspaceRequestIdRef.current + 1
    workspaceRequestIdRef.current = requestId

    if (showLoading && !workspaceRef.current) setWorkspaceLoading(true)

    try {
      const selectedWorkspaceId = preferredWorkspaceId || readStoredWorkspaceId(userId)
      const { workspace: loadedWorkspace, workspaces: loadedWorkspaces = [], error: workspaceError } = await withTimeout(
        getUserWorkspace(userId, selectedWorkspaceId),
        9000,
        'Workspace lookup is taking longer than expected. Please refresh and try again.',
      )

      if (!activeRef.current || workspaceRequestIdRef.current !== requestId) return workspaceRef.current

      if (workspaceError) {
        setError(workspaceError.message)
        if (!preserveExisting) {
          workspaceRef.current = null
          setWorkspace(null)
          setWorkspaces([])
        }
        return null
      }

      workspaceRef.current = loadedWorkspace
      setWorkspace(loadedWorkspace)
      setWorkspaces(loadedWorkspaces)
      if (loadedWorkspace?.id) storeWorkspaceId(userId, loadedWorkspace.id)
      return loadedWorkspace
    } catch (loadError) {
      if (!activeRef.current || workspaceRequestIdRef.current !== requestId) return workspaceRef.current
      setError(loadError.message || 'Unable to load workspace.')
      if (!preserveExisting) {
        workspaceRef.current = null
        setWorkspace(null)
        setWorkspaces([])
      }
      return null
    } finally {
      if (activeRef.current && workspaceRequestIdRef.current === requestId) {
        setWorkspaceLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    activeRef.current = true

    async function initializeAuth() {
      setLoading(true)
      try {
        const { session: currentSession, error: sessionError } = await getCurrentSession()
        if (!activeRef.current) return

        if (sessionError) setError(sessionError.message)

        sessionRef.current = currentSession
        setSession(currentSession)

        if (currentSession?.user?.id) {
          await loadWorkspace(currentSession.user.id, { preserveExisting: false })
        } else {
          workspaceRef.current = null
          setWorkspace(null)
          setWorkspaces([])
        }
      } finally {
        if (activeRef.current) setLoading(false)
      }
    }

    initializeAuth()

    const subscription = onAuthStateChange(({ event, session: nextSession }) => {
      const previousUserId = sessionRef.current?.user?.id || null
      const nextUserId = nextSession?.user?.id || null

      sessionRef.current = nextSession
      setSession(nextSession)
      setError('')

      if (!nextUserId) {
        workspaceRequestIdRef.current += 1
        workspaceRef.current = null
        setWorkspace(null)
        setWorkspaces([])
        setWorkspaceLoading(false)
        return
      }

      const userChanged = previousUserId && previousUserId !== nextUserId
      const needsWorkspaceLoad = userChanged || !workspaceRef.current

      if (needsWorkspaceLoad && event !== 'TOKEN_REFRESHED') {
        window.setTimeout(() => {
          if (!activeRef.current) return
          loadWorkspace(nextUserId, { preserveExisting: !userChanged, showLoading: !workspaceRef.current })
        }, 0)
      }
    })

    return () => {
      activeRef.current = false
      subscription?.unsubscribe?.()
    }
  }, [loadWorkspace])

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

    sessionRef.current = data.session
    setSession(data.session)

    if (data.session?.user?.id) {
      await loadWorkspace(data.session.user.id, { preserveExisting: false })
    }

    return { data, error: null }
  }

  async function signOut() {
    setError('')
    const { error: signOutError } = await signOutUser()
    if (signOutError) {
      setError(signOutError.message)
      return { error: signOutError }
    }

    workspaceRequestIdRef.current += 1
    sessionRef.current = null
    workspaceRef.current = null
    setSession(null)
    setWorkspace(null)
    setWorkspaces([])
    setWorkspaceLoading(false)
    return { error: null }
  }

  async function setupWorkspace({ name, city }) {
    setError('')
    setWorkspaceLoading(true)

    try {
      const { workspace: createdWorkspace, error: workspaceError } = await withTimeout(
        createWorkspace({ name, city }),
        12000,
        'Workspace creation is taking longer than expected. Please try again.',
      )

      if (workspaceError) {
        setError(workspaceError.message)
        return { workspace: null, error: workspaceError }
      }

      workspaceRequestIdRef.current += 1
      workspaceRef.current = createdWorkspace
      setWorkspace(createdWorkspace)
      setWorkspaces((currentWorkspaces) => {
        const withoutDuplicate = currentWorkspaces.filter((item) => item.id !== createdWorkspace.id)
        return [createdWorkspace, ...withoutDuplicate]
      })

      if (sessionRef.current?.user?.id) {
        storeWorkspaceId(sessionRef.current.user.id, createdWorkspace.id)
        window.setTimeout(() => {
          if (!activeRef.current) return
          loadWorkspace(sessionRef.current.user.id, { preserveExisting: true, showLoading: false, preferredWorkspaceId: createdWorkspace.id })
        }, 0)
      }

      return { workspace: createdWorkspace, error: null }
    } catch (workspaceError) {
      setError(workspaceError.message || 'Unable to create workspace.')
      return { workspace: null, error: workspaceError }
    } finally {
      setWorkspaceLoading(false)
    }
  }

  async function refreshWorkspace() {
    if (!sessionRef.current?.user?.id) return null
    return loadWorkspace(sessionRef.current.user.id, { preserveExisting: true, preferredWorkspaceId: workspaceRef.current?.id })
  }

  async function switchWorkspace(workspaceId) {
    if (!sessionRef.current?.user?.id || !workspaceId || workspaceId === workspaceRef.current?.id) {
      return { workspace: workspaceRef.current, error: null }
    }

    setError('')
    storeWorkspaceId(sessionRef.current.user.id, workspaceId)
    const switchedWorkspace = await loadWorkspace(sessionRef.current.user.id, {
      preserveExisting: true,
      showLoading: true,
      preferredWorkspaceId: workspaceId,
    })

    if (!switchedWorkspace || switchedWorkspace.id !== workspaceId) {
      const switchError = new Error('You do not have access to that workspace.')
      setError(switchError.message)
      return { workspace: null, error: switchError }
    }

    return { workspace: switchedWorkspace, error: null }
  }

  const value = useMemo(() => ({
    isSupabaseConfigured,
    session,
    user: session?.user || null,
    workspace,
    workspaces,
    loading,
    workspaceLoading,
    error,
    isAuthenticated: Boolean(session?.user),
    hasWorkspace: Boolean(workspace?.id),
    hasMultipleWorkspaces: workspaces.length > 1,
    signUp,
    signIn,
    signOut,
    setupWorkspace,
    refreshWorkspace,
    switchWorkspace,
  }), [session, workspace, workspaces, loading, workspaceLoading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
