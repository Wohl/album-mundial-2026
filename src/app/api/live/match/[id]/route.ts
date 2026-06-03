// GET /api/live/match/[id]
// Returns a single match by API-Football fixture ID, including events (goals/cards/subs).
// Server-side Route Handler — API key never reaches the browser.

import { NextRequest, NextResponse } from 'next/server'
import { isApiEnabled, LIVE_DATA_CONFIG, cacheHeader } from '@/lib/live-data/config'
import { ApiFootballProvider }  from '@/lib/live-data/providers/api-football-provider'
import { ApifootballProvider }  from '@/lib/live-data/providers/apifootball-provider'

function makeProvider() {
  const key = LIVE_DATA_CONFIG.apiFootballKey!
  return LIVE_DATA_CONFIG.provider === 'apifootball'
    ? new ApifootballProvider(key)
    : new ApiFootballProvider(key)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: 'Invalid fixture ID. Must be a numeric API-Football fixture ID.' },
      { status: 400 }
    )
  }

  if (!isApiEnabled()) {
    return NextResponse.json(
      { match: null, meta: { source: 'mock', reason: 'API_FOOTBALL_KEY not configured' } },
      { status: 200 }
    )
  }

  try {
    const provider = makeProvider()
    const match    = await provider.fetchMatchById(id)
    const hasLive  = match?.status === 'live' || match?.status === 'halftime'

    return NextResponse.json(
      { match, meta: { source: 'api-football', cachedAt: new Date().toISOString() } },
      { headers: { 'Cache-Control': cacheHeader(hasLive) } }
    )
  } catch (err) {
    console.error(`[/api/live/match/${id}] Error:`, err)
    return NextResponse.json(
      { match: null, meta: { source: 'error', error: String(err) } },
      { status: 502 }
    )
  }
}
