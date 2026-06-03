// World Cup 2026 live data service — client-safe.
// Fetches via the /api/live/wc Route Handler (server-side key, real API).
// Sprint 1: infrastructure ready; CalendarView still uses static calendar-data.ts.
// Sprint 6: wire CalendarView to this service for live score overlays.

import type { LiveMatch } from '../types'

/** Returns all currently in-play WC matches. */
export async function getLiveWcMatches(): Promise<LiveMatch[]> {
  try {
    const res = await fetch('/api/live/wc?live=true')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { matches: LiveMatch[] }
    return data.matches ?? []
  } catch (err) {
    console.warn('[wc-service] getLiveWcMatches failed:', err)
    return []
  }
}

/** Returns WC fixtures for a specific date (defaults to today). */
export async function getWcMatchesByDate(date?: string): Promise<LiveMatch[]> {
  try {
    const dateParam = date ?? new Date().toISOString().split('T')[0]
    const res = await fetch(`/api/live/wc?date=${dateParam}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { matches: LiveMatch[] }
    return data.matches ?? []
  } catch (err) {
    console.warn('[wc-service] getWcMatchesByDate failed:', err)
    return []
  }
}

/** Returns a single WC match with events by its API-Football fixture ID. */
export async function getWcMatchDetail(fixtureId: string): Promise<LiveMatch | null> {
  try {
    const res = await fetch(`/api/live/match/${fixtureId}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { match: LiveMatch | null }
    return data.match
  } catch (err) {
    console.warn('[wc-service] getWcMatchDetail failed:', err)
    return null
  }
}
