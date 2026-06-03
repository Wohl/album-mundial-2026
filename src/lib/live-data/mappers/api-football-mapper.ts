// Converts raw API-Football v3 JSON responses to internal LiveMatch / LiveEvent types.
// Isolated here so changes to the external API only touch this file.

import type {
  LiveMatch,
  LiveMatchStatus,
  LiveEvent,
  LiveEventType,
  CompetitionType,
} from '../types'
import { resolveTeamCode } from './team-code-map'

// ── Raw API-Football shapes (minimal — only what we use) ──────────

export interface ApiFbFixture {
  fixture: {
    id: number
    date: string           // ISO-8601: "2026-06-11T13:00:00-06:00"
    status: {
      short: string        // "NS" | "1H" | "HT" | "2H" | "ET" | "FT" | "PST" | "CANC" | ...
      elapsed: number | null
    }
    venue: {
      id: number | null
      name: string | null
      city: string | null
    } | null
  }
  league: {
    id: number
    name: string
    country: string
    round: string | null
    season: number
  }
  teams: {
    home: { id: number; name: string; winner: boolean | null }
    away: { id: number; name: string; winner: boolean | null }
  }
  goals: {
    home: number | null
    away: number | null
  }
}

export interface ApiFbEvent {
  time: { elapsed: number; extra: number | null }
  team: { id: number; name: string }
  player: { id: number | null; name: string | null }
  assist: { id: number | null; name: string | null }
  type: string     // "Goal" | "Card" | "subst" | "Var"
  detail: string   // "Normal Goal" | "Own Goal" | "Penalty" | "Yellow Card" | "Red Card" | ...
  comments: string | null
}

export interface ApiFbResponse<T> {
  response: T[]
  results: number
  errors: unknown
}

// ── Status mapping ────────────────────────────────────────────────

function mapStatus(short: string): LiveMatchStatus {
  switch (short) {
    case 'NS':
    case 'TBD':
      return 'upcoming'
    case '1H':
    case '2H':
    case 'ET':
    case 'BT':
    case 'P':
    case 'INT':
      return 'live'
    case 'HT':
      return 'halftime'
    case 'FT':
    case 'AET':
    case 'PEN':
    case 'AWD':
    case 'WO':
      return 'completed'
    case 'PST':
      return 'postponed'
    case 'CANC':
    case 'ABD':
    case 'SUSP':
      return 'cancelled'
    default:
      return 'upcoming'
  }
}

// ── Event mapping ─────────────────────────────────────────────────

function mapEventType(type: string, detail: string): LiveEventType | null {
  switch (type) {
    case 'Goal':
      if (detail === 'Own Goal')          return 'own_goal'
      if (detail === 'Penalty')           return 'penalty'
      if (detail === 'Missed Penalty')    return 'missed_penalty'
      return 'goal'
    case 'Card':
      if (detail === 'Yellow Card')             return 'yellow_card'
      if (detail === 'Red Card')                return 'red_card'
      if (detail === 'Yellow Card Second')      return 'yellow_red_card'
      return null
    case 'subst':
      return 'substitution'
    default:
      return null   // VAR, unknown — skip
  }
}

export function mapApiFbEvent(raw: ApiFbEvent, teamCode: string): LiveEvent | null {
  const type = mapEventType(raw.type, raw.detail)
  if (!type) return null

  // For substitutions API-Football puts playerOut in player field, playerIn in assist field
  const isSubst = type === 'substitution'
  const playerName: string = isSubst
    ? (raw.assist?.name ?? raw.player.name ?? '?')
    : (raw.player.name ?? '?')

  const base: LiveEvent = {
    id:         `${teamCode}-${raw.time.elapsed}-${type}-${raw.player.id ?? 0}`,
    type,
    minute:     raw.time.elapsed,
    teamCode,
    playerName,
  }

  if (raw.time.extra)                            base.extraTime    = raw.time.extra
  if (!isSubst && raw.assist?.name)              base.assistName   = raw.assist.name
  if (isSubst && raw.player.name)                base.playerOutName = raw.player.name

  return base
}

// ── Competition type resolver ─────────────────────────────────────

function mapCompetitionType(leagueId: number): CompetitionType {
  if (leagueId === 1)    return 'world_cup'
  if (leagueId === 9)    return 'friendly'
  if (leagueId === 4)    return 'continental'  // UEFA Euro
  if (leagueId === 6)    return 'continental'  // CONMEBOL Copa América
  return 'friendly'
}

// ── Fixture mapper ────────────────────────────────────────────────

export function mapApiFbFixture(raw: ApiFbFixture): LiveMatch {
  const status     = mapStatus(raw.fixture.status.short)
  const isLive     = status === 'live' || status === 'halftime'
  const homeCode   = resolveTeamCode(raw.teams.home.name)
  const awayCode   = resolveTeamCode(raw.teams.away.name)

  // Extract local date and time from the ISO-8601 string
  // e.g. "2026-06-11T13:00:00-06:00" → date: "2026-06-11", time: "13:00"
  const isoDate  = raw.fixture.date
  const datePart = isoDate.slice(0, 10)
  const timePart = isoDate.slice(11, 16)

  // Derive a short timezone label from the UTC offset in the ISO string
  // e.g. "-06:00" → "UTC-6"
  const offsetMatch = isoDate.match(/([+-]\d{2}:\d{2})$/)
  const tzLabel     = offsetMatch ? `UTC${offsetMatch[1].replace(':00', '')}` : 'UTC'

  return {
    id:       String(raw.fixture.id),
    date:     datePart,
    time:     timePart,
    timezone: tzLabel,
    status,
    minute:   isLive && raw.fixture.status.elapsed != null
                ? raw.fixture.status.elapsed
                : undefined,
    home: {
      id:        String(raw.teams.home.id),
      code:      homeCode,
      name:      raw.teams.home.name,
      shortName: homeCode,
      score:     raw.goals.home ?? undefined,
    },
    away: {
      id:        String(raw.teams.away.id),
      code:      awayCode,
      name:      raw.teams.away.name,
      shortName: awayCode,
      score:     raw.goals.away ?? undefined,
    },
    venue: {
      id:      String(raw.fixture.venue?.id ?? 0),
      name:    raw.fixture.venue?.name   ?? 'Por confirmar',
      city:    raw.fixture.venue?.city   ?? '',
      country: raw.league.country,
    },
    competition: {
      id:        String(raw.league.id),
      name:      raw.league.name,
      shortName: raw.league.name.slice(0, 12),
      type:      mapCompetitionType(raw.league.id),
    },
    round: raw.league.round ?? undefined,
  }
}

/** Maps an array of raw fixtures, silently skipping malformed entries. */
export function mapApiFbFixtures(raws: ApiFbFixture[]): LiveMatch[] {
  const results: LiveMatch[] = []
  for (const raw of raws) {
    try {
      results.push(mapApiFbFixture(raw))
    } catch {
      // Malformed entry — skip without crashing
    }
  }
  return results
}

/** Merges event data into an existing LiveMatch. */
export function mergeEvents(match: LiveMatch, rawEvents: ApiFbEvent[]): LiveMatch {
  const events: LiveEvent[] = []
  for (const raw of rawEvents) {
    const teamCode = resolveTeamCode(raw.team.name)
    const ev = mapApiFbEvent(raw, teamCode)
    if (ev) events.push(ev)
  }
  return { ...match, events }
}
