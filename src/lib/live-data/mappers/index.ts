import type { LiveMatch, LiveMatchStatus } from '../types'
import type { CalMatch, MatchStatus } from '@/lib/calendar-data'

// Maps LiveMatchStatus → CalMatch MatchStatus (drops 'halftime' / 'cancelled' not in CalMatch)
function toCalStatus(s: LiveMatchStatus): MatchStatus {
  if (s === 'live' || s === 'halftime') return 'live'
  if (s === 'cancelled') return 'postponed'
  return s as MatchStatus
}

// Converts a LiveMatch to a CalMatch so FriendliesView can optionally reuse MatchCard.
// phase is set to 'group' as a neutral value — friendlies have no tournament phase.
export function liveMatchToCalMatch(m: LiveMatch): CalMatch {
  return {
    id: m.id,
    date: m.date,
    time: m.time,
    timezone: m.timezone,
    stadium: m.venue.name,
    city: m.venue.city,
    home: { code: m.home.code, name: m.home.name, score: m.home.score },
    away: { code: m.away.code, name: m.away.name, score: m.away.score },
    phase: 'group',
    status: toCalStatus(m.status),
    minute: m.minute,
  }
}

export function liveMatchesToCalMatches(matches: LiveMatch[]): CalMatch[] {
  return matches.map(liveMatchToCalMatch)
}
