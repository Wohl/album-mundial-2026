// apifootball.com provider — implements LiveDataProvider.
// Different from api-football.com: uses query-param auth, different response schema.
// Server-side only: instantiated exclusively inside Next.js Route Handlers.

import type { LiveDataProvider } from './base-provider'
import type { LiveMatch, LiveEvent, LiveEventType, FetchMatchesOptions, CompetitionType } from '../types'
import { resolveTeamCode } from '../mappers/team-code-map'

const BASE = 'https://apiv3.apifootball.com/'

// ── Raw shapes (minimal) ──────────────────────────────────────────

interface ApifbMatch {
  match_id: string
  match_date: string          // 'YYYY-MM-DD'
  match_time: string          // 'HH:MM' UTC
  match_status: string        // 'Not Started'|'Finished'|'Half Time'|'90+'|'45+X'|digit
  match_live: string          // '0' | '1'
  match_hometeam_id: string
  match_hometeam_name: string
  match_hometeam_score: string // '' when not started
  match_awayteam_id: string
  match_awayteam_name: string
  match_awayteam_score: string
  match_stadium: string
  match_city?: string
  league_id: string
  league_name: string
  country_name: string
  league_year: string
  match_round?: string
  goalscorer?: ApifbGoal[]
  cards?: ApifbCard[]
  substitutions?: { home: ApifbSub[]; away: ApifbSub[] }
}

interface ApifbGoal {
  time: string
  home_scorer: string; home_scorer_id: string; home_assist: string
  away_scorer: string; away_scorer_id: string; away_assist: string
  info: string  // 'Penalty', 'Own Goal', ''
  score_info_time: string
}

interface ApifbCard {
  time: string
  card: string          // 'yellow card' | 'red card' | 'yellow red card'
  home_fault: string
  away_fault: string
  home_player_id: string
  away_player_id: string
}

interface ApifbSub {
  time: string
  substitution: string  // 'PlayerIn | PlayerOut'
  substitution_player_id: string
}

// ── Status mapping ────────────────────────────────────────────────

function mapStatus(raw: ApifbMatch): import('../types').LiveMatchStatus {
  const s = raw.match_status
  if (s === 'Not Started' || s === '') return 'upcoming'
  if (s === 'Finished' || s === 'After Extra Time' || s === 'Pen') return 'completed'
  if (s === 'Half Time') return 'halftime'
  if (s === 'Cancelled' || s === 'Abandoned') return 'cancelled'
  if (s === 'Postponed') return 'postponed'
  // Digit or '90+X' → live
  if (/^\d/.test(s)) return 'live'
  return 'upcoming'
}

function mapMinute(s: string): number | undefined {
  const n = parseInt(s, 10)
  return isNaN(n) ? undefined : n
}

// ── Score parsing ─────────────────────────────────────────────────

function parseScore(raw: string): number | undefined {
  const n = parseInt(raw, 10)
  return isNaN(n) ? undefined : n
}

// ── Competition type ──────────────────────────────────────────────

function mapCompType(leagueId: string): CompetitionType {
  if (leagueId === '28') return 'world_cup'
  if (leagueId === '356' || leagueId === '355') return 'friendly'
  return 'friendly'
}

// ── Event builders ────────────────────────────────────────────────

function buildGoalEvents(goals: ApifbGoal[], homeCode: string, awayCode: string): LiveEvent[] {
  return goals.map((g, i): LiveEvent => {
    const isHome  = !!g.home_scorer
    const scorer  = isHome ? g.home_scorer : g.away_scorer
    const assist  = isHome ? g.home_assist : g.away_assist
    const teamCode = isHome ? homeCode : awayCode
    const isOwnGoal = g.info.toLowerCase().includes('own')
    const isPenalty = g.info.toLowerCase().includes('penalty')
    const type: LiveEventType = isOwnGoal ? 'own_goal' : isPenalty ? 'penalty' : 'goal'
    const ev: LiveEvent = {
      id:         `goal-${i}-${g.time}`,
      type,
      minute:     parseInt(g.time, 10) || 0,
      teamCode,
      playerName: scorer || '?',
    }
    if (assist) ev.assistName = assist
    return ev
  })
}

function buildCardEvents(cards: ApifbCard[], homeCode: string, awayCode: string): LiveEvent[] {
  return cards.map((c, i): LiveEvent => {
    const isHome   = !!c.home_fault
    const player   = isHome ? c.home_fault : c.away_fault
    const teamCode = isHome ? homeCode : awayCode
    const card = c.card.toLowerCase()
    const type: LiveEventType = card.includes('yellow red') ? 'yellow_red_card'
      : card.includes('red') ? 'red_card' : 'yellow_card'
    return { id: `card-${i}-${c.time}`, type, minute: parseInt(c.time,10)||0, teamCode, playerName: player||'?' }
  })
}

