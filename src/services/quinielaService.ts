// Quiniela Service — Sprint 6A
// All Supabase access for quiniela goes through here.
// Follows the existing service pattern: isOfflineMode check + typed returns.
//
// NOTE: These functions are safe to call from client components.
// The Supabase anon key enforces RLS on every call.
// The Route Handler (/api/quiniela/predictions) adds the kickoff lock check
// for write operations (server-side authority).

import { supabase, isOfflineMode } from '@/lib/supabase'
import { isMatchLocked, getKickoffInfo } from '@/lib/quiniela/kickoff'
import { GLOBAL_POOL_ID, isQuinielaConfigured, MAX_SCORE, KNOCKOUT_PHASES } from '@/lib/quiniela/config'
import type {
  Pool,
  PoolMember,
  Prediction,
  PredictionInput,
  Standing,
  SavePredictionResult,
  QuinielaResult,
} from '@/types/quiniela'
import type { Phase } from '@/lib/calendar-data'

// ── Internal helper ───────────────────────────────────────────────────

function offlineResult<T>(): QuinielaResult<T> {
  return { data: null, error: 'OFFLINE' }
}

// ── Pool ─────────────────────────────────────────────────────────────

/**
 * Returns the active global pool.
 * Uses env var GLOBAL_POOL_ID if set (one query by PK),
 * otherwise falls back to querying by type='global' (slightly slower).
 */
