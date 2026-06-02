// Live Data Foundation — provider-agnostic TypeScript contracts
// These types represent any football match from any external data source.
// The mapper layer (mappers/index.ts) converts these to internal CalMatch when needed.

export type LiveMatchStatus =
  | 'upcoming'
  | 'live'
  | 'halftime'
  | 'completed'
  | 'postponed'
  | 'cancelled'

export type CompetitionType =
  | 'friendly'
  | 'qualifier'
  | 'continental'
  | 'world_cup'
  | 'nations_league'

export interface LiveTeam {
  id: string
  code: string       // FIFA 3-letter code ('ARG', 'BRA', 'MEX', etc.)
  name: string
  shortName: string
  score?: number     // defined only when status !== 'upcoming'
}

export interface LiveVenue {
  id: string
  name: string
  city: string
  country: string
  capacity?: number
}

export interface LiveCompetition {
  id: string
  name: string
  shortName: string
  type: CompetitionType
}

export interface LiveMatch {
  id: string
  date: string              // 'YYYY-MM-DD'
  time: string              // 'HH:MM' local time at venue
  timezone: string          // short label: 'UTC', 'ET', 'CT', 'PT', 'CET', 'BRT', etc.
  status: LiveMatchStatus
  minute?: number           // current match minute (live matches only)
  home: LiveTeam
  away: LiveTeam
  venue: LiveVenue
  competition: LiveCompetition
  round?: string
  attendance?: number
}

// Options accepted by all provider implementations
export interface FetchMatchesOptions {
  from: string              // 'YYYY-MM-DD'
  to: string                // 'YYYY-MM-DD'
  competitionType?: CompetitionType
  teamCode?: string
}
