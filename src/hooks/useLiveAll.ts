'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LiveMatch } from '@/lib/live-data/types'

const POLL_LIVE_MS = 60_000
const POLL_IDLE_MS = 300_000

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Polls for currently live matches from both WC and friendlies sources.
 * Returns up to 5 live/halftime matches for the Dashboard live block.
 * Uses adaptive polling: 60s when live matches exist, 5min otherwise.
 */
export function useLiveAll() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const poll = useCallback(async () => {
    try {
      const today = todayIso()
      const [wcRes, frRes] = await Promise.all([
        fetch(`/api/live/wc?live=true`),
        fetch(`/api/live/friendlies?from=${today}&to=${today}`),
      ])

      const [wcJson, frJson] = await Promise.all([
        wcRes.ok ? wcRes.json() : { matches: [] },
        frRes.ok ? frRes.json() : { matches: [] },
      ])

      if (!mountedRef.current) return

      const wcLive: LiveMatch[] = wcJson.matches ?? []
      const frLive: LiveMatch[] = ((frJson.matches ?? []) as LiveMatch[]).filter(
        (m: LiveMatch) => m.status === 'live' || m.status === 'halftime'
      )

      const all = [...wcLive, ...frLive].slice(0, 5)
      setLiveMatches(all)

      timerRef.current = setTimeout(poll, all.length > 0 ? POLL_LIVE_MS : POLL_IDLE_MS)
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

  return { liveMatches }
}
