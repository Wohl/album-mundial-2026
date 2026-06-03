// API-Football v3 provider — implements LiveDataProvider.
// Server-side only: instantiated exclusively inside Next.js Route Handlers.
// Never import this file from 'use client' components.

import type { LiveDataProvider } from './base-provider'
import type { LiveMatch, FetchMatchesOptions } from '../types'
import {
  mapApiFbFixtures,
  mergeEvents,
  type ApiFbFixture,
  type ApiFbEvent,
  type ApiFbResponse,
} from '../mappers/api-football-mapper'
import { LIVE_DATA_CONFIG } from '../config'

const BASE = LIVE_DATA_CONFIG.apiFootballBase

export class ApiFootballProvider implements LiveDataProvider {
  readonly id          = 'api-football'
  readonly name        = 'API-Football v3'
  readonly description = 'Real-time football data via api-football.com (api-sports.io)'

  constructor(private readonly apiKey: string) {}

  // ── Private helpers ─────────────────────────────────────────────

  private headers(): HeadersInit {
    return {
      'x-apisports-key': this.apiKey,
      'Accept':          'application/json',
    }
  }

  private async get<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
    const url = new URL(`${BASE}${path}`)
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v !== undefined) url.searchParams.set(k, String(v))
    }

    const res = await fetch(url.toString(), {
      headers: this.headers(),
      // No Next.js cache here — caching is handled at the Route Handler level
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`API-Football ${path} → HTTP ${res.status}`)
    }

    const json = await res.json() as ApiFbResponse<T>

    // API-Football returns errors as an object, not HTTP status codes
    if (json.errors && typeof json.errors === 'object' && Object.keys(json.errors).length > 0) {
      throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`)
    }

    return json.response ?? []
  }

  // ── LiveDataProvider interface ───────────────────────────────────

  async fetchMatches(options: FetchMatchesOptions): Promise<LiveMatch[]> {
    const { from, to, competitionType, teamCode } = options

    // Choose the correct league_id based on competition type
    const leagueId = competitionType === 'world_cup'
      ? LIVE_DATA_CONFIG.wcLeagueId
      : LIVE_DATA_CONFIG.friendlyLeagueId

    const params: Record<string, string | number> = {
      league: leagueId,
      season: 2026,
      from,
      to,
    }

    // Optional team filter (API-Football uses numeric team IDs, not codes).
    // When a teamCode filter is needed and we don't have the numeric ID mapping,
    // we fetch all and filter client-side. This is acceptable for friendly-scale
    // data sets (<50 results per window).

    const raw = await this.get<ApiFbFixture>('/fixtures', params)
    let matches = mapApiFbFixtures(raw)

    if (teamCode) {
      const code = teamCode.toUpperCase()
      matches = matches.filter(
        m => m.home.code === code || m.away.code === code
      )
    }

    return matches
  }

  async fetchMatchById(id: string): Promise<LiveMatch | null> {
    const [rawFixtures, rawEvents] = await Promise.all([
      this.get<ApiFbFixture>('/fixtures',        { id }),
      this.get<ApiFbEvent>  ('/fixtures/events', { fixture: id }),
    ])

    if (!rawFixtures.length) return null

    const match = mapApiFbFixtures(rawFixtures)[0]
    if (!match) return null

    return mergeEvents(match, rawEvents)
  }

  // ── Live-only convenience ────────────────────────────────────────

  /** Returns all currently live matches across all leagues (no date filter). */
  async fetchLiveMatches(leagueId?: number): Promise<LiveMatch[]> {
    const params: Record<string, string | number> = { live: 'all' }
    if (leagueId) params.league = leagueId

    const raw = await this.get<ApiFbFixture>('/fixtures', params)
    return mapApiFbFixtures(raw)
  }
}
