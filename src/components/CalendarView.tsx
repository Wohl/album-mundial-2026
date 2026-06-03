'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TeamFlag } from '@/components/TeamFlag'
import { CountdownHero } from '@/components/CountdownHero'
import { FriendliesView } from '@/components/FriendliesView'
import { MyTeamsView } from '@/components/MyTeamsView'
import { useFavorites } from '@/hooks/useFavorites'
import { useLiveWc } from '@/hooks/useLiveWc'
import { LiveEventsBlock } from '@/components/LiveEventsBlock'
import type { LiveMatchStatus, LiveEvent } from '@/lib/live-data/types'
import {
  CalMatch,
  MatchStatus,
  Phase,
  GroupLetter,
  PHASE_LABELS,
  PHASE_SHORT,
  PHASE_ORDER,
  GROUPS,
  WC2026_MATCHES,
  searchMatches,
  getFavoriteMatches,
  sortByDate,
  groupByDate,
} from '@/lib/calendar-data'

// Live overlay data merged onto static CalMatch without mutating calendar-data
interface LiveOverlay {
  /** apifootball.com fixture ID — enables on-demand event fetch */
  apiId: string
  status: LiveMatchStatus
  minute?: number
  homeScore?: number
  awayScore?: number
  events?: LiveEvent[]
}

// Extended status type that includes halftime/cancelled from live API
type DisplayStatus = MatchStatus | 'halftime' | 'cancelled'

// ── Helpers ────────────────────────────────────────────────────────
function daysUntil(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Sub-components ─────────────────────────────────────────────────
function StatusBadge({ status, minute }: { status: DisplayStatus; minute?: number }) {
  if (status === 'live' || status === 'halftime') return (
    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-0.5"
      style={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.35)', background: 'rgba(34,197,94,0.12)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      {status === 'halftime' ? 'Descanso' : minute ? `${minute}'` : 'En vivo'}
    </span>
  )
  if (status === 'completed') return (
    <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-0.5"
      style={{ color: 'rgba(163,181,211,0.55)', border: '1px solid rgba(56,73,105,0.35)', background: 'rgba(16,26,48,0.7)' }}>
      Finalizado
    </span>
  )
  if (status === 'postponed' || status === 'cancelled') return (
    <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-0.5"
      style={{ color: 'rgba(251,191,36,0.8)', border: '1px solid rgba(245,158,11,0.28)', background: 'rgba(245,158,11,0.07)' }}>
      {status === 'cancelled' ? 'Cancelado' : 'Aplazado'}
    </span>
  )
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-0.5"
      style={{ color: 'rgba(125,211,252,0.85)', border: '1px solid rgba(56,189,248,0.22)', background: 'rgba(56,189,248,0.07)' }}>
      Próximo
    </span>
  )
}

function TeamBlock({ team }: { team: CalMatch['home'] }) {
  const isTBD = team.code === 'TBD'
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="w-10 h-10 flex items-center justify-center">
        {isTBD
          ? <span className="text-2xl" style={{ opacity: 0.2 }}>?</span>
          : <TeamFlag code={team.code} className="text-4xl" />
        }
      </div>
      <span className="text-xs font-bold text-center leading-snug"
        style={{ color: isTBD ? 'rgba(163,181,211,0.28)' : '#E5E7EB', maxWidth: '100px' }}>
        {team.name}
      </span>
      {team.score !== undefined && (
        <span className="text-2xl font-display" style={{ color: '#F5C542' }}>
          {team.score}
        </span>
      )}
    </div>
  )
}

