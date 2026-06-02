'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TeamFlag } from '@/components/TeamFlag'
import { useFavorites } from '@/hooks/useFavorites'
import { WC2026_MATCHES, PHASE_LABELS } from '@/lib/calendar-data'
import type { CalMatch } from '@/lib/calendar-data'
import { getAllFriendlies } from '@/lib/live-data/services/friendlies-service'
import type { LiveMatch } from '@/lib/live-data/types'

// ── WC team data (derived once from existing fixture data) ─────────────────
interface WCTeam { code: string; name: string; group: string }

const WC_TEAMS: WCTeam[] = (() => {
  const map = new Map<string, WCTeam>()
  for (const m of WC2026_MATCHES) {
    if (m.phase !== 'group' || !m.group) continue
    if (m.home.code !== 'TBD') map.set(m.home.code, { code: m.home.code, name: m.home.name, group: m.group })
    if (m.away.code !== 'TBD') map.set(m.away.code, { code: m.away.code, name: m.away.name, group: m.group })
  }
  return Array.from(map.values()).sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
})()

const TEAMS_BY_GROUP = WC_TEAMS.reduce<Record<string, WCTeam[]>>((acc, t) => {
  ;(acc[t.group] ??= []).push(t)
  return acc
}, {})

const SORTED_GROUPS = Object.keys(TEAMS_BY_GROUP).sort()

// ── Sub-components ─────────────────────────────────────────────────────────
function StarIcon({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? '#F5C542' : 'none'}
      stroke={filled ? '#F5C542' : 'rgba(245,197,66,0.55)'}
      strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function FavoriteTeamCard({ team, onRemove }: { team: WCTeam; onRemove: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.18 }}
      className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border"
      style={{
        background: 'linear-gradient(160deg, rgba(16,28,50,0.95) 0%, rgba(10,18,36,0.98) 100%)',
        borderColor: 'rgba(245,197,66,0.3)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(245,197,66,0.06) inset',
      }}
    >
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full transition-all"
        style={{ background: 'rgba(42,60,90,0.7)', color: 'rgba(163,181,211,0.7)' }}
        aria-label={`Quitar ${team.name} de favoritos`}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,60,60,0.5)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(42,60,90,0.7)'; (e.currentTarget as HTMLElement).style.color = 'rgba(163,181,211,0.7)' }}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <TeamFlag code={team.code} className="text-4xl" />
      <span className="text-xs font-bold text-center leading-tight" style={{ color: '#E5E7EB', maxWidth: '72px' }}>
        {team.name}
      </span>
      <span
        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
        style={{ background: 'rgba(245,197,66,0.1)', color: 'rgba(245,197,66,0.75)', border: '1px solid rgba(245,197,66,0.2)' }}
      >
        Grupo {team.group}
      </span>
    </motion.div>
  )
}

function TeamToggle({ team, active, onToggle }: { team: WCTeam; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-left"
      style={active ? {
        background: 'rgba(245,197,66,0.1)',
        borderColor: 'rgba(245,197,66,0.35)',
      } : {
        background: 'rgba(12,22,42,0.6)',
        borderColor: 'rgba(42,60,90,0.4)',
      }}
      aria-label={`${active ? 'Quitar' : 'Agregar'} ${team.name}`}
      aria-pressed={active}
    >
      <TeamFlag code={team.code} className="text-xl shrink-0" />
      <span
        className="text-xs font-semibold truncate min-w-0 flex-1"
        style={{ color: active ? '#F5C542' : 'rgba(185,205,230,0.8)' }}
      >
        {team.name}
      </span>
      <span className="shrink-0">
        <StarIcon filled={active} size={12} />
      </span>
    </button>
  )
}

