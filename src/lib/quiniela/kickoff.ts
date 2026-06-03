// Kickoff lock validation — uses calendar-data.ts as the single source of truth.
// No network calls. Pure date arithmetic.
// Safe to import in both client and server components.

import { WC2026_MATCHES } from '@/lib/calendar-data'
import { LOCK_BUFFER_SECONDS } from '@/lib/quiniela/config'
import type { KickoffInfo } from '@/types/quiniela'

/**
 * UTC offset in hours for each timezone abbreviation used in calendar-data.ts.
 *
 * All North American venues are in DST during June–July 2026:
 *   ET = Eastern Daylight Time  = UTC-4
 *   CT = Central Daylight Time  = UTC-5
 *   MT = Mountain Daylight Time = UTC-6
 *   PT = Pacific Daylight Time  = UTC-7
 *
 * Non-DST zones used for reference matches or friendlies:
 *   UTC = UTC+0
 *   CET = Central European Time = UTC+1 (already in CEST=+2 in summer,
 *         but WC2026 venues don't use CET — included as safe fallback)
 *   BRT = Brasília Time = UTC-3
 */
const TIMEZONE_OFFSET_HOURS: Record<string, number> = {
  ET:  -4,
  CT:  -5,
  MT:  -6,
  PT:  -7,
  UTC:  0,
  CET:  1,
  BRT: -3,
}

/**
 * Converts a CalMatch's local date+time+timezone to a UTC Date object.
 *
 * @param date       'YYYY-MM-DD' local date at the venue
 * @param time       'HH:MM'      local time at the venue
 * @param timezone   short label  'ET' | 'CT' | 'MT' | 'PT' | 'UTC'
 */
export function toUTC(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute]     = time.split(':').map(Number)
  const offsetHours        = TIMEZONE_OFFSET_HOURS[timezone] ?? 0

  // Local time → UTC: subtract the offset (e.g., CT is UTC-5, so add 5h)
  return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute))
}

/**
 * Returns full kickoff info for a match by its static ID.
 *
 * isLocked = true when:
 *   now() >= kickoffUTC - LOCK_BUFFER_SECONDS
 *
 * If matchId is not found, returns isLocked=true as safe default.
 */
export function getKickoffInfo(matchId: string): KickoffInfo {
  const match = WC2026_MATCHES.find(m => m.id === matchId)

  if (!match) {
    return { isLocked: true, kickoffUTC: null, minutesUntilKickoff: null }
  }

  const kickoffUTC = toUTC(match.date, match.time, match.timezone)
  const nowMs      = Date.now()
  const lockThreshold = kickoffUTC.getTime() - LOCK_BUFFER_SECONDS * 1000
  const isLocked   = nowMs >= lockThreshold
  const minutesUntilKickoff = Math.floor((kickoffUTC.getTime() - nowMs) / 60_000)

  return { isLocked, kickoffUTC, minutesUntilKickoff }
}

/**
 * Quick boolean check — use when you only need locked/not-locked.
 */
export function isMatchLocked(matchId: string): boolean {
  return getKickoffInfo(matchId).isLocked
}

/**
 * Returns all match IDs whose kickoff is within the next `windowMinutes`.
 * Useful for the client to show "closing soon" warnings.
 */
export function getMatchesClosingSoon(windowMinutes = 30): string[] {
  return WC2026_MATCHES
    .filter(m => {
      const { minutesUntilKickoff, isLocked } = getKickoffInfo(m.id)
      return (
        !isLocked &&
        minutesUntilKickoff !== null &&
        minutesUntilKickoff >= 0 &&
        minutesUntilKickoff <= windowMinutes
      )
    })
    .map(m => m.id)
}