function buildSubEvents(
  subs: ApifbMatch['substitutions'],
  homeCode: string, awayCode: string
): LiveEvent[] {
  const events: LiveEvent[] = []
  if (!subs) return events
  const process = (list: ApifbSub[], teamCode: string) => {
    list.forEach((s, i) => {
      const parts = s.substitution.split('|').map(p => p.trim())
      events.push({
        id:            `sub-${teamCode}-${i}-${s.time}`,
        type:          'substitution',
        minute:        parseInt(s.time, 10) || 0,
        teamCode,
        playerName:    parts[0] || '?',   // player coming ON
        playerOutName: parts[1],           // player going OFF
      })
    })
  }
  process(subs.home ?? [], homeCode)
  process(subs.away ?? [], awayCode)
  return events
}

// ── Fixture mapper ────────────────────────────────────────────────

function mapMatch(raw: ApifbMatch, withEvents = false): LiveMatch {
  const status   = mapStatus(raw)
  const isLive   = status === 'live' || status === 'halftime'
  const homeCode = resolveTeamCode(raw.match_hometeam_name)
  const awayCode = resolveTeamCode(raw.match_awayteam_name)

  const match: LiveMatch = {
    id:       raw.match_id,
    date:     raw.match_date,
    time:     raw.match_time,
    timezone: 'UTC',
    status,
    minute:   isLive ? mapMinute(raw.match_status) : undefined,
    home: {
      id:        raw.match_hometeam_id,
      code:      homeCode,
      name:      raw.match_hometeam_name,
      shortName: homeCode,
      score:     parseScore(raw.match_hometeam_score),
    },
    away: {
      id:        raw.match_awayteam_id,
      code:      awayCode,
      name:      raw.match_awayteam_name,
      shortName: awayCode,
      score:     parseScore(raw.match_awayteam_score),
    },
    venue: {
      id:      `${raw.match_id}-venue`,
      name:    raw.match_stadium || 'Por confirmar',
      city:    raw.match_city   || '',
      country: raw.country_name,
    },
    competition: {
      id:        raw.league_id,
      name:      raw.league_name,
      shortName: raw.league_name.slice(0, 12),
      type:      mapCompType(raw.league_id),
    },
    round: raw.match_round,
  }

  if (withEvents) {
    const goals = buildGoalEvents(raw.goalscorer ?? [], homeCode, awayCode)
    const cards = buildCardEvents(raw.cards      ?? [], homeCode, awayCode)
    const subs  = buildSubEvents(raw.substitutions,      homeCode, awayCode)
    match.events = [...goals, ...cards, ...subs].sort((a, b) => a.minute - b.minute)
  }

  return match
}

// ── Provider ──────────────────────────────────────────────────────

export class ApifootballProvider implements LiveDataProvider {
  readonly id          = 'apifootball'
  readonly name        = 'apifootball.com v3'
  readonly description = 'Real-time football data via apiv3.apifootball.com'

  constructor(private readonly apiKey: string) {}

  private url(params: Record<string, string | number>): string {
    const p = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)])), APIkey: this.apiKey })
    return `${BASE}?${p.toString()}`
  }

  private async fetch<T>(params: Record<string, string | number>): Promise<T[]> {
    const res  = await fetch(this.url(params), { cache: 'no-store' })
    if (!res.ok) throw new Error(`apifootball.com HTTP ${res.status}`)
    const body = await res.json() as T[] | { error?: number; message?: string }
    if (!Array.isArray(body)) throw new Error(`apifootball.com error: ${JSON.stringify(body)}`)
    return body
  }

  async fetchMatches(options: FetchMatchesOptions): Promise<LiveMatch[]> {
    const { from, to, competitionType, teamCode } = options
    const leagueId = competitionType === 'world_cup' ? '28' : '356'

    const raw = await this.fetch<ApifbMatch>({ action: 'get_events', league_id: leagueId, from, to })
    let matches = raw.map(m => mapMatch(m))

    if (teamCode) {
      const code = teamCode.toUpperCase()
      matches = matches.filter(m => m.home.code === code || m.away.code === code)
    }

    return matches
  }

  async fetchMatchById(id: string): Promise<LiveMatch | null> {
    const raw = await this.fetch<ApifbMatch>({ action: 'get_events', match_id: id })
    if (!raw.length) return null
    return mapMatch(raw[0], true)  // withEvents=true for single match detail
  }

  async fetchLiveMatches(leagueId?: string): Promise<LiveMatch[]> {
    const params: Record<string, string | number> = { action: 'get_events', match_live: '1' }
    const raw = await this.fetch<ApifbMatch>(params)
    let matches = raw.map(m => mapMatch(m))
    if (leagueId) matches = matches.filter(m => m.competition.id === leagueId)
    return matches
  }
}
