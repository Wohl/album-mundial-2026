// Quiniela configuration — client-safe constants only.
// Never import server-only secrets here (no API keys, no service role key).

/** Seconds before kickoff when predictions are locked. Default: 60s. */
export const LOCK_BUFFER_SECONDS = 60

/** Score range validation: 0 to this value inclusive. */
export const MAX_SCORE = 30

/**
 * Global pool ID from environment.
 * Set NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID after running quiniela_seed.sql.
 * The service degrades gracefully when this is absent (returns null pool).
 */
export const GLOBAL_POOL_ID: string =
  process.env.NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID ?? ''

/** True when the global pool env var is configured. */
export const isQuinielaConfigured = (): boolean => GLOBAL_POOL_ID.length > 0

/**
 * Scoring points per tier — Sistema B (Balanceado).
 * See QUINIELA_SCORING_PROPOSAL.md for full rules.
 */
export const SCORE_POINTS = {
  // Group stage tiers
  group: {
    exact:       5,
    result_diff: 4,
    result:      3,
    diff:        1,
    none:        0,
  },
  // Knockout stage tiers
  knockout: {
    winner_exact:  6,
    winner_diff:   5,
    winner:        4,
    exact_only:    2,
    diff_only:     1,
    none:          0,
  },
} as const

/** Phases that are part of the knockout stage (require winner_pred). */
export const KNOCKOUT_PHASES = new Set([
  'r32', 'r16', 'qf', 'sf', '3rd', 'final',
] as const)
