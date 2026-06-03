// GET /api/live/wc?date=YYYY-MM-DD[&live=true]
// Returns World Cup 2026 fixtures for a given date, or all currently live WC matches.
// Server-side Route Handler — API key never reaches the browser.

import { NextRequest, NextResponse } from 'next/server'
import { isApiEnabled, LIVE_DATA_CONFIG, cacheHeader } from '@/lib/live-data/config'
import { ApiFootballProvider } from '@/lib/live-data/providers/api-football-provider'
import { MockProvider }        from '@/lib/live-data/providers/mock-provider'
import type { LiveMatch }      from '@/lib/live-data/types'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const date    = searchParams.get('date') ?? today()
  const liveOnly = searchParams.get('live') === 'true'

  if (!DATE_RE.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD.' },
      { status: 400 }
    )
  }

  let matches: LiveMatch[]
  let source: 'api-football' | 'mock'

  if (isApiEnabled()) {
    try {
      const provider = new ApiFootballProvider(LIVE_DATA_CONFIG.apiFootballKey!)

      if (liveOnly) {
        // Fetch only currently in-play WC matches
        matches = await provider.fetchLiveMatches(LIVE_DATA_CONFIG.wcLeagueId)
      } else {
        matches = await provider.fetchMatches({
          from:            date,
          to:              date,
          competitionType: 'world_cup',
        })
      }
      source = 'api-football'
    } catch (err) {
      console.error('[/api/live/wc] API-Football error, falling back to mock:', err)
      // Mock has no WC data — return empty array with mock label
      matches = []
      source = 'mock'
    }
  } else {
    // No key — return empty; WC calendar uses static calendar-data.ts in the UI
    matches = []
    source = 'mock'
  }

  const hasLive = matches.some(m => m.status === 'live' || m.status === 'halftime')

  return NextResponse.json(
    {
      matches,
      meta: {
        source,
        count:    matches.length,
        hasLive,
        date,
        cachedAt: new Date().toISOString(),
      },
    },
    {
      headers: {
        'Cache-Control': cacheHeader(hasLive),
      },
    }
  )
}
