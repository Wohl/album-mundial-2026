'use client'

import { useState, useEffect, useCallback } from 'react'
import { Profile } from '@/types'
import { supabase, isOfflineMode } from '@/lib/supabase'

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const { data } = await supabase.from('profiles').select().eq('id', uid).single()
      setProfile(data ?? null)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOfflineMode) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id)
        setUserEmail(session.user.email ?? null)
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        setUserEmail(session.user.email ?? null)
        loadProfile(session.user.id)
      } else {
        setUserId(null)
        setUserEmail(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!userEmail) throw new Error('No hay sesión activa')

    // Verify current password before allowing change
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    })
    if (verifyError) throw new Error('La contraseña actual es incorrecta')

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const updateDisplayName = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')
    const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', user.id)
    if (error) throw error
    setProfile((prev) => prev ? { ...prev, display_name: name } : prev)
  }

  return { userId, userEmail, profile, loading, signIn, signUp, signOut, changePassword, updateDisplayName }
}
