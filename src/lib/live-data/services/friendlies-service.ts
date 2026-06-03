// Friendlies service — client-safe.
// Fetches via the /api/live/friendlies Route Handler (server-side key, real API).
// Falls back to MockProvider if the Route Handler is unreachable.

import type { LiveMatch } from '../types'
import { MockProvider }   from '../providers/mock-provider'

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Fallback for when the Route Handler fails (network error, dev without key, etc.)
const _mock = new MockProvider()
async function mockFallback(from: string, to: string, teamCode?: string): Promise<LiveMatch[]> {
  return _mock.fetchMatches({ from, to, competitionType: 'friendly', teamCode })
}

/** Calls the Route Handler; falls back to mock on any error. */
async function fetchFromRoute(params: URLSearchParams): Promise<LiveMatch[]> {
  try {
    const res = await fetch(`/api/live/friendlies?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { matches: LiveMatch[] }
    return data.matches ?? []
  } catch (err) {
    console.warn('[friendlies-service] Route Handler unavailable, using mock:', err)
    return null as unknown as LiveMatch[]  // signal to caller to use mock
  }
}

// ── Public API ────────────────────────────────────────────────────

export async function getRecentFriendlies(): Promise<LiveMatch[]> {
  const from = dateOffset(-60)
  const to   = dateOffset(-1)
  const p    = new URLSearchParams({ from, to })
  const result = await fetchFromRoute(p)
  return result ?? mockFallback(from, to)
}

export async function getUpcomingFriendlies(): Promise<LiveMatch[]> {
  const from = dateOffset(0)
  const to   = dateOffset(30)
  const p    = new URLSearchParams({ from, to })
  const result = await fetchFromRoute(p)
  return result ?? mockFallback(from, to)
}

export async function getAllFriendlies(): Promise<LiveMatch[]> {
  const from = dateOffset(-60)
  const to   = dateOffset(30)
  const p    = new URLSearchParams({ from, to })
  const result = await fetchFromRoute(p)
  return result ?? mockFallback(from, to)
}

export async function getFriendliesByTeam(teamCode: string): Promise<LiveMatch[]> {
  const from = dateOffset(-60)
  const to   = dateOffset(30)
  const p    = new URLSearchParams({ from, to, teamCode })
  const result = await fetchFromRoute(p)
  return result ?? mockFallback(from, to, teamCode)
}
