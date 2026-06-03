// Quiniela Mundial 2026 — TypeScript Types
// Sprint 6A — Fundación

// ── Pool ─────────────────────────────────────────────────────────────

export type PoolType = 'global' | 'public' | 'private'

export interface Pool {
  id: string
  name: string
  type: PoolType
  invite_code: string | null
  created_by: string | null
  is_active: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PoolMember {
  id: string
  pool_id: string
  user_id: string
  joined_at: string
}

// ── Prediction ────────────────────────────────────────────────────────

export interface Prediction {
  id: string
  pool_id: string
  user_id: string
  /** Our static match ID — e.g. 'A-1-1', 'R32-1', 'FINAL' */
  match_id: string
  home_score_pred: number
  away_score_pred: number
  /** FIFA 3-letter code. Only populated for knockout-phase matches. */
  winner_pred: string | null
  created_at: string
  updated_at: string
  /** NULL = editable. NOT NULL = locked (match has started). */
  locked_at: string | null
}

/** Input validated client-side before calling savePrediction() */
export interface PredictionInput {
  matchId: string
  homeScorePred: number
  awayScorePred: number
  /** Required for knockout matches, omitted for group stage. */
  winnerPred?: string
}

export type PredictionStatus =
  | 'editable'    // match not started yet
  | 'locked'      // match started, prediction submitted
  | 'pending'     // match started, no prediction submitted
  | 'scored'      // result available, points calculated
  | 'no_pred'     // user made no prediction for this match

// ── Scoring ───────────────────────────────────────────────────────────

/**
 * Tier of the scoring result per match (Sistema B — Balanceado).
 * Group stage:
 *   exact       → 5 pts (exact scoreline)
 *   result_diff → 4 pts (correct result + correct goal difference)
 *   result      → 3 pts (correct result only)
 *   diff        → 1 pt  (correct goal difference, wrong result)
 *   none        → 0 pts
 * Knockout: winner + exact=6, winner + diff=5, winner=4, exact_only=2, diff_only=1, none=0
 */
export type ScoreTier = 'exact' | 'result_diff' | 'result' | 'diff' | 'none'

export interface UserMatchScore {
  id: string
  pool_id: string
  user_id: string
  match_id: string
  prediction_id: string | null
  home_score_real: number | null
  away_score_real: number | null
  winner_real: string | null
  base_points: number
  bonus_points: number
  /** Computed column: base_points + bonus_points */
  total_points: number
  score_tier: ScoreTier | null
  winner_correct: boolean | null
  scored_at: string
  scoring_run_id: string | null
}

// ── Standings ─────────────────────────────────────────────────────────

export interface Standing {
  id: string
  pool_id: string
  user_id: string
  total_points: number
  exact_count: number
  result_count: number
  diff_count: number
  winner_count: number
  total_preds: number
  rank: number | null
  rank_change: number
  updated_at: string
  // Joined from profiles (populated by getStandings)
  display_name?: string
}

// ── Scoring Run ───────────────────────────────────────────────────────

export type ScoringRunStatus = 'success' | 'partial' | 'error'
export type ScoringRunTrigger = 'cron' | 'manual' | 'api' | 'test'

export interface ScoringRun {
  id: string
  match_id: string
  home_score_final: number | null
  away_score_final: number | null
  winner_final: string | null
  predictions_evaluated: number
  users_scored: number
  run_at: string
  triggered_by: ScoringRunTrigger
  duration_ms: number | null
  status: ScoringRunStatus
  error_detail: string | null
}

// ── Service response wrappers ─────────────────────────────────────────

export interface QuinielaResult<T> {
  data: T | null
  error: string | null
}

export type SavePredictionError =
  | 'MATCH_LOCKED'      // kickoff already passed
  | 'INVALID_SCORE'     // score out of range (0-30)
  | 'INVALID_WINNER'    // winner_pred required for knockout but missing
  | 'NO_POOL'           // global pool not found (misconfigured)
  | 'NOT_AUTHENTICATED' // user not logged in
  | 'OFFLINE'           // offline mode — no Supabase
  | 'DB_ERROR'          // unexpected Supabase error

export interface SavePredictionResult {
  ok: boolean
  error?: SavePredictionError
  /** Populated on success */
  prediction?: Prediction
}

// ── Kickoff ───────────────────────────────────────────────────────────

export interface KickoffInfo {
  isLocked: boolean
  kickoffUTC: Date | null
  minutesUntilKickoff: number | null  // negative if in the past
}
