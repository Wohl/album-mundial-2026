'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LiveMatch } from '@/lib/live-data/types'

const POLL_LIVE_MS = 30_000   // live o halftime — actualización cada 30 s
const POLL_IDLE_MS = 300_000  // partidos próximos — detección de kick-off

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Polls /api/live/wc for today's WC matches.
 * For live/halftime matches, also fetches events via /api/live/match/{id}.
 * Returns a map keyed by `${homeCode}-${awayCode}` for O(1) lookup in CalendarView.
 */
export function useLiveWc() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/wc?date=${todayIso()}`)
      if (!res.ok || !mountedRef.current) return
      const json = await res.json() as { matches: LiveMatch[]; meta: { hasLive: boolean } }
      const base: LiveMatch[] = json.matches ?? []

      // Enrich live matches with events from detail endpoint
      const liveIds = base
        .filter(m => m.status === 'live' || m.status === 'halftime')
        .map(m => m.id)

      let enriched = base
      if (liveIds.length > 0) {
        const results = await Promise.allSettled(
          liveIds.map(id =>
            fetch(`/api/live/match/${id}`)
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        )
        const detailMap = new Map<string, LiveMatch>()
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value?.match) {
            const m: LiveMatch = r.value.match
            detailMap.set(m.id, m)
          }
        }
        enriched = base.map(m => detailMap.get(m.id) ?? m)
      }

      if (!mountedRef.current) return
      setMatches(enriched)

      const hasLive     = enriched.some(m => m.status === 'live' || m.status === 'halftime')
      const hasUpcoming = enriched.some(m => m.status === 'upcoming')

      // Stop polling when all today's matches are finished — no new events expected
      if (hasLive || hasUpcoming) {
        timerRef.current = setTimeout(poll, hasLive ? POLL_LIVE_MS : POLL_IDLE_MS)
      }
    } catch {
      if (mountedRef.current) {
        timerRef.current = setTimeout(poll, POLL_IDLE_MS)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    poll()
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [poll])

  const liveByKey = new Map<string, LiveMatch>()
  for (const m of matches) {
    liveByKey.set(`${m.home.code}-${m.away.code}`, m)
  }

  const hasLive = matches.some(m => m.status === 'live' || m.status === 'halftime')
  return { liveByKey, hasLive }
}
