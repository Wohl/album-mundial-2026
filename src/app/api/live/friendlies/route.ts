// GET /api/live/friendlies?from=YYYY-MM-DD&to=YYYY-MM-DD[&teamCode=ARG]
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

// Date validation: must be 'YYYY-MM-DD'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from     = searchParams.get('from')     ?? dateOffset(-60)
  const to       = searchParams.get('to')       ?? dateOffset(30)
  const teamCode = searchParams.get('teamCode') ?? undefined

  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
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
      matches = await provider.fetchMatches({
        from,
        to,
        competitionType: 'friendly',
        teamCode,
      })
      source = 'api-football'
    } catch (err) {
      console.error('[/api/live/friendlies] API-Football error, falling back to mock:', err)
      const mock = new MockProvider()
      matches = await mock.fetchMatches({ from, to, competitionType: 'friendly', teamCode })
      source = 'mock'
    }
  } else {
    const mock = new MockProvider()
    matches = await mock.fetchMatches({ from, to, competitionType: 'friendly', teamCode })
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