function UpcomingMatchRow({ match, competition }: { match: CalMatch | LiveMatch; competition: 'wc' | 'friendly' }) {
  const isWC = competition === 'wc'
  const wcMatch = isWC ? (match as CalMatch) : null
  const friendly = !isWC ? (match as LiveMatch) : null

  const homeCode = isWC ? wcMatch!.home.code : friendly!.home.code
  const awayCode = isWC ? wcMatch!.away.code : friendly!.away.code
  const homeName = isWC ? wcMatch!.home.name : friendly!.home.name
  const awayName = isWC ? wcMatch!.away.name : friendly!.away.name
  const dateStr  = isWC ? wcMatch!.date : friendly!.date
  const date     = new Date(dateStr + 'T00:00:00')
  const dateLabel = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  const compLabel = isWC
    ? (wcMatch!.phase === 'group' ? `Grupo ${wcMatch!.group} · WC` : `${PHASE_LABELS[wcMatch!.phase]} · WC`)
    : 'Amistoso'

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(10,18,36,0.7)', border: '1px solid rgba(42,60,90,0.35)' }}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <TeamFlag code={homeCode} className="text-lg shrink-0" />
        <span className="text-xs font-semibold truncate" style={{ color: '#E5E7EB' }}>{homeName}</span>
      </div>
      <div className="flex flex-col items-center shrink-0 gap-0.5 px-1.5">
        <span className="font-display text-xs leading-none" style={{ color: 'rgba(163,181,211,0.4)' }}>vs</span>
        <span className="text-[9px] text-center" style={{ color: 'rgba(125,211,252,0.7)' }}>{dateLabel}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className="text-xs font-semibold truncate text-right" style={{ color: '#E5E7EB' }}>{awayName}</span>
        <TeamFlag code={awayCode} className="text-lg shrink-0" />
      </div>
      <span
        className="text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded shrink-0 hidden sm:inline"
        style={{ color: isWC ? 'rgba(245,197,66,0.75)' : 'rgba(125,211,252,0.75)', background: isWC ? 'rgba(245,197,66,0.07)' : 'rgba(56,189,248,0.07)' }}
      >
        {compLabel}
      </span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function MyTeamsView() {
  const { favorites, toggle, isFavorite, clearAll, loaded } = useFavorites()
  const [showSelector, setShowSelector] = useState(false)
  const [friendlies, setFriendlies] = useState<LiveMatch[]>([])

  // Load amistosos for upcoming matches section
  useEffect(() => {
    getAllFriendlies().then(data => setFriendlies(data))
  }, [])

  // Upcoming WC matches for favorites
  const upcomingWC = useMemo(() => {
    if (!loaded || favorites.length === 0) return []
    return WC2026_MATCHES
      .filter(m => m.status === 'upcoming' && (favorites.includes(m.home.code) || favorites.includes(m.away.code)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6)
  }, [favorites, loaded])

  // Upcoming amistosos for favorites
  const upcomingFriendlies = useMemo(() => {
    if (!loaded || favorites.length === 0) return []
    return friendlies
      .filter(m => m.status === 'upcoming' && (favorites.includes(m.home.code) || favorites.includes(m.away.code)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6)
  }, [favorites, friendlies, loaded])

  const favTeams = useMemo(
    () => WC_TEAMS.filter(t => favorites.includes(t.code)),
    [favorites]
  )

  const totalUpcoming = upcomingWC.length + upcomingFriendlies.length

  if (!loaded) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl" style={{ background: 'rgba(42,60,90,0.4)' }} />
        <div className="h-24 rounded-2xl" style={{ background: 'rgba(16,26,50,0.7)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display tracking-widest uppercase leading-none"
            style={{
              fontSize: 'clamp(22px, 3.5vw, 30px)',
              background: 'linear-gradient(135deg, #F5C542 30%, #FFD700 65%, #FFF5CC 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
            Mis Selecciones
          </h2>
          <p className="text-sm mt-1 tracking-wide" style={{ color: 'rgba(185,205,230,0.8)' }}>
            {favorites.length === 0
              ? 'Marca tus selecciones favoritas'
              : <>{' '}<span className="font-bold" style={{ color: 'rgba(245,197,66,0.9)' }}>{favorites.length}</span>{' '}selección{favorites.length !== 1 ? 'es' : ''} marcada{favorites.length !== 1 ? 's' : ''}</>
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {favorites.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all"
              style={{ color: 'rgba(163,181,211,0.6)', borderColor: 'rgba(42,60,90,0.45)', background: 'rgba(14,24,44,0.7)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,80,80,0.4)'; (e.currentTarget as HTMLElement).style.color = 'rgba(250,120,120,0.8)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(42,60,90,0.45)'; (e.currentTarget as HTMLElement).style.color = 'rgba(163,181,211,0.6)' }}
            >
              Limpiar todo
            </button>
          )}
          <button
            onClick={() => setShowSelector(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-display text-sm uppercase tracking-wide border transition-all"
            style={showSelector ? {
              background: 'linear-gradient(135deg, #F5C542, #FFD700)',
              color: '#0B1624',
              borderColor: 'rgba(245,197,66,0.5)',
              boxShadow: '0 2px 16px rgba(245,197,66,0.28)',
            } : {
              background: 'rgba(14,24,44,0.7)',
              color: 'rgba(245,197,66,0.8)',
              borderColor: 'rgba(245,197,66,0.3)',
            }}
          >
            <StarIcon filled={false} />
            {showSelector ? 'Cerrar' : 'Gestionar'}
          </button>
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {favorites.length === 0 && !showSelector && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 gap-5 text-center rounded-2xl"
          style={{ background: 'rgba(10,18,36,0.6)', border: '1px solid rgba(42,60,90,0.3)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(245,197,66,0.06)', border: '1px solid rgba(245,197,66,0.14)' }}
          >
            <StarIcon filled={false} size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(163,181,211,0.8)' }}>
              Sin selecciones favoritas aún
            </p>
            <p className="text-xs mt-1.5 max-w-xs" style={{ color: 'rgba(163,181,211,0.45)' }}>
              Marcá tus selecciones para filtrar sus partidos en el Calendario y los Amistosos
            </p>
          </div>
          <button
            onClick={() => setShowSelector(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-sm uppercase tracking-widest transition-all"
            style={{
              background: 'linear-gradient(135deg, #F5C542, #FFD700)',
              color: '#081120',
              boxShadow: '0 3px 18px rgba(245,197,66,0.30)',
            }}
          >
            <StarIcon filled={true} />
            Elegir selecciones
          </button>
        </motion.div>
      )}

      {/* ── Favorite teams cards ─────────────────────────────────────── */}
      {favTeams.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-3"
            style={{ color: 'rgba(245,197,66,0.55)' }}>
            Mis equipos ({favTeams.length})
          </p>
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            <AnimatePresence>
              {favTeams.map(t => (
                <FavoriteTeamCard key={t.code} team={t} onRemove={() => toggle(t.code)} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* ── Team selector ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl p-4 space-y-4"
              style={{ background: 'rgba(8,16,32,0.8)', border: '1px solid rgba(42,60,90,0.45)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.28em]"
                  style={{ color: 'rgba(163,181,211,0.6)' }}>
                  Los 32 equipos del Mundial 2026
                </p>
                <span className="text-xs font-semibold" style={{ color: 'rgba(245,197,66,0.65)' }}>
                  {favorites.length}/32 marcados
                </span>
              </div>

              {SORTED_GROUPS.map(group => (
                <div key={group}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.32em] mb-2"
                    style={{ color: 'rgba(245,197,66,0.4)' }}>
                    Grupo {group}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(TEAMS_BY_GROUP[group] ?? []).map(t => (
                      <TeamToggle
                        key={t.code}
                        team={t}
                        active={isFavorite(t.code)}
                        onToggle={() => toggle(t.code)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upcoming matches ─────────────────────────────────────────── */}
      {loaded && favorites.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1" style={{ background: 'rgba(245,197,66,0.12)' }} />
            <span className="font-display uppercase tracking-[0.3em] text-[10px] shrink-0"
              style={{ color: 'rgba(245,197,66,0.45)' }}>
              Próximos partidos
            </span>
            <div className="h-px flex-1" style={{ background: 'rgba(245,197,66,0.12)' }} />
          </div>

          {totalUpcoming === 0 ? (
            <div
              className="text-center py-10 rounded-xl"
              style={{ background: 'rgba(10,18,36,0.5)', border: '1px solid rgba(42,60,90,0.28)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'rgba(163,181,211,0.6)' }}>
                Sin partidos próximos para tus selecciones
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(163,181,211,0.35)' }}>
                Los partidos del Mundial 2026 comienzan el 11 de junio
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Amistosos próximos */}
              {upcomingFriendlies.length > 0 && (
                <>
                  <p className="text-[9px] uppercase tracking-[0.28em] font-semibold mb-1.5"
                    style={{ color: 'rgba(125,211,252,0.5)' }}>
                    Amistosos
                  </p>
                  {upcomingFriendlies.map(m => (
                    <UpcomingMatchRow key={m.id} match={m} competition="friendly" />
                  ))}
                </>
              )}
              {/* WC próximos */}
              {upcomingWC.length > 0 && (
                <>
                  <p className="text-[9px] uppercase tracking-[0.28em] font-semibold mt-3 mb-1.5"
                    style={{ color: 'rgba(245,197,66,0.5)' }}>
                    Mundial 2026
                  </p>
                  {upcomingWC.map(m => (
                    <UpcomingMatchRow key={m.id} match={m} competition="wc" />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tip ─────────────────────────────────────────────────────── */}
      {favorites.length > 0 && (
        <div
          className="rounded-xl border p-3.5 flex items-start gap-3"
          style={{ background: 'rgba(245,197,66,0.02)', borderColor: 'rgba(245,197,66,0.1)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,197,66,0.5)" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[11px]" style={{ color: 'rgba(163,181,211,0.55)' }}>
            Usa el filtro <strong style={{ color: 'rgba(245,197,66,0.7)' }}>⭐ Mis Selecciones</strong> en las pestañas <strong style={{ color: 'rgba(185,205,230,0.7)' }}>🏆 Mundial 2026</strong> y <strong style={{ color: 'rgba(185,205,230,0.7)' }}>⚽ Amistosos</strong> para ver solo sus partidos.
          </p>
        </div>
      )}
    </div>
  )
}