function MatchCard({ match, liveOverlay }: { match: CalMatch; liveOverlay?: LiveOverlay }) {
  const [expanded, setExpanded] = useState(false)
  const [cachedEvents, setCachedEvents] = useState<LiveEvent[] | null>(null)
  const [loadingEvents, setLoadingEvents] = useState(false)

  const days = daysUntil(match.date)
  const isGroupPhase = match.phase === 'group'
  const isTBD = match.home.code === 'TBD'
  const isFinal = match.phase === 'final'
  const isSpecial = isFinal || match.phase === '3rd' || match.phase === 'sf'

  // Overlay values take priority over static data
  const displayStatus: DisplayStatus = liveOverlay?.status ?? match.status
  const displayMinute = liveOverlay?.minute ?? match.minute
  const homeScore = liveOverlay !== undefined ? liveOverlay.homeScore : match.home.score
  const awayScore = liveOverlay !== undefined ? liveOverlay.awayScore : match.away.score
  const isLive = displayStatus === 'live' || displayStatus === 'halftime'
  const isCompleted = displayStatus === 'completed'

  // Events: in-memory first, then fetched on demand
  const events: LiveEvent[] = cachedEvents ?? liveOverlay?.events ?? []
  // Show toggle when we have an API ID and the match is not upcoming
  const canToggleTimeline = !!liveOverlay && displayStatus !== 'upcoming'

  const handleToggle = async () => {
    if (!expanded && cachedEvents === null && !liveOverlay?.events) {
      // Fetch events lazily — expand immediately, populate while loading
      setExpanded(true)
      setLoadingEvents(true)
      try {
        const res = await fetch(`/api/live/match/${liveOverlay!.apiId}`)
        const json = res.ok ? (await res.json() as { match?: { events?: LiveEvent[] } }) : null
        setCachedEvents(json?.match?.events ?? [])
      } catch {
        setCachedEvents([])
      }
      setLoadingEvents(false)
    } else {
      setExpanded(prev => !prev)
    }
  }

  const cardBorderColor = isFinal
    ? 'rgba(245,197,66,0.45)'
    : isLive
    ? 'rgba(74,222,128,0.3)'
    : match.phase === '3rd'
    ? 'rgba(180,150,60,0.32)'
    : isTBD
    ? 'rgba(42,60,90,0.35)'
    : 'rgba(52,72,110,0.65)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl border"
      style={{
        background: isFinal
          ? 'linear-gradient(160deg, rgba(22,33,55,0.98) 0%, rgba(10,18,38,0.99) 100%)'
          : 'linear-gradient(160deg, rgba(16,28,50,0.95) 0%, rgba(10,18,36,0.98) 100%)',
        borderColor: cardBorderColor,
        boxShadow: isFinal
          ? '0 4px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,197,66,0.07)'
          : '0 2px 20px rgba(0,0,0,0.35)',
      }}
    >
      {isSpecial && (
        <div className="absolute inset-x-0 top-0 h-0.5"
          style={{
            background: isFinal
              ? 'linear-gradient(90deg, transparent, rgba(245,197,66,0.9), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(245,197,66,0.45), transparent)',
          }} />
      )}

      <div className="p-4">
        {/* Header: phase badge + status */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isGroupPhase && match.group && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{ color: '#F5C542', background: 'rgba(245,197,66,0.1)', border: '1px solid rgba(245,197,66,0.2)' }}>
                Grupo {match.group}
              </span>
            )}
            {isGroupPhase && match.matchday && (
              <span className="text-[10px] uppercase tracking-wide"
                style={{ color: 'rgba(163,181,211,0.5)' }}>
                Jornada {match.matchday}
              </span>
            )}
            {!isGroupPhase && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{
                  color: isFinal ? '#FFD700' : '#F5C542',
                  background: isFinal ? 'rgba(255,215,0,0.12)' : 'rgba(245,197,66,0.08)',
                  border: `1px solid ${isFinal ? 'rgba(255,215,0,0.28)' : 'rgba(245,197,66,0.18)'}`,
                }}>
                {PHASE_LABELS[match.phase]}
              </span>
            )}
          </div>
          <StatusBadge status={displayStatus} minute={displayMinute} />
        </div>

        {/* Teams + VS / score */}
        <div className="flex items-center justify-between gap-2 py-1">
          <TeamBlock team={match.home} />

          <div className="flex flex-col items-center gap-0.5 shrink-0 px-3 min-w-[52px]">
            {!isLive && !isCompleted && (
              <>
                <span className="font-display leading-none text-base"
                  style={{ color: 'rgba(163,181,211,0.35)' }}>VS</span>
                <span className="text-[12px] font-semibold mt-1 tabular-nums"
                  style={{ color: '#CBD5E1' }}>{match.time}</span>
                <span className="text-[9px] tracking-widest uppercase"
                  style={{ color: 'rgba(163,181,211,0.45)' }}>{match.timezone}</span>
              </>
            )}
            {isLive && (
              <>
                <span className="text-xl font-display leading-none" style={{ color: '#4ade80' }}>
                  {homeScore ?? 0} – {awayScore ?? 0}
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: 'rgba(74,222,128,0.65)' }}>
                  {displayStatus === 'halftime' ? 'Descanso' : displayMinute ? `${displayMinute}'` : 'En vivo'}
                </span>
              </>
            )}
            {isCompleted && (
              <span className="text-2xl font-display leading-none text-humo">
                {homeScore} – {awayScore}
              </span>
            )}
          </div>

          <TeamBlock team={match.away} />
        </div>

        {/* Venue */}
        <div className="mt-3 pt-3 flex items-center gap-1.5 flex-wrap"
          style={{ borderTop: `1px solid ${isFinal ? 'rgba(245,197,66,0.12)' : 'rgba(42,60,90,0.32)'}` }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" strokeWidth="2"
            stroke="rgba(163,181,211,0.4)" className="shrink-0" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="text-[11px]" style={{ color: 'rgba(163,181,211,0.58)' }}>{match.stadium}</span>
          <span className="text-[10px]" style={{ color: 'rgba(163,181,211,0.28)' }}>·</span>
          <span className="text-[11px]" style={{ color: 'rgba(163,181,211,0.58)' }}>{match.city}</span>
          {days > 0 && days <= 21 && displayStatus === 'upcoming' && (
            <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(125,211,252,0.75)' }}>
              en {days}d
            </span>
          )}
        </div>

        {/* ── Events timeline (expandable) ───────────────────────── */}
        {canToggleTimeline && (
          <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(42,60,90,0.28)' }}>

            {/* Compact preview — last 3 events when not expanded */}
            {!expanded && events.length > 0 && (
              <div className="mb-2">
                <LiveEventsBlock events={events} maxItems={3} />
              </div>
            )}

            {/* Full timeline when expanded */}
            {expanded && (
              <div className="mb-2">
                {loadingEvents ? (
                  <div className="flex items-center gap-2 py-2"
                    style={{ color: 'rgba(163,181,211,0.45)', fontSize: '11px' }}>
                    <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin shrink-0" />
                    Cargando eventos...
                  </div>
                ) : events.length > 0 ? (
                  <LiveEventsBlock events={events} />
                ) : (
                  <p className="py-1.5" style={{ color: 'rgba(163,181,211,0.38)', fontSize: '11px' }}>
                    Sin eventos registrados
                  </p>
                )}
              </div>
            )}

            {/* Toggle button */}
            <button
              type="button"
              onClick={handleToggle}
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? 'Ocultar timeline de eventos'
                  : events.length > 0
                  ? `Ver todos los eventos (${events.length})`
                  : 'Ver eventos'
              }
              className="w-full py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 focus-visible:ring-offset-1"
              style={{
                color: expanded ? 'rgba(163,181,211,0.55)' : 'rgba(125,211,252,0.8)',
                borderColor: expanded ? 'rgba(42,60,90,0.35)' : 'rgba(56,189,248,0.2)',
                background: expanded ? 'rgba(12,22,42,0.55)' : 'rgba(56,189,248,0.05)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = expanded ? 'rgba(18,30,52,0.7)' : 'rgba(56,189,248,0.1)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = expanded ? 'rgba(12,22,42,0.55)' : 'rgba(56,189,248,0.05)'
              }}
            >
              {loadingEvents
                ? 'Cargando...'
                : expanded
                ? 'Ocultar'
                : events.length > 0
                ? `Ver todos los eventos (${events.length})`
                : 'Ver eventos'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────
const SearchIcon = ({ active }: { active?: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'rgba(245,197,66,0.7)' : 'rgba(163,181,211,0.4)'}
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)
const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

// ── Main Component ─────────────────────────────────────────────────
export function CalendarView({ matches: externalMatches }: { matches?: CalMatch[] }) {
  const [activePhase, setActivePhase] = useState<Phase>('group')
  const [activeGroup, setActiveGroup] = useState<GroupLetter | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const { favorites: favoriteTeams } = useFavorites()
  const [calendarTab, setCalendarTab] = useState<'world_cup' | 'friendlies' | 'my_teams'>('world_cup')
  const searchRef = useRef<HTMLInputElement>(null)
  const matchesRef = useRef<HTMLDivElement>(null)

  // Live WC data — polls today's matches, enriches with events for live ones
  const { liveByKey, hasLive } = useLiveWc()

  const handleScrollToMatches = useCallback(() => {
    matchesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const allMatches = externalMatches ?? WC2026_MATCHES

  // ── Derived state ──────────────────────────────────────────────
  const isSearching = searchQuery.trim().length > 0 || showFavorites

  const filteredMatches = useMemo(() => {
    let base = allMatches

    if (isSearching) {
      // Modo búsqueda: filtra sobre todos los partidos ignorando fase/grupo
      if (searchQuery.trim()) {
        base = searchMatches(searchQuery, base)
      }
      if (showFavorites) {
        base = getFavoriteMatches(favoriteTeams, base)
      }
    } else {
      // Modo normal: filtra por fase y grupo
      base = base.filter(m => m.phase === activePhase)
      if (activePhase === 'group' && activeGroup !== 'all') {
        base = base.filter(m => m.group === activeGroup)
      }
    }

    return sortByDate(base)
  }, [allMatches, isSearching, searchQuery, showFavorites, favoriteTeams, activePhase, activeGroup])

  const matchesByDate = useMemo(() => groupByDate(filteredMatches), [filteredMatches])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    searchRef.current?.focus()
  }, [])

  const handleResetFilters = useCallback(() => {
    setSearchQuery('')
    setShowFavorites(false)
  }, [])

  // Empty state reason determines which message to show
  const emptyReason: 'favorites' | 'search' | 'phase' | null =
    filteredMatches.length === 0
      ? showFavorites ? 'favorites'
      : searchQuery.trim() ? 'search'
      : 'phase'
      : null

  return (
    <div className="space-y-5">

      {/* ── Section tabs: Mundial 2026 / Amistosos / Mis Selecciones ─ */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none" role="tablist" aria-label="Secciones del Calendario">
        {([
          { id: 'world_cup', label: 'Mundial 2026', icon: '🏆' },
          { id: 'friendlies', label: 'Amistosos', icon: '⚽' },
          { id: 'my_teams', label: 'Mis Selecciones', icon: '⭐' },
        ] as const).map(tab => {
          const isActive = calendarTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => setCalendarTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-display text-sm uppercase tracking-wide border transition-all whitespace-nowrap shrink-0"
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
              onMouseEnter={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(245,197,66,0.25)'; el.style.color = '#E5E7EB' } }}
              onMouseLeave={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(42,60,90,0.45)'; el.style.color = 'rgba(163,181,211,0.7)' } }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      {calendarTab === 'world_cup' && <>
        {/* ── Countdown Hero ───────────────────────────────────────── */}
        <CountdownHero onCTAClick={handleScrollToMatches} />

      {/* ── Section divider + header ─────────────────────────────── */}
      <div ref={matchesRef} className="flex items-center gap-3 pt-1">
        <div className="h-px flex-1" style={{ background: 'rgba(245,197,66,0.12)' }} />
        <span
          className="font-display uppercase tracking-[0.32em] shrink-0"
          style={{ fontSize: '10px', color: 'rgba(245,197,66,0.45)' }}
        >
          Partidos
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(245,197,66,0.12)' }} />
      </div>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display tracking-widest uppercase leading-none"
            style={{
              fontSize: 'clamp(22px, 3.5vw, 30px)',
              background: 'linear-gradient(135deg, #F5C542, #FFD700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            Calendario 2026
          </h2>
          <p className="text-sm mt-1 tracking-wide" style={{ color: 'rgba(185,205,230,0.8)' }}>
            <span className="font-bold" style={{ color: 'rgba(245,197,66,0.9)' }}>
              {allMatches.length}
            </span>
            {' '}partidos · 16 sedes · 3 países anfitriones
          </p>
          {hasLive && (
            <p className="flex items-center gap-1.5 text-[11px] mt-1 font-semibold" style={{ color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Datos en tiempo real activos
            </p>
          )}
        </div>
        <div
          className="flex items-center gap-3 flex-wrap"
          style={{ fontSize: '11px', color: 'rgba(185,205,230,0.75)' }}
        >
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(125,211,252,0.85)' }} />Próximo
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />En vivo
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(163,181,211,0.45)' }} />Final
          </span>
        </div>
      </div>

      {/* ── Search + Quick Filters ────────────────────────────────── */}
      <div className="rounded-xl p-3 space-y-2.5" style={{ background: 'rgba(10,18,36,0.6)', border: '1px solid rgba(42,60,90,0.3)' }}>

        {/* Search input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon active={searchQuery.length > 0} />
          </div>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar selección, estadio o ciudad..."
            className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(14,24,44,0.85)',
              border: `1px solid ${searchQuery ? 'rgba(245,197,66,0.35)' : 'rgba(52,72,110,0.5)'}`,
              color: '#E5E7EB',
              boxShadow: searchQuery ? '0 0 0 3px rgba(245,197,66,0.05)' : 'none',
            }}
            onFocus={e => { if (!searchQuery) (e.target as HTMLInputElement).style.borderColor = 'rgba(52,72,110,0.8)' }}
            onBlur={e => { if (!searchQuery) (e.target as HTMLInputElement).style.borderColor = 'rgba(52,72,110,0.5)' }}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all"
              style={{ color: 'rgba(163,181,211,0.6)', background: 'rgba(42,60,90,0.55)' }}
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Quick filter chips + result count */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Mis favoritas */}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={showFavorites ? {
              background: 'rgba(245,197,66,0.1)',
              borderColor: 'rgba(245,197,66,0.35)',
              color: '#F5C542',
            } : {
              background: 'rgba(12,22,42,0.65)',
              borderColor: 'rgba(42,60,90,0.4)',
              color: 'rgba(163,181,211,0.65)',
            }}
            onMouseEnter={e => { if (!showFavorites) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,197,66,0.25)'; (e.currentTarget as HTMLElement).style.color = '#E5E7EB' } }}
            onMouseLeave={e => { if (!showFavorites) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(42,60,90,0.4)'; (e.currentTarget as HTMLElement).style.color = 'rgba(163,181,211,0.65)' } }}
          >
            <StarIcon filled={showFavorites} />
            Mis favoritas
          </button>

          {/* Result count + clear */}
          {isSearching && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold" style={{ color: 'rgba(185,205,230,0.75)' }}>
                {filteredMatches.length} {filteredMatches.length === 1 ? 'partido' : 'partidos'}
              </span>
              {showFavorites && (
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] underline underline-offset-2 transition-opacity hover:opacity-80"
                  style={{ color: 'rgba(185,205,230,0.6)' }}
                >
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Phase filter (hidden while searching) ─────────────────── */}
      <AnimatePresence>
        {!isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PHASE_ORDER.map(phase => {
                const isActive = activePhase === phase
                return (
                  <button
                    key={phase}
                    onClick={() => { setActivePhase(phase); setActiveGroup('all') }}
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
                    {phase === 'final' && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-80">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    )}
                    {phase === '3rd' && <span className="text-[11px] leading-none opacity-70">🥉</span>}
                    {PHASE_SHORT[phase]}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Group filter (only in group phase, not searching) ─────── */}
      <AnimatePresence>
        {!isSearching && activePhase === 'group' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              <span className="text-[9px] uppercase tracking-[0.3em] shrink-0 pr-1 font-semibold"
                style={{ color: 'rgba(163,181,211,0.4)' }}>Grupo</span>
              <div className="w-px h-4 shrink-0" style={{ background: 'rgba(42,60,90,0.55)' }} />
              {(['all', ...GROUPS] as const).map(g => {
                const isGroupActive = activeGroup === g
                return (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 font-display"
                    style={isGroupActive ? {
                      background: 'rgba(245,197,66,0.12)',
                      color: '#F5C542',
                      borderColor: 'rgba(245,197,66,0.35)',
                      boxShadow: '0 1px 8px rgba(245,197,66,0.12)',
                    } : {
                      background: 'rgba(12,22,42,0.6)',
                      color: 'rgba(163,181,211,0.62)',
                      borderColor: 'rgba(42,60,90,0.38)',
                    }}
                    onMouseEnter={e => { if (!isGroupActive) { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(18,30,52,0.85)'; el.style.borderColor = 'rgba(245,197,66,0.2)'; el.style.color = '#E5E7EB' } }}
                    onMouseLeave={e => { if (!isGroupActive) { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(12,22,42,0.6)'; el.style.borderColor = 'rgba(42,60,90,0.38)'; el.style.color = 'rgba(163,181,211,0.62)' } }}
                  >
                    {g === 'all' ? 'Todos' : g}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Matches by date ───────────────────────────────────────── */}
      {emptyReason ? (
        /* ── Empty states ─────────────────────────────────────────── */
        <motion.div
          key={emptyReason}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-5 text-center"
        >
          {emptyReason === 'favorites' && (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(245,197,66,0.06)', border: '1px solid rgba(245,197,66,0.14)' }}>
                <StarIcon />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(163,181,211,0.7)' }}>
                  Sin selecciones favoritas
                </p>
                <p className="text-xs mt-1.5 max-w-xs" style={{ color: 'rgba(163,181,211,0.4)' }}>
                  Próximamente podrás guardar tus selecciones preferidas para filtrar sus partidos rápidamente
                </p>
              </div>
              <button onClick={handleResetFilters}
                className="text-xs px-4 py-2 rounded-lg border transition-all"
                style={{ color: 'rgba(163,181,211,0.6)', borderColor: 'rgba(42,60,90,0.45)', background: 'rgba(14,24,44,0.7)' }}>
                Ver todos los partidos
              </button>
            </>
          )}

          {emptyReason === 'search' && (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(14,24,44,0.7)', border: '1px solid rgba(42,60,90,0.38)' }}>
                <SearchIcon />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(163,181,211,0.7)' }}>
                  Sin resultados para "{searchQuery}"
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(163,181,211,0.38)' }}>
                  Prueba con el nombre de una selección, estadio o ciudad
                </p>
              </div>
              <button onClick={handleClearSearch}
                className="text-xs px-4 py-2 rounded-lg border transition-all"
                style={{ color: 'rgba(163,181,211,0.6)', borderColor: 'rgba(42,60,90,0.45)', background: 'rgba(14,24,44,0.7)' }}>
                Borrar búsqueda
              </button>
            </>
          )}

          {emptyReason === 'phase' && (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(14,24,44,0.7)', border: '1px solid rgba(42,60,90,0.38)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(163,181,211,0.25)" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(163,181,211,0.7)' }}>
                  Sin partidos disponibles
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(163,181,211,0.38)' }}>
                  Los horarios se confirmarán próximamente
                </p>
              </div>
            </>
          )}
        </motion.div>
      ) : (
        /* ── Match grid ────────────────────────────────────────────── */
        <div className="space-y-7">
          {Array.from(matchesByDate.entries()).map(([date, dayMatches]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0"
                  style={{ background: 'rgba(245,197,66,0.07)', border: '1px solid rgba(245,197,66,0.14)' }}>
                  <span className="text-[9px] uppercase tracking-widest leading-none"
                    style={{ color: 'rgba(245,197,66,0.55)' }}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                  <span className="text-xl font-display leading-tight" style={{ color: '#F5C542' }}>
                    {date.split('-')[2]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-humo capitalize truncate">
                    {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(163,181,211,0.45)' }}>
                    {dayMatches.length} {dayMatches.length === 1 ? 'partido' : 'partidos'}
                  </p>
                </div>
                <div className="flex-1 h-px" style={{ background: 'rgba(42,60,90,0.3)' }} />
              </div>

              <div className="grid grid-cols-1 xl2:grid-cols-2 3xl:grid-cols-3 gap-3">
                {dayMatches.map(match => {
                  const live = liveByKey.get(`${match.home.code}-${match.away.code}`)
                  const overlay: LiveOverlay | undefined = live ? {
                    apiId: live.id,
                    status: live.status,
                    minute: live.minute,
                    homeScore: live.home.score,
                    awayScore: live.away.score,
                    events: live.events,
                  } : undefined
                  return <MatchCard key={match.id} match={match} liveOverlay={overlay} />
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Coming soon notice ────────────────────────────────────── */}
      <div className="rounded-xl border p-4 flex items-start gap-3"
        style={{ background: 'rgba(56,189,248,0.03)', borderColor: 'rgba(56,189,248,0.1)' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(125,211,252,0.55)" strokeWidth="2" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'rgba(125,211,252,0.8)' }}>Próximas funcionalidades</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(163,181,211,0.5)' }}>
            Alineaciones · Estadísticas avanzadas · Notificaciones push
          </p>
        </div>
      </div>
      </>}

      {calendarTab === 'friendlies' && <FriendliesView />}

      {calendarTab === 'my_teams' && <MyTeamsView />}
    </div>
  )
}
