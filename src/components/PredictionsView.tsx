'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TeamFlag } from '@/components/TeamFlag'
import { usePredictions, PredictionEntry } from '@/hooks/usePredictions'
import { useLiveWc } from '@/hooks/useLiveWc'
import { getKickoffInfo, toUTC } from '@/lib/quiniela/kickoff'
import {
  WC2026_MATCHES,
  CalMatch,
  PHASE_LABELS,
  sortByDate,
  groupByDate,
} from '@/lib/calendar-data'
import type { LiveMatch } from '@/lib/live-data/types'

// ── Types ──────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'upcoming' | 'predicted' | 'final'
type ResultStatus = 'exact' | 'result' | 'wrong'

// ── Helpers ────────────────────────────────────────────────────────────

function getResultStatus(
  pred: { home: number; away: number },
  real: { home: number; away: number }
): ResultStatus {
  if (pred.home === real.home && pred.away === real.away) return 'exact'
  const outcome = (h: number, a: number) => h > a ? 'H' : h < a ? 'A' : 'D'
  return outcome(pred.home, pred.away) === outcome(real.home, real.away) ? 'result' : 'wrong'
}

/**
 * Convert a match's local venue time to the user's browser local time.
 * Uses toUTC from kickoff.ts then reformats via Intl.
 * Falls back to the original time+timezone label if conversion fails.
 */
function formatLocalKickoff(date: string, time: string, timezone: string): string {
  try {
    const utcDate = toUTC(date, time, timezone)
    return utcDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return `${time} ${timezone}`
  }
}

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

/** Sanitize numeric input: digits only, max 2 chars, clamp 0–30 */
function sanitizeScore(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 2)
  if (!digits) return ''
  const n = parseInt(digits, 10)
  return String(Math.min(n, 30))
}

// ── ResultBadge ────────────────────────────────────────────────────────

function ResultBadge({ status }: { status: ResultStatus }) {
  if (status === 'exact') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
      ✅ Marcador exacto
    </span>
  )
  if (status === 'result') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: 'rgba(245,197,66,0.1)', color: '#F5C542', border: '1px solid rgba(245,197,66,0.22)' }}>
      ✅ Resultado acertado
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(252,165,165,0.8)', border: '1px solid rgba(239,68,68,0.18)' }}>
      ❌ No acertado
    </span>
  )
}

// ── CommunityPredictionsPanel (stub — hidden until Social Sprint C) ────

interface CommunityData {
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  totalPredictions: number
}

function CommunityBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-8 shrink-0 text-right tabular-nums font-semibold"
        style={{ color: 'rgba(163,181,211,0.6)' }}>{pct}%</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(42,60,90,0.4)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="flex-1 min-w-0 truncate" style={{ color: 'rgba(185,205,230,0.65)' }}>{label}</span>
    </div>
  )
}

function CommunityPredictionsPanel({
  match,
  data,
}: {
  match: CalMatch
  data?: CommunityData
}) {
  if (!data) return null  // hidden until Social Sprint C provides real data
  return (
    <div className="mt-2.5 pt-2.5 space-y-2" style={{ borderTop: '1px solid rgba(42,60,90,0.22)' }}>
      <p className="text-[9px] uppercase tracking-wider flex items-center gap-1.5"
        style={{ color: 'rgba(163,181,211,0.4)' }}>
        <span>👥</span>
        <span>Predicciones · {data.totalPredictions} usuarios</span>
      </p>
      <CommunityBar label={match.home.name} pct={data.homeWinPct} color="rgba(125,211,252,0.65)" />
      <CommunityBar label="Empate" pct={data.drawPct} color="rgba(163,181,211,0.4)" />
      <CommunityBar label={match.away.name} pct={data.awayWinPct} color="rgba(245,197,66,0.65)" />
    </div>
  )
}

// ── PredictionCard ─────────────────────────────────────────────────────

