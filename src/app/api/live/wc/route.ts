// GET /api/live/wc?date=YYYY-MM-DD[&live=true]
// Returns World Cup 2026 fixtures for a given date, or all currently live WC matches.
// Server-side Route Handler — API key never reaches the browser.

import { NextRequest, NextResponse } from 'next/server'
import { isApiEnabled, LIVE_DATA_CONFIG, cacheHeader } from '@/lib/live-data/config'
import { ApiFootballProvider }  from '@/lib/live-data/providers/api-football-provider'
import { ApifootballProvider }  from '@/lib/live-data/providers/apifootball-provider'
import { MockProvider }         from '@/lib/live-data/providers/mock-provider'
import type { LiveMatch }       from '@/lib/live-data/types'

function makeProvider() {
  const key = LIVE_DATA_CONFIG.apiFootballKey!
  return LIVE_DATA_CONFIG.provider === 'apifootball'
    ? new ApifootballProvider(key)
    : new ApiFootballProvider(key)
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function today(): string {
  return new Date().toISOString().split('T')[0]
}

async function mockFetchWc(mock: MockProvider, liveOnly: boolean, date: string): Promise<LiveMatch[]> {
  if (liveOnly) {
    const all = await mock.fetchMatches({ from: today(), to: today(), competitionType: 'world_cup' })
    return all.filter(m => m.status === 'live' || m.status === 'halftime')
  }
  return mock.fetchMatches({ from: date, to: date, competitionType: 'world_cup' })
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
      const provider = makeProvider()
      const wcId = LIVE_DATA_CONFIG.provider === 'apifootball'
        ? LIVE_DATA_CONFIG.apifbWcLeagueId
        : String(LIVE_DATA_CONFIG.wcLeagueId)

      if (liveOnly) {
        if (provider instanceof ApifootballProvider) {
          matches = await provider.fetchLiveMatches(wcId)
        } else if (provider instanceof ApiFootballProvider) {
          matches = await provider.fetchLiveMatches(Number(wcId))
        } else {
          matches = []
        }
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
      const mock = new MockProvider()
      matches = await mockFetchWc(mock, liveOnly, date)
      source = 'mock'
    }
  } else {
    // No API key — use WC mock data so dev/staging can test the full live flow
    const mock = new MockProvider()
    matches = await mockFetchWc(mock, liveOnly, date)
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