export async function getGlobalPool(): Promise<QuinielaResult<Pool>> {
  if (isOfflineMode) return offlineResult()

  try {
    let query = supabase.from('pools').select('*').eq('is_active', true)

    if (isQuinielaConfigured()) {
      query = query.eq('id', GLOBAL_POOL_ID)
    } else {
      query = query.eq('type', 'global')
    }

    const { data, error } = await query.maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: data as Pool | null, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// ── Pool membership ───────────────────────────────────────────────────

/**
 * Auto-joins the user to the global pool if they are not already a member.
 * Called transparently when the user saves their first prediction.
 */
export async function joinGlobalPool(
  userId: string
): Promise<QuinielaResult<PoolMember>> {
  if (isOfflineMode) return offlineResult()

  const poolResult = await getGlobalPool()
  if (!poolResult.data) return { data: null, error: poolResult.error ?? 'NO_POOL' }
  const poolId = poolResult.data.id

  try {
    // Upsert — idempotent join
    const { data, error } = await supabase
      .from('pool_members')
      .upsert({ pool_id: poolId, user_id: userId }, { onConflict: 'pool_id,user_id' })
      .select()
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return { data: data as PoolMember | null, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// ── Predictions ───────────────────────────────────────────────────────

/**
 * Returns all predictions made by a user in the global pool,
 * sorted by match_id ascending.
 */
export async function getUserPredictions(
  userId: string
): Promise<QuinielaResult<Prediction[]>> {
  if (isOfflineMode) return offlineResult()

  const poolResult = await getGlobalPool()
  if (!poolResult.data) return { data: null, error: poolResult.error ?? 'NO_POOL' }

  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('pool_id', poolResult.data.id)
      .order('match_id', { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Prediction[], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/**
 * Returns the prediction for a specific match, or null if not made.
 */
export async function getPrediction(
  userId: string,
  matchId: string
): Promise<QuinielaResult<Prediction | null>> {
  if (isOfflineMode) return offlineResult()

  const poolResult = await getGlobalPool()
  if (!poolResult.data) return { data: null, error: poolResult.error ?? 'NO_POOL' }

  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('pool_id', poolResult.data.id)
      .eq('match_id', matchId)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return { data: data as Prediction | null, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/**
 * Saves (creates or updates) a prediction.
 *
 * Validation layers:
 *   1. Offline mode check
 *   2. Auth: userId must be present
 *   3. Score range: 0–MAX_SCORE
 *   4. Kickoff lock: server-side check via calendar-data.ts
 *   5. Knockout winner: required when match is in knockout phase
 *   6. Supabase upsert (RLS enforces locked_at IS NULL server-side)
 *
 * Auto-joins the user to the global pool if needed.
 */
export async function savePrediction(
  userId: string,
  input: PredictionInput,
  matchPhase?: Phase
): Promise<SavePredictionResult> {
  if (isOfflineMode) return { ok: false, error: 'OFFLINE' }
  if (!userId) return { ok: false, error: 'NOT_AUTHENTICATED' }

  // Validate score range
  const { homeScorePred: h, awayScorePred: a } = input
  if (
    !Number.isInteger(h) || h < 0 || h > MAX_SCORE ||
    !Number.isInteger(a) || a < 0 || a > MAX_SCORE
  ) {
    return { ok: false, error: 'INVALID_SCORE' }
  }

  // Validate kickoff lock (server-side authority: calendar-data.ts)
  if (isMatchLocked(input.matchId)) {
    return { ok: false, error: 'MATCH_LOCKED' }
  }

  // Validate winner_pred for knockout phases
  if (matchPhase && KNOCKOUT_PHASES.has(matchPhase as Parameters<typeof KNOCKOUT_PHASES['has']>[0])) {
    if (!input.winnerPred || input.winnerPred.trim().length !== 3) {
      return { ok: false, error: 'INVALID_WINNER' }
    }
  }

  // Ensure user is in the global pool
  const joinResult = await joinGlobalPool(userId)
  if (joinResult.error && joinResult.error !== 'OFFLINE') {
    // Non-fatal: proceed even if join fails (pool membership is best-effort)
    console.warn('[quinielaService] joinGlobalPool failed:', joinResult.error)
  }

  const poolResult = await getGlobalPool()
  if (!poolResult.data) return { ok: false, error: 'NO_POOL' }
  const poolId = poolResult.data.id

  try {
    const { data, error } = await supabase
      .from('predictions')
      .upsert(
        {
          pool_id:         poolId,
          user_id:         userId,
          match_id:        input.matchId,
          home_score_pred: input.homeScorePred,
          away_score_pred: input.awayScorePred,
          winner_pred:     input.winnerPred ?? null,
          updated_at:      new Date().toISOString(),
        },
        { onConflict: 'pool_id,user_id,match_id' }
      )
      .select()
      .maybeSingle()

    if (error) return { ok: false, error: 'DB_ERROR' }
    return { ok: true, prediction: data as Prediction }
  } catch {
    return { ok: false, error: 'DB_ERROR' }
  }
}

// ── Standings ─────────────────────────────────────────────────────────

/**
 * Returns the top-N standings + the requesting user's own standing.
 * Joins display_name from profiles.
 *
 * @param limit    Number of top entries to return (default 10)
 * @param userId   When provided, also fetches the user's own row
 */
export async function getStandings(
  limit = 10,
  userId?: string
): Promise<QuinielaResult<Standing[]>> {
  if (isOfflineMode) return offlineResult()

  const poolResult = await getGlobalPool()
  if (!poolResult.data) return { data: null, error: poolResult.error ?? 'NO_POOL' }
  const poolId = poolResult.data.id

  try {
    // Top-N
    const { data: topRows, error: topErr } = await supabase
      .from('standings')
      .select(`
        *,
        profiles ( display_name )
      `)
      .eq('pool_id', poolId)
      .order('total_points', { ascending: false })
      .order('exact_count',  { ascending: false })
      .limit(limit)

    if (topErr) return { data: null, error: topErr.message }

    let rows = (topRows ?? []) as (Standing & { profiles: { display_name: string } | null })[]

    // If userId provided and not already in top-N, fetch their row separately
    if (userId && !rows.some(r => r.user_id === userId)) {
      const { data: myRow } = await supabase
        .from('standings')
        .select(`*, profiles ( display_name )`)
        .eq('pool_id', poolId)
        .eq('user_id', userId)
        .maybeSingle()

      if (myRow) rows = [...rows, myRow as typeof rows[number]]
    }

    const standings: Standing[] = rows.map(r => ({
      ...r,
      display_name: r.profiles?.display_name ?? 'Usuario',
    }))

    return { data: standings, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// ── Kickoff helpers (re-exported for convenience) ─────────────────────

export { getKickoffInfo, isMatchLocked, getMatchesClosingSoon } from '@/lib/quiniela/kickoff'
