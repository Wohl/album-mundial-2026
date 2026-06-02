import type { LiveMatch } from '../types'
import { MockProvider } from '../providers/mock-provider'

// Swap this instance for a real provider (ApiFootballProvider, SportmonksProvider)
// when Phase 3b integrates live data. The service and UI layers need no changes.
const provider = new MockProvider()

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export async function getRecentFriendlies(): Promise<LiveMatch[]> {
  return provider.fetchMatches({
    from: dateOffset(-60),
    to: dateOffset(-1),
    competitionType: 'friendly',
  })
}

export async function getUpcomingFriendlies(): Promise<LiveMatch[]> {
  return provider.fetchMatches({
    from: dateOffset(0),
    to: dateOffset(30),
    competitionType: 'friendly',
  })
}

export async function getAllFriendlies(): Promise<LiveMatch[]> {
  return provider.fetchMatches({
    from: dateOffset(-60),
    to: dateOffset(30),
    competitionType: 'friendly',
  })
}

export async function getFriendliesByTeam(teamCode: string): Promise<LiveMatch[]> {
  return provider.fetchMatches({
    from: dateOffset(-60),
    to: dateOffset(30),
    competitionType: 'friendly',
    teamCode,
  })
}
