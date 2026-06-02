'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { TeamFlag } from '@/components/TeamFlag'
import type { LiveMatch, LiveMatchStatus } from '@/lib/live-data/types'
import { getAllFriendlies } from '@/lib/live-data/services/friendlies-service'

type FilterTab = 'upcoming' | 'recent' | 'all'

// ── Helpers ────────────────────────────────────────────────────────
function daysUntil(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function groupByDate(matches: LiveMatch[]): Map<string, LiveMatch[]> {
  const map = new Map<string, LiveMatch[]>()
  for (const m of matches) {
    const bucket = map.get(m.date) ?? []
    map.set(m.date, [...bucket, m])
  }
  return map
}

// ── Sub-components ─────────────────────────────────────────────────
function StatusBadge({ status, minute }: { status: LiveMatchStatus; minute?: number }) {
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

function TeamBlock({ code, name, score, status }: {
  code: string; name: string; score?: number; status: LiveMatchStatus
}) {
  // Show individual score only during live/halftime (center handles completed score)
  const isLive = status === 'live' || status === 'halftime'
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="w-10 h-10 flex items-center justify-center">
        <TeamFlag code={code} className="text-4xl" />
      </div>
      <span className="text-xs font-bold text-center leading-snug"
        style={{ color: '#E5E7EB', maxWidth: '100px' }}>
        {name}
      </span>
      {isLive && score !== undefined && (
        <span className="text-2xl font-display" style={{ color: '#F5C542' }}>{score}</span>
      )}
    </div>
  )
}

function FriendlyMatchCard({ match }: { match: LiveMatch }) {
  const days = daysUntil(match.date)
  const isLive = match.status === 'live' || match.status === 'halftime'
  const isCompleted = match.status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl border"
      style={{
        background: 'linear-gradient(160deg, rgba(16,28,50,0.95) 0%, rgba(10,18,36,0.98) 100%)',
        borderColor: 'rgba(52,72,110,0.65)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.35)',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
            style={{ color: 'rgba(125,211,252,0.85)', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.18)' }}>
            {match.competition.shortName}
          </span>
          <StatusBadge status={match.status} minute={match.minute} />
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-2 py-1">
          <TeamBlock code={match.home.code} name={match.home.name} score={match.home.score} status={match.status} />

          <div className="flex flex-col items-center gap-0.5 shrink-0 px-3 min-w-[52px]">
            {match.status === 'upcoming' && (
              <>
                <span className="font-display leading-none text-base" style={{ color: 'rgba(163,181,211,0.35)' }}>VS</span>
                <span className="text-[12px] font-semibold mt-1 tabular-nums" style={{ color: '#CBD5E1' }}>{match.time}</span>
                <span className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(163,181,211,0.45)' }}>{match.timezone}</span>
              </>
            )}
            {isLive && (
              <>
                <span className="text-xl font-display leading-none" style={{ color: '#4ade80' }}>
                  {match.home.score ?? 0} – {match.away.score ?? 0}
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: 'rgba(74,222,128,0.65)' }}>
                  {match.minute ? `${match.minute}'` : 'En vivo'}
                </span>
              </>
            )}
            {isCompleted && (
              <span className="text-2xl font-display leading-none" style={{ color: '#E5E7EB' }}>
                {match.home.score} – {match.away.score}
              </span>
            )}
            {(match.status === 'postponed' || match.status === 'cancelled') && (
              <span className="font-display leading-none text-base" style={{ color: 'rgba(163,181,211,0.2)' }}>VS</span>
            )}
          </div>

          <TeamBlock code={match.away.code} name={match.away.name} score={match.away.score} status={match.status} />
        </div>

        {/* Venue */}
        <div className="mt-3 pt-3 flex items-center gap-1.5 flex-wrap"
          style={{ borderTop: '1px solid rgba(42,60,90,0.32)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" strokeWidth="2"
            stroke="rgba(163,181,211,0.4)" className="shrink-0" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="text-[11px]" style={{ color: 'rgba(163,181,211,0.58)' }}>{match.venue.name}</span>
          <span className="text-[10px]" style={{ color: 'rgba(163,181,211,0.28)' }}>·</span>
          <span className="text-[11px]" style={{ color: 'rgba(163,181,211,0.58)' }}>{match.venue.city}</span>
          {days > 0 && days <= 14 && match.status === 'upcoming' && (
            <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(125,211,252,0.75)' }}>
              en {days}d
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border overflow-hidden animate-pulse"
      style={{ borderColor: 'rgba(42,60,90,0.35)', background: 'rgba(16,26,50,0.7)' }}>
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-20 rounded-md" style={{ background: 'rgba(56,189,248,0.07)' }} />
          <div className="h-4 w-16 rounded-full" style={{ background: 'rgba(42,60,90,0.4)' }} />
        </div>
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-10 h-7 rounded" style={{ background: 'rgba(42,60,90,0.4)' }} />
            <div className="h-2.5 w-16 rounded" style={{ background: 'rgba(42,60,90,0.35)' }} />
          </div>
          <div className="h-6 w-12 rounded" style={{ background: 'rgba(42,60,90,0.35)' }} />
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-10 h-7 rounded" style={{ background: 'rgba(42,60,90,0.4)' }} />
            <div className="h-2.5 w-16 rounded" style={{ background: 'rgba(42,60,90,0.35)' }} />
          </div>
        </div>
        <div className="h-2.5 w-3/4 rounded" style={{ background: 'rgba(42,60,90,0.3)' }} />
      </div>
    </div>
  )
}

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

// ── Main Component ─────────────────────────────────────────────────
export function FriendliesView() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState<FilterTab>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    getAllFriendlies().then(data => {
      if (!cancelled) { setMatches(data); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [])

  const filteredMatches = useMemo(() => {
    let base = matches

    if (filterTab === 'upcoming') {
      base = base.filter(m => m.status === 'upcoming' || m.status === 'live' || m.status === 'halftime')
    } else if (filterTab === 'recent') {
      base = base.filter(m => m.status === 'completed' || m.status === 'postponed')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      base = base.filter(m =>
        m.home.name.toLowerCase().includes(q) ||
        m.away.name.toLowerCase().includes(q) ||
        m.home.code.toLowerCase().includes(q) ||
        m.away.code.toLowerCase().includes(q) ||
        m.venue.name.toLowerCase().includes(q) ||
        m.venue.city.toLowerCase().includes(q) ||
        m.venue.country.toLowerCase().includes(q)
      )
    }

    return [...base].sort((a, b) =>
      filterTab === 'recent'
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date)
    )
  }, [matches, filterTab, searchQuery])

  const matchesByDate = useMemo(() => groupByDate(filteredMatches), [filteredMatches])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    searchRef.current?.focus()
  }, [])

  const upcomingCount = matches.filter(m => m.status === 'upcoming' || m.status === 'live').length
  const recentCount = matches.filter(m => m.status === 'completed').length

  const FILTER_TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'upcoming', label: 'Próximos', count: upcomingCount },
    { id: 'recent',   label: 'Recientes', count: recentCount },
    { id: 'all',      label: 'Todos' },
  ]

  return (
    <div className="space-y-4">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display tracking-widest uppercase leading-none"
            style={{
              fontSize: 'clamp(22px, 3.5vw, 30px)',
              background: 'linear-gradient(135deg, rgba(125,211,252,0.95), rgba(56,189,248,0.85))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            Amistosos Internacionales
          </h2>
          <p className="text-sm mt-1 tracking-wide" style={{ color: 'rgba(185,205,230,0.8)' }}>
            Preparación para el{' '}
            <span className="font-bold" style={{ color: 'rgba(245,197,66,0.9)' }}>Mundial 2026</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: '11px', color: 'rgba(185,205,230,0.75)' }}>
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

      {/* ── Filter tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map(({ id, label, count }) => {
          const isActive = filterTab === id
          return (
            <button
              key={id}
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
              {count !== undefined && !loading && !searchQuery && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{
                    background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(42,60,90,0.5)',
                    color: isActive ? '#0B1624' : 'rgba(163,181,211,0.7)',
                  }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Search box ────────────────────────────────────────────── */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(10,18,36,0.6)', border: '1px solid rgba(42,60,90,0.3)' }}>
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
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ color: 'rgba(163,181,211,0.6)', background: 'rgba(42,60,90,0.55)' }}
            >
              <CloseIcon />
            </button>
          )}
        </div>
        {searchQuery && !loading && (
          <p className="text-xs mt-2 font-semibold" style={{ color: 'rgba(185,205,230,0.75)' }}>
            {filteredMatches.length} {filteredMatches.length === 1 ? 'partido' : 'partidos'}
          </p>
        )}
      </div>

      {/* ── Loading skeletons ─────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 xl2:grid-cols-2 3xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!loading && filteredMatches.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-5 text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(14,24,44,0.7)', border: '1px solid rgba(42,60,90,0.38)' }}>
            <SearchIcon />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(163,181,211,0.7)' }}>
              {searchQuery ? `Sin resultados para "${searchQuery}"` : 'Sin partidos en esta categoría'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(163,181,211,0.38)' }}>
              {searchQuery ? 'Prueba con el nombre de una selección, estadio o ciudad' : 'Intenta cambiar el filtro activo'}
            </p>
          </div>
          <button
            onClick={() => { setSearchQuery(''); setFilterTab('all') }}
            className="text-xs px-4 py-2 rounded-lg border transition-all"
            style={{ color: 'rgba(163,181,211,0.6)', borderColor: 'rgba(42,60,90,0.45)', background: 'rgba(14,24,44,0.7)' }}>
            Ver todos los partidos
          </button>
        </motion.div>
      )}

      {/* ── Match grid grouped by date ────────────────────────────── */}
      {!loading && filteredMatches.length > 0 && (
        <div className="space-y-7">
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
                    {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(163,181,211,0.45)' }}>
                    {dayMatches.length} {dayMatches.length === 1 ? 'partido' : 'partidos'}
                  </p>
                </div>
                <div className="flex-1 h-px" style={{ background: 'rgba(42,60,90,0.3)' }} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl2:grid-cols-2 3xl:grid-cols-3 gap-3">
                {dayMatches.map(match => <FriendlyMatchCard key={match.id} match={match} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Data source notice ────────────────────────────────────── */}
      <div className="rounded-xl border p-4 flex items-start gap-3"
        style={{ background: 'rgba(245,197,66,0.02)', borderColor: 'rgba(245,197,66,0.1)' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(245,197,66,0.45)" strokeWidth="2" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'rgba(245,197,66,0.7)' }}>Datos de demostración</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(163,181,211,0.5)' }}>
            Los resultados y horarios son ilustrativos. Fase 3b integrará datos en tiempo real vía API oficial.
          </p>
        </div>
      </div>
    </div>
  )
}
