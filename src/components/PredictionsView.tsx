'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TeamFlag } from '@/components/TeamFlag'
import { usePredictions, PredictionEntry } from '@/hooks/usePredictions'
import { useLiveWc } from '@/hooks/useLiveWc'
import { getKickoffInfo } from '@/lib/quiniela/kickoff'
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

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

function clampScore(val: string): string {
  const n = parseInt(val, 10)
  if (isNaN(n) || n < 0) return '0'
  if (n > 30) return '30'
  return String(n)
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
  const { isLocked, minutesUntilKickoff } = getKickoffInfo(match.id)
  const [homeVal, setHomeVal] = useState<string>(
    prediction != null ? String(prediction.homeScore) : ''
  )
  const [awayVal, setAwayVal] = useState<string>(
    prediction != null ? String(prediction.awayScore) : ''
  )
  const [justSaved, setJustSaved] = useState(false)

  // Sync inputs when prediction changes (initial load from localStorage)
  useEffect(() => {
    if (prediction != null) {
      setHomeVal(String(prediction.homeScore))
      setAwayVal(String(prediction.awayScore))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction?.savedAt])

  const isFinal = match.phase === 'final'
  const phaseLabel = match.phase === 'group'
    ? (match.group ? `Grupo ${match.group}${match.matchday ? ` · J${match.matchday}` : ''}` : 'Grupo')
    : PHASE_LABELS[match.phase]

  // Real score from live API (only available when match is completed today)
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

  const isValidInput = homeVal !== '' && awayVal !== ''
  const hasChanges = prediction
    ? homeVal !== String(prediction.homeScore) || awayVal !== String(prediction.awayScore)
    : isValidInput

  const handleSave = () => {
    const h = parseInt(homeVal || '0', 10)
    const a = parseInt(awayVal || '0', 10)
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

  const days = daysUntil(match.date)

  const borderColor = isFinal
    ? 'rgba(245,197,66,0.45)'
    : resultStatus === 'exact' ? 'rgba(74,222,128,0.35)'
    : resultStatus === 'result' ? 'rgba(245,197,66,0.3)'
    : resultStatus === 'wrong' ? 'rgba(239,68,68,0.22)'
    : isLocked ? 'rgba(100,116,139,0.35)'
    : prediction ? 'rgba(125,211,252,0.28)'
    : 'rgba(42,60,90,0.55)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(14,24,46,0.97) 0%, rgba(10,18,36,0.99) 100%)',
        borderColor,
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* Gold top bar for Final */}
      {isFinal && (
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,197,66,0.9), transparent)' }} />
      )}

      <div className="p-4 space-y-3">
        {/* Header — phase + time */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
            style={{ color: isFinal ? '#FFD700' : '#F5C542', background: isFinal ? 'rgba(255,215,0,0.12)' : 'rgba(245,197,66,0.08)', border: `1px solid ${isFinal ? 'rgba(255,215,0,0.28)' : 'rgba(245,197,66,0.18)'}` }}>
            {phaseLabel}
          </span>

          <div className="flex items-center gap-2">
            {!isLocked && days > 0 && days <= 21 && (
              <span className="text-[9px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(125,211,252,0.7)' }}>
                en {days}d
              </span>
            )}
            {!isLocked && (
              <span className="text-[10px] tabular-nums" style={{ color: 'rgba(163,181,211,0.55)' }}>
                {match.time} {match.timezone}
              </span>
            )}
            {isLocked && !realScore && (
              <span className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: 'rgba(100,116,139,0.8)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Bloqueado
              </span>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3">
          {/* Home team */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamFlag code={match.home.code} className="text-2xl shrink-0" />
            <span className="text-sm font-bold truncate" style={{ color: '#E5E7EB' }}>
              {match.home.name}
            </span>
          </div>

          {/* Score inputs / display */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isLocked ? (
              <>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={homeVal}
                  onChange={e => setHomeVal(clampScore(e.target.value))}
                  onKeyDown={handleKey}
                  aria-label={`Goles ${match.home.name}`}
                  placeholder="0"
                  className="w-10 h-10 text-center text-lg font-display font-bold rounded-xl border outline-none transition-all focus-visible:ring-2 focus-visible:ring-sky-400/40"
                  style={{
                    background: 'rgba(10,18,36,0.9)',
                    borderColor: homeVal !== '' ? 'rgba(125,211,252,0.45)' : 'rgba(42,60,90,0.55)',
                    color: '#E5E7EB',
                    MozAppearance: 'textfield',
                  }}
                />
                <span className="text-base font-display" style={{ color: 'rgba(163,181,211,0.35)' }}>–</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={awayVal}
                  onChange={e => setAwayVal(clampScore(e.target.value))}
                  onKeyDown={handleKey}
                  aria-label={`Goles ${match.away.name}`}
                  placeholder="0"
                  className="w-10 h-10 text-center text-lg font-display font-bold rounded-xl border outline-none transition-all focus-visible:ring-2 focus-visible:ring-sky-400/40"
                  style={{
                    background: 'rgba(10,18,36,0.9)',
                    borderColor: awayVal !== '' ? 'rgba(125,211,252,0.45)' : 'rgba(42,60,90,0.55)',
                    color: '#E5E7EB',
                    MozAppearance: 'textfield',
                  }}
                />
              </>
            ) : (
              /* Locked — show prediction read-only */
              <div className="flex items-center gap-1.5">
                {prediction ? (
                  <span className="text-xl font-display tabular-nums" style={{ color: 'rgba(163,181,211,0.6)' }}>
                    {prediction.homeScore} – {prediction.awayScore}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: 'rgba(163,181,211,0.35)' }}>–</span>
                )}
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="text-sm font-bold truncate text-right" style={{ color: '#E5E7EB' }}>
              {match.away.name}
            </span>
            <TeamFlag code={match.away.code} className="text-2xl shrink-0" />
          </div>
        </div>

        {/* Result comparison (when match completed) */}
        {realScore && prediction && (
          <div className="pt-2 border-t flex items-center justify-between gap-3"
            style={{ borderColor: 'rgba(42,60,90,0.3)' }}>
            <div className="text-[11px]" style={{ color: 'rgba(163,181,211,0.55)' }}>
              Real: <span className="font-bold tabular-nums" style={{ color: '#E5E7EB' }}>
                {realScore.home} – {realScore.away}
              </span>
            </div>
            {resultStatus && <ResultBadge status={resultStatus} />}
          </div>
        )}

        {/* Locked + no prediction */}
        {isLocked && !prediction && (
          <p className="text-[11px]" style={{ color: 'rgba(163,181,211,0.35)' }}>
            Sin predicción guardada para este partido
          </p>
        )}

        {/* Action buttons (only when not locked) */}
        {!isLocked && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValidInput || (!hasChanges && !justSaved)}
              aria-label={prediction ? 'Actualizar predicción' : 'Guardar predicción'}
              className="flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 disabled:opacity-40 disabled:cursor-not-allowed"
              style={justSaved ? {
                background: 'rgba(74,222,128,0.12)',
                borderColor: 'rgba(74,222,128,0.3)',
                color: '#4ade80',
              } : {
                background: 'rgba(56,189,248,0.07)',
                borderColor: 'rgba(56,189,248,0.22)',
                color: 'rgba(125,211,252,0.9)',
              }}
            >
              {justSaved ? '✓ Guardado' : prediction ? 'Actualizar' : 'Guardar predicción'}
            </button>

            {prediction && !justSaved && (
              <button
                type="button"
                onClick={() => onRemove(match.id)}
                aria-label="Borrar predicción"
                className="px-3 py-2 rounded-xl text-[10px] border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                style={{ color: 'rgba(163,181,211,0.4)', borderColor: 'rgba(42,60,90,0.4)', background: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(252,165,165,0.7)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.25)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(163,181,211,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(42,60,90,0.4)' }}
              >
                Borrar
              </button>
            )}
          </div>
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

  // Build liveMatch lookup key
  const getLiveMatch = useCallback((match: CalMatch): LiveMatch | undefined => {
    return liveByKey.get(`${match.home.code}-${match.away.code}`)
  }, [liveByKey])

  // Aggregate stats (only meaningful when WC matches start completing)
  const stats = useMemo(() => {
    let exact = 0, correct = 0, wrong = 0
    for (const match of WC2026_MATCHES) {
      const pred = predictions[match.id]
      if (!pred) continue
      const live = getLiveMatch(match)
      if (!live || live.status !== 'completed' || live.home.score === undefined || live.away.score === undefined) continue
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

  // Filter matches based on active tab
  const filteredMatches = useMemo((): CalMatch[] => {
    const all = WC2026_MATCHES
    if (filterTab === 'all') return sortByDate(all)

    if (filterTab === 'upcoming') {
      return sortByDate(all.filter(m => {
        const { isLocked } = getKickoffInfo(m.id)
        return !isLocked
      }))
    }

    if (filterTab === 'predicted') {
      return sortByDate(all.filter(m => !!predictions[m.id]))
    }

    // 'final' — completed matches with real score
    return sortByDate(all.filter(m => {
      const live = getLiveMatch(m)
      return live?.status === 'completed'
    })).reverse()  // Most recent first
  }, [filterTab, predictions, getLiveMatch])

  const matchesByDate = useMemo(() => groupByDate(filteredMatches), [filteredMatches])

  // Tab counts
  const tabCounts = useMemo(() => ({
    upcoming: WC2026_MATCHES.filter(m => !getKickoffInfo(m.id).isLocked && !predictions[m.id]).length,
    predicted: count,
    final: WC2026_MATCHES.filter(m => {
      const live = getLiveMatch(m)
      return live?.status === 'completed'
    }).length,
  }), [count, predictions, getLiveMatch])

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'all',       label: 'Todos',           count: WC2026_MATCHES.length },
    { id: 'upcoming',  label: 'Por predecir',    count: tabCounts.upcoming },
    { id: 'predicted', label: 'Mis predicciones', count: tabCounts.predicted > 0 ? tabCounts.predicted : undefined },
    { id: 'final',     label: 'Finalizados',     count: tabCounts.final > 0 ? tabCounts.final : undefined },
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
        <p className="text-sm tracking-wide" style={{ color: 'rgba(185,205,230,0.7)' }}>
          Mundial 2026 · Se guardan en este dispositivo
        </p>

        {/* Stats (visible when user has made predictions) */}
        {count > 0 && (
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: 'rgba(125,211,252,0.8)' }}>
              {count} {count === 1 ? 'predicción' : 'predicciones'}
            </span>
            {stats.scored > 0 && (
              <>
                <span style={{ color: 'rgba(42,60,90,0.6)' }}>·</span>
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
          className="flex flex-col items-center justify-center py-20 gap-5 text-center"
        >
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
                ? 'Aquí aparecerán los resultados cuando finalicen los partidos'
                : 'Cambiá el filtro activo para ver más partidos'}
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
                {/* Date header */}
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
                      {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(163,181,211,0.45)' }}>
                      {dayMatches.length} {dayMatches.length === 1 ? 'partido' : 'partidos'}
                    </p>
                  </div>
                  <div className="flex-1 h-px" style={{ background: 'rgba(42,60,90,0.3)' }} />
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl2:grid-cols-2 3xl:grid-cols-3 gap-3">
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(125,211,252,0.5)" strokeWidth="2" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-[11px]" style={{ color: 'rgba(163,181,211,0.5)' }}>
          Las predicciones se guardan solo en este dispositivo · Sin ranking ni puntos por ahora
        </p>
      </div>
    </div>
  )
}
