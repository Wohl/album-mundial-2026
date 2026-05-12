import { Session } from '@/types'
import { supabase, isOfflineMode } from '@/lib/supabase'
import { localStorageService } from '@/lib/localStorage'

const generateId = () => {
  if (typeof window === 'undefined') {
    return Math.random().toString(36).substr(2, 9)
  }
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)
}

export const sessionService = {
  async getOrCreateSession(displayName: string): Promise<Session> {
    if (isOfflineMode) {
      let session = localStorageService.getSession()
      if (!session) {
        session = {
          id: generateId(),
          display_name: displayName,
          created_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        }
        localStorageService.setSession(session)
      }
      return session
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            display_name: displayName,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  },

  async updateSession(sessionId: string): Promise<void> {
    if (isOfflineMode) {
      const session = localStorageService.getSession()
      if (session) {
        session.last_seen = new Date().toISOString()
        localStorageService.setSession(session)
      }
      return
    }

    try {
      await supabase
        .from('sessions')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', sessionId)
    } catch (error) {
      console.error('Error updating session:', error)
    }
  },

  async getSession(sessionId: string): Promise<Session | null> {
    if (isOfflineMode) {
      return localStorageService.getSession()
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select()
        .eq('id', sessionId)
        .single()

      if (error) return null
      return data
    } catch (error) {
      console.error('Error fetching session:', error)
      return null
    }
  },
}
