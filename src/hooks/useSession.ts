'use client'

import { useState, useEffect, useCallback } from 'react'
import { Session } from '@/types'
import { sessionService } from '@/services/sessionService'

const SESSION_ID_KEY = 'album_session_id'
const SESSION_NAME_KEY = 'album_display_name'

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const createSession = useCallback(async (displayName: string) => {
    try {
      const newSession = await sessionService.getOrCreateSession(displayName)
      setSession(newSession)
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_ID_KEY, newSession.id)
        localStorage.setItem(SESSION_NAME_KEY, displayName)
      }
      return newSession
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }, [])

  const initializeSession = useCallback(async () => {
    setLoading(true)
    try {
      if (typeof window === 'undefined') return

      let sessionId = localStorage.getItem(SESSION_ID_KEY)
      const displayName = localStorage.getItem(SESSION_NAME_KEY)

      if (sessionId && displayName) {
        const existingSession = await sessionService.getSession(sessionId)
        if (existingSession) {
          setSession(existingSession)
          await sessionService.updateSession(sessionId)
        } else {
          localStorage.removeItem(SESSION_ID_KEY)
          localStorage.removeItem(SESSION_NAME_KEY)
        }
      }
    } catch (error) {
      console.error('Error initializing session:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  return {
    session,
    loading,
    createSession,
  }
}
