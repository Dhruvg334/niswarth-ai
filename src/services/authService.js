import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

function getAuthError(message) {
  return { data: null, error: new Error(message) }
}

export async function getCurrentSession() {
  if (!isSupabaseConfigured) return { session: null, error: null }
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session || null, error }
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) return { unsubscribe: () => {} }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return data.subscription
}

export async function signUpWithEmail({ email, password, fullName }) {
  if (!isSupabaseConfigured) return getAuthError('Supabase is not configured.')

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  })

  return { data, error }
}

export async function signInWithEmail({ email, password }) {
  if (!isSupabaseConfigured) return getAuthError('Supabase is not configured.')

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  return { data, error }
}

export async function signOutUser() {
  if (!isSupabaseConfigured) return { error: null }
  const { error } = await supabase.auth.signOut()
  return { error }
}
