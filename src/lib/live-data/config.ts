// Live Data configuration — server-side only.
// Never import this file from a 'use client' component.
// All values come from environment variables with safe defaults.

export const LIVE_DATA_CONFIG = {
  // ── Provider selection ────────────────────────────────────────
  // Supported: 'apifootball' (apiv3.apifootball.com) | 'api-football' (v3.football.api-sports.io)
  // Detected automatically from key length: 64-char hex → apifootball.com
  provider: (process.env.LIVE_DATA_PROVIDER as 'apifootball' | 'api-football' | undefined)
    ?? ((process.env.API_FOOTBALL_KEY?.length ?? 0) === 64 ? 'apifootball' : 'api-football'),

  // ── Credentials ───────────────────────────────────────────────
  // Set API_FOOTBALL_KEY in .env.local (never NEXT_PUBLIC_)
  apiFootballKey:    process.env.API_FOOTBALL_KEY ?? null,

  // ── Base URLs ─────────────────────────────────────────────────
  apiFootballBase:   'https://v3.football.api-sports.io',
  apifootballBase:   'https://apiv3.apifootball.com/',

  // ── League IDs (api-football.com) ────────────────────────────
  wcLeagueId:        Number(process.env.API_FOOTBALL_WC_LEAGUE_ID       ?? '1'),
  friendlyLeagueId:  Number(process.env.API_FOOTBALL_FRIENDLY_LEAGUE_ID ?? '9'),

  // ── League IDs (apifootball.com) — validated Sprint 3 ────────
  // WC2026:               league_id=28  ('World Cup - World Championship')
  // International friendlies: league_id=356  ('Friendlies')
  apifbWcLeagueId:       process.env.APIFB_WC_LEAGUE_ID       ?? '28',
  apifbFriendlyLeagueId: process.env.APIFB_FRIENDLY_LEAGUE_ID ?? '356',

  // ── Cache TTLs (seconds) ──────────────────────────────────────
  cacheTtlLive:    Number(process.env.LIVE_DATA_CACHE_TTL_LIVE    ?? '60'),    // 60 s
  cacheTtlFixture: Number(process.env.LIVE_DATA_CACHE_TTL_FIXTURE ?? '3600'),  // 1 h
  cacheTtlStale:   Number(process.env.LIVE_DATA_CACHE_TTL_STALE   ?? '86400'), // 24 h

  // ── Polling interval (ms, used by client hooks) ───────────────
  pollIntervalLive:    Number(process.env.LIVE_DATA_POLL_INTERVAL_MS   ?? '60000'),  // 60 s
  pollIntervalIdle:    Number(process.env.LIVE_DATA_POLL_IDLE_MS        ?? '300000'), // 5 min
} as const

/** Returns true when a real API key is configured. */
export function isApiEnabled(): boolean {
  return !!LIVE_DATA_CONFIG.apiFootballKey
}

/** Builds the Cache-Control header value for a Route Handler response. */
export function cacheHeader(hasLive: boolean): string {
  const ttl   = hasLive ? LIVE_DATA_CONFIG.cacheTtlLive    : LIVE_DATA_CONFIG.cacheTtlFixture
  const stale = hasLive ? LIVE_DATA_CONFIG.cacheTtlLive * 2 : LIVE_DATA_CONFIG.cacheTtlStale
  return `public, s-maxage=${ttl}, stale-while-revalidate=${stale}`
}
