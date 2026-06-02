'use client'

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'album-wc2026-favorites-v1'
const SYNC_EVENT  = 'wc-favorites-changed'

export interface UseFavoritesReturn {
  favorites:  string[]
  toggle:     (code: string) => void
  isFavorite: (code: string) => boolean
  clearAll:   () => void
  loaded:     boolean
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Hydrate from localStorage on mount (client-only)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setFavorites(JSON.parse(raw))
    } catch {}
    setLoaded(true)

    // Sync with other useFavorites instances on the same page
    const sync = (e: Event) => {
      setFavorites((e as CustomEvent<string[]>).detail)
    }
    window.addEventListener(SYNC_EVENT, sync)
    return () => window.removeEventListener(SYNC_EVENT, sync)
  }, [])

  const persist = useCallback((next: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      window.dispatchEvent(new CustomEvent<string[]>(SYNC_EVENT, { detail: next }))
    } catch {}
  }, [])

  const toggle = useCallback((code: string) => {
    setFavorites(prev => {
      const next = prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
      persist(next)
      return next
    })
  }, [persist])

  const isFavorite = useCallback((code: string) => favorites.includes(code), [favorites])

  const clearAll = useCallback(() => {
    setFavorites([])
    try {
      localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new CustomEvent<string[]>(SYNC_EVENT, { detail: [] }))
    } catch {}
  }, [])

  return { favorites, toggle, isFavorite, loaded, clearAll }
}
