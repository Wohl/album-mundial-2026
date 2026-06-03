'use client'

import { useState, useEffect, useCallback } from 'react'
import { isMatchLocked } from '@/lib/quiniela/kickoff'

const STORAGE_KEY = 'album-wc2026-predictions-v1'

export interface PredictionEntry {
  homeScore: number
  awayScore: number
  savedAt: string   // ISO 8601 — used as change signal for useEffect deps
}

export type PredictionStore = Record<string, PredictionEntry>

interface UsePredictionsReturn {
  predictions: PredictionStore
  loaded: boolean
  get: (matchId: string) => PredictionEntry | null
  save: (matchId: string, homeScore: number, awayScore: number) => boolean
  remove: (matchId: string) => void
  count: number
}

export function usePredictions(): UsePredictionsReturn {
  const [predictions, setPredictions] = useState<PredictionStore>({})
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as PredictionStore
        setPredictions(parsed)
      }
    } catch {
      // Corrupt storage — start fresh
    }
    setLoaded(true)
  }, [])

  const persist = useCallback((next: PredictionStore) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage quota exceeded or private mode — ignore
    }
  }, [])

  /**
   * Save a prediction for a match.
   * Returns false (no-op) if the match is already locked.
   */
  const save = useCallback((
    matchId: string,
    homeScore: number,
    awayScore: number
  ): boolean => {
    if (isMatchLocked(matchId)) return false
    const entry: PredictionEntry = {
      homeScore,
      awayScore,
      savedAt: new Date().toISOString(),
    }
    const next = { ...predictions, [matchId]: entry }
    setPredictions(next)
    persist(next)
    return true
  }, [predictions, persist])

  /**
   * Remove a prediction.
   * No-op if the match is already locked.
   */
  const remove = useCallback((matchId: string): void => {
    if (isMatchLocked(matchId)) return
    const next = { ...predictions }
    delete next[matchId]
    setPredictions(next)
    persist(next)
  }, [predictions, persist])

  const get = useCallback((matchId: string): PredictionEntry | null => {
    return predictions[matchId] ?? null
  }, [predictions])

  return {
    predictions,
    loaded,
    get,
    save,
    remove,
    count: Object.keys(predictions).length,
  }
}