function PredictionCard({
  match,
  prediction,
  liveMatch,
  onSave,
  onRemove,
}: {
  match: CalMatch
  prediction: PredictionEntry | null
  liveMatch: LiveMatch | undefined
  onSave: (matchId: string, h: number, a: number) => boolean
  onRemove: (matchId: string) => void
}) {
  const [homeVal, setHomeVal] = useState<string>(
    prediction != null ? String(prediction.homeScore) : ''
  )
  const [awayVal, setAwayVal] = useState<string>(
    prediction != null ? String(prediction.awayScore) : ''
  )
  const [justSaved, setJustSaved] = useState(false)

  // Sync inputs when prediction updates (e.g., after initial localStorage load)
  useEffect(() => {
    if (prediction != null) {
      setHomeVal(String(prediction.homeScore))
      setAwayVal(String(prediction.awayScore))
    }
  // Only re-sync on a new save (savedAt changes), not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction?.savedAt])

  const { isLocked, minutesUntilKickoff } = getKickoffInfo(match.id)
  const isFinal = match.phase === 'final'

  const phaseLabel = match.phase === 'group'
    ? match.group
      ? `Grupo ${match.group}${match.matchday ? ` · J${match.matchday}` : ''}`
      : 'Grupos'
    : PHASE_LABELS[match.phase]

  // Kickoff time in user's local timezone
  const localTime = formatLocalKickoff(match.date, match.time, match.timezone)

  // Real score from live API (only when today's match is completed)
  const realScore =
    liveMatch?.status === 'completed' &&
    liveMatch.home.score !== undefined &&
    liveMatch.away.score !== undefined
      ? { home: liveMatch.home.score, away: liveMatch.away.score }
      : null

  const resultStatus: ResultStatus | null =
    realScore && prediction
      ? getResultStatus(
          { home: prediction.homeScore, away: prediction.awayScore },
          realScore
        )
      : null

  // Derived state for button logic
  const hasValues = homeVal !== '' && awayVal !== ''
  const hasChanges = prediction
    ? homeVal !== String(prediction.homeScore) || awayVal !== String(prediction.awayScore)
    : hasValues

  const handleSave = () => {
    if (!hasValues) return
    const h = parseInt(homeVal, 10)
    const a = parseInt(awayVal, 10)
    if (isNaN(h) || isNaN(a)) return
    const ok = onSave(match.id, h, a)
    if (ok) {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1800)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
  }

  // Card border color — green when live, gold for final, blue when predicted, default otherwise
  const borderColor = isFinal
    ? 'rgba(245,197,66,0.45)'
    : resultStatus === 'exact'  ? 'rgba(74,222,128,0.4)'
    : resultStatus === 'result' ? 'rgba(245,197,66,0.3)'
    : resultStatus === 'wrong'  ? 'rgba(239,68,68,0.2)'
    : isLocked && prediction    ? 'rgba(100,116,139,0.35)'
    : prediction && !hasChanges ? 'rgba(56,189,248,0.28)'
    : 'rgba(42,60,90,0.55)'

  const days = daysUntil(match.date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(14,24,46,0.97) 0%, rgba(10,18,36,0.99) 100%)',
        borderColor,
        boxShadow: isFinal
          ? '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,197,66,0.07)'
          : '0 2px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* Gold shimmer for final */}
      {isFinal && (
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,197,66,0.9),transparent)' }} />
      )}

      <div className="p-4 space-y-3">

        {/* ── Header: phase + time + lock badge ─────────────────── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0"
            style={{
              color: isFinal ? '#FFD700' : '#F5C542',
              background: isFinal ? 'rgba(255,215,0,0.12)' : 'rgba(245,197,66,0.08)',
              border: `1px solid ${isFinal ? 'rgba(255,215,0,0.28)' : 'rgba(245,197,66,0.18)'}`,
            }}>
            {phaseLabel}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {!isLocked && (
              <>
                {days > 0 && days <= 21 && (
                  <span className="text-[9px] font-semibold uppercase tracking-wider"
                    style={{ color: 'rgba(125,211,252,0.65)' }}>
                    en {days}d
                  </span>
                )}
                <span className="text-[10px] tabular-nums font-semibold"
                  style={{ color: 'rgba(163,181,211,0.6)' }}>
                  {localTime}
                  <span className="text-[8px] ml-1 opacity-60">hora local</span>
                </span>
              </>
            )}

            {isLocked && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: 'rgba(100,116,139,0.85)',
                  background: 'rgba(30,42,60,0.6)',
                  border: '1px solid rgba(100,116,139,0.25)',
                }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Predicciones cerradas
              </span>
            )}
          </div>
        </div>

        {/* ── Teams + score center ───────────────────────────────── */}
        <div className="flex items-center gap-2 py-1">

          {/* Home team — vertical stack, wraps on long names */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamFlag code={match.home.code} className="text-3xl shrink-0" />
            <span
              className="text-xs font-bold text-center leading-snug"
              style={{ color: match.home.code === 'TBD' ? 'rgba(163,181,211,0.28)' : '#E5E7EB', maxWidth: '96px' }}>
              {match.home.name}
            </span>
          </div>

          {/* Center — inputs or locked read-only */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            {!isLocked ? (
              <>
                {/* "Tu predicción" label */}
                <span className="text-[9px] uppercase tracking-widest font-semibold"
                  style={{ color: 'rgba(125,211,252,0.5)' }}>
                  Tu predicción
                </span>

                {/* Score inputs — type="text" for reliable centering */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={homeVal}
                    onChange={e => setHomeVal(sanitizeScore(e.target.value))}
                    onKeyDown={handleKey}
                    aria-label={`Goles ${match.home.name}`}
                    placeholder="–"
                    className="rounded-xl border outline-none transition-all font-display font-bold focus-visible:ring-2 focus-visible:ring-sky-400/40"
                    style={{
                      width: '48px',
                      height: '48px',
                      fontSize: '22px',
                      textAlign: 'center',
                      lineHeight: '1',
                      padding: '0',
                      background: 'rgba(10,18,36,0.9)',
                      borderColor: homeVal !== '' ? 'rgba(125,211,252,0.5)' : 'rgba(52,72,110,0.6)',
                      color: '#E5E7EB',
                      caretColor: 'rgba(125,211,252,0.8)',
                    }}
                  />
                  <span className="font-display text-xl" style={{ color: 'rgba(163,181,211,0.25)' }}>–</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={awayVal}
                    onChange={e => setAwayVal(sanitizeScore(e.target.value))}
                    onKeyDown={handleKey}
                    aria-label={`Goles ${match.away.name}`}
                    placeholder="–"
                    className="rounded-xl border outline-none transition-all font-display font-bold focus-visible:ring-2 focus-visible:ring-sky-400/40"
                    style={{
                      width: '48px',
                      height: '48px',
                      fontSize: '22px',
                      textAlign: 'center',
                      lineHeight: '1',
                      padding: '0',
                      background: 'rgba(10,18,36,0.9)',
                      borderColor: awayVal !== '' ? 'rgba(125,211,252,0.5)' : 'rgba(52,72,110,0.6)',
                      color: '#E5E7EB',
                      caretColor: 'rgba(125,211,252,0.8)',
                    }}
                  />
                </div>
              </>
            ) : (
              /* Locked: show prediction read-only or "sin predicción" */
              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <span className="text-[9px] uppercase tracking-widest font-semibold"
                  style={{ color: 'rgba(163,181,211,0.35)' }}>
                  Tu predicción
                </span>
                {prediction ? (
                  <span className="text-2xl font-display tabular-nums font-bold"
                    style={{ color: 'rgba(185,205,230,0.65)' }}>
                    {prediction.homeScore} – {prediction.awayScore}
                  </span>
                ) : (
                  <span className="text-[11px] text-center"
                    style={{ color: 'rgba(100,116,139,0.55)' }}>
                    Sin predicción
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Away team — vertical stack */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamFlag code={match.away.code} className="text-3xl shrink-0" />
            <span
              className="text-xs font-bold text-center leading-snug"
              style={{ color: match.away.code === 'TBD' ? 'rgba(163,181,211,0.28)' : '#E5E7EB', maxWidth: '96px' }}>
              {match.away.name}
            </span>
          </div>
        </div>

        {/* ── Result comparison (completed match) ────────────────── */}
        {realScore && prediction && (
          <div className="pt-2 border-t flex items-center justify-between gap-3 flex-wrap"
            style={{ borderColor: 'rgba(42,60,90,0.28)' }}>
            <span className="text-[11px]" style={{ color: 'rgba(163,181,211,0.5)' }}>
              Real: <span className="font-bold tabular-nums" style={{ color: '#E5E7EB' }}>
                {realScore.home} – {realScore.away}
              </span>
            </span>
            {resultStatus && <ResultBadge status={resultStatus} />}
          </div>
        )}

        {/* ── Action section ─────────────────────────────────────── */}
        {!isLocked && (
          <div className="pt-1 space-y-1.5">
            <AnimatePresence mode="wait">
              {justSaved ? (
                // Saved feedback
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="w-full py-2.5 rounded-xl text-[11px] font-bold text-center"
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    color: '#4ade80',
                    border: '1px solid rgba(74,222,128,0.25)',
                  }}>
                  ✓ Predicción guardada
                </motion.div>
              ) : prediction && !hasChanges ? (
                // Resting state: prediction saved, no changes
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold flex items-center gap-1.5"
                    style={{ color: 'rgba(125,211,252,0.7)' }}>
                    🎯 {prediction.homeScore}–{prediction.awayScore} guardado
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(match.id)}
                    aria-label="Borrar predicción"
                    className="text-[10px] px-2 py-1 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                    style={{ color: 'rgba(163,181,211,0.4)', borderColor: 'rgba(42,60,90,0.35)', background: 'transparent' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(252,165,165,0.7)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.25)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(163,181,211,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(42,60,90,0.35)' }}>
                    Borrar
                  </button>
                </motion.div>
              ) : (
                // Save / Update button
                <motion.button
                  key="save"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  type="button"
                  onClick={handleSave}
                  disabled={!hasValues}
                  aria-label={prediction ? 'Actualizar predicción' : 'Guardar predicción'}
                  className="w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 disabled:opacity-35 disabled:cursor-not-allowed"
                  style={hasValues ? {
                    background: hasChanges
                      ? 'linear-gradient(135deg, rgba(245,197,66,0.12), rgba(255,215,0,0.08))'
                      : 'rgba(56,189,248,0.07)',
                    borderColor: hasChanges ? 'rgba(245,197,66,0.45)' : 'rgba(56,189,248,0.25)',
                    color: hasChanges ? '#F5C542' : 'rgba(125,211,252,0.9)',
                    boxShadow: hasChanges ? '0 0 16px rgba(245,197,66,0.08)' : 'none',
                  } : {
                    background: 'rgba(14,24,44,0.6)',
                    borderColor: 'rgba(42,60,90,0.4)',
                    color: 'rgba(163,181,211,0.4)',
                  }}>
                  {prediction ? '↑ Actualizar predicción' : 'Guardar predicción'}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Prompt when inputs are empty */}
            {!hasValues && !prediction && (
              <p className="text-center text-[9px]" style={{ color: 'rgba(163,181,211,0.35)' }}>
                Ingresá un marcador para guardar
              </p>
            )}
          </div>
        )}

        {/* ── Community predictions (hidden — Social Sprint C) ────── */}
        {isLocked && (
          <CommunityPredictionsPanel
            match={match}
            data={undefined}  // Will be connected in Social Sprint C
          />
        )}

      </div>
    </motion.div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────

export function PredictionsView() {
  const { predictions, loaded, save, remove, count } = usePredictions()
  const { liveByKey } = useLiveWc()
  const [filterTab, setFilterTab] = useState<FilterTab>('upcoming')

  const getLiveMatch = useCallback((match: CalMatch): LiveMatch | undefined =>
    liveByKey.get(`${match.home.code}-${match.away.code}`)
  , [liveByKey])

  // Aggregate stats across completed matches with real scores
  const stats = useMemo(() => {
    let exact = 0, correct = 0, wrong = 0
    for (const match of WC2026_MATCHES) {
      const pred = predictions[match.id]
      if (!pred) continue
      const live = getLiveMatch(match)
      if (!live || live.status !== 'completed' ||
          live.home.score === undefined || live.away.score === undefined) continue
      const s = getResultStatus(
        { home: pred.homeScore, away: pred.awayScore },
        { home: live.home.score, away: live.away.score }
      )
      if (s === 'exact') exact++
      else if (s === 'result') correct++
      else wrong++
    }
    return { exact, correct, wrong, scored: exact + correct + wrong }
  }, [predictions, getLiveMatch])

  const filteredMatches = useMemo((): CalMatch[] => {
    if (filterTab === 'all') return sortByDate(WC2026_MATCHES)

    if (filterTab === 'upcoming') {
      return sortByDate(WC2026_MATCHES.filter(m => !getKickoffInfo(m.id).isLocked))
    }
    if (filterTab === 'predicted') {
      return sortByDate(WC2026_MATCHES.filter(m => !!predictions[m.id]))
    }
    // 'final' — matches with real scores (most recent first)
    return sortByDate(
      WC2026_MATCHES.filter(m => {
        const live = getLiveMatch(m)
        return live?.status === 'completed'
      })
    ).reverse()
  }, [filterTab, predictions, getLiveMatch])

  const matchesByDate = useMemo(() => groupByDate(filteredMatches), [filteredMatches])

  const tabCounts = useMemo(() => ({
    upcoming:  WC2026_MATCHES.filter(m => !getKickoffInfo(m.id).isLocked).length,
    predicted: count,
    final:     WC2026_MATCHES.filter(m => getLiveMatch(m)?.status === 'completed').length,
  }), [count, getLiveMatch])

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'all',       label: 'Todos',            count: WC2026_MATCHES.length },
    { id: 'upcoming',  label: 'Por predecir',     count: tabCounts.upcoming },
    { id: 'predicted', label: 'Mis predicciones', count: tabCounts.predicted > 0 ? tabCounts.predicted : undefined },
    { id: 'final',     label: 'Finalizados',      count: tabCounts.final > 0 ? tabCounts.final : undefined },
  ]

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-sky-400/20 border-t-sky-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h2 className="font-display tracking-widest uppercase leading-none"
          style={{
            fontSize: 'clamp(22px, 3.5vw, 30px)',
            background: 'linear-gradient(135deg, rgba(125,211,252,0.95), rgba(56,189,248,0.85))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          🎯 Mis Predicciones
        </h2>
        <p className="text-sm tracking-wide" style={{ color: 'rgba(185,205,230,0.65)' }}>
          Mundial 2026 · Se guardan en este dispositivo · Horarios en hora local
        </p>

        {count > 0 && (
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: 'rgba(125,211,252,0.8)' }}>
              {count} {count === 1 ? 'predicción' : 'predicciones'}
            </span>
            {stats.scored > 0 && (
              <>
                <span style={{ color: 'rgba(42,60,90,0.6)', fontSize: '10px' }}>·</span>
                {stats.exact > 0 && (
                  <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                    {stats.exact} exactas
                  </span>
                )}
                {stats.correct > 0 && (
                  <span className="text-xs font-semibold" style={{ color: '#F5C542' }}>
                    {stats.correct} acertadas
                  </span>
                )}
                {stats.wrong > 0 && (
                  <span className="text-xs" style={{ color: 'rgba(252,165,165,0.7)' }}>
                    {stats.wrong} falladas
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(({ id, label, count: tabCount }) => {
          const isActive = filterTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilterTab(id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-display text-sm uppercase tracking-wide whitespace-nowrap shrink-0 border transition-all"
              style={isActive ? {
                background: 'linear-gradient(135deg, #F5C542, #FFD700)',
                color: '#0B1624',
                borderColor: 'rgba(245,197,66,0.5)',
                boxShadow: '0 2px 16px rgba(245,197,66,0.28)',
              } : {
                background: 'rgba(14,24,44,0.7)',
                color: 'rgba(163,181,211,0.7)',
                borderColor: 'rgba(42,60,90,0.45)',
              }}
              onMouseEnter={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(20,34,58,0.9)'; el.style.borderColor = 'rgba(245,197,66,0.25)'; el.style.color = '#E5E7EB' } }}
              onMouseLeave={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(14,24,44,0.7)'; el.style.borderColor = 'rgba(42,60,90,0.45)'; el.style.color = 'rgba(163,181,211,0.7)' } }}
            >
              {label}
              {tabCount !== undefined && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{
                    background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(42,60,90,0.5)',
                    color: isActive ? '#0B1624' : 'rgba(163,181,211,0.7)',
                  }}>
                  {tabCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Empty state ─────────────────────────────────────────── */}
      {filteredMatches.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'rgba(14,24,44,0.7)', border: '1px solid rgba(42,60,90,0.38)' }}>
            {filterTab === 'predicted' ? '🎯' : filterTab === 'final' ? '🏆' : '⚽'}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(163,181,211,0.7)' }}>
              {filterTab === 'predicted'
                ? 'Todavía no guardaste predicciones'
                : filterTab === 'final'
                ? 'Ningún partido finalizado todavía'
                : 'Sin partidos en esta categoría'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(163,181,211,0.4)' }}>
              {filterTab === 'predicted'
                ? 'Predecí marcadores en la pestaña "Por predecir"'
                : filterTab === 'final'
                ? 'Los resultados aparecen aquí cuando finalicen los partidos'
                : 'Cambiá el filtro para ver más partidos'}
            </p>
          </div>
          {filterTab !== 'upcoming' && (
            <button
              onClick={() => setFilterTab('upcoming')}
              className="text-xs px-4 py-2 rounded-lg border transition-all"
              style={{ color: 'rgba(125,211,252,0.7)', borderColor: 'rgba(56,189,248,0.2)', background: 'rgba(56,189,248,0.05)' }}>
              Ver partidos por predecir
            </button>
          )}
        </motion.div>
      )}

      {/* ── Match grid grouped by date ───────────────────────────── */}
      {filteredMatches.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={filterTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-7"
          >
            {Array.from(matchesByDate.entries()).map(([date, dayMatches]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0"
                    style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.14)' }}>
                    <span className="text-[9px] uppercase tracking-widest leading-none"
                      style={{ color: 'rgba(125,211,252,0.55)' }}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-xl font-display leading-tight" style={{ color: 'rgba(125,211,252,0.9)' }}>
                      {date.split('-')[2]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize truncate" style={{ color: '#E5E7EB' }}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
                        weekday: 'long', day: 'numeric', month: 'long'
                      })}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(163,181,211,0.45)' }}>
                      {dayMatches.length} {dayMatches.length === 1 ? 'partido' : 'partidos'}
                    </p>
                  </div>
                  <div className="flex-1 h-px" style={{ background: 'rgba(42,60,90,0.3)' }} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {dayMatches.map(match => (
                    <PredictionCard
                      key={match.id}
                      match={match}
                      prediction={predictions[match.id] ?? null}
                      liveMatch={getLiveMatch(match)}
                      onSave={save}
                      onRemove={remove}
                    />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Disclaimer ──────────────────────────────────────────── */}
      <div className="rounded-xl border p-4 flex items-start gap-3"
        style={{ background: 'rgba(56,189,248,0.03)', borderColor: 'rgba(56,189,248,0.1)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="rgba(125,211,252,0.45)" strokeWidth="2" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-[11px]" style={{ color: 'rgba(163,181,211,0.5)' }}>
          Las predicciones se guardan en este dispositivo · Sin ranking por ahora · Horarios convertidos a tu hora local
        </p>
      </div>
    </div>
  )
}
