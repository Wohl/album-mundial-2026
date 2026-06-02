'use client'

import { useState, useEffect, useMemo } from 'react'
import { TeamFlag } from '@/components/TeamFlag'
import { useFavorites } from '@/hooks/useFavorites'
import { WC2026_MATCHES } from '@/lib/calendar-data'
import { getAllFriendlies } from '@/lib/live-data/services/friendlies-service'
import type { LiveMatch } from '@/lib/live-data/types'
import type { CalMatch } from '@/lib/calendar-data'

function MatchRow({ homeCode, homeName, awayCode, awayName, dateStr, label, isWC }: {
  homeCode: string; homeName: string; awayCode: string; awayName: string
  dateStr: string; label: string; isWC: boolean
}) {
  const date = new Date(dateStr + 'T00:00:00')
  const dateLabel = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div className="flex items-center gap-2 py-2"
      style={{ borderBottom: '1px solid rgba(42,60,90,0.25)' }}>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <TeamFlag code={homeCode} className="text-base shrink-0" />
        <span className="text-xs truncate font-semibold" style={{ color: '#E5E7EB' }}>{homeName}</span>
      </div>
      <div className="flex flex-col items-center shrink-0 px-1">
        <span className="font-display text-[10px] leading-none" style={{ color: 'rgba(163,181,211,0.4)' }}>vs</span>
      </div>
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className="text-xs truncate font-semibold text-right" style={{ color: '#E5E7EB' }}>{awayName}</span>
        <TeamFlag code={awayCode} className="text-base shrink-0" />
      </div>
      <div className="text-right shrink-0 ml-1">
        <p className="text-[10px] capitalize" style={{ color: 'rgba(185,205,230,0.6)' }}>{dateLabel}</p>
        <p className="text-[9px] mt-0.5"
          style={{ color: isWC ? 'rgba(245,197,66,0.6)' : 'rgba(125,211,252,0.6)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

export function FavoriteMatchesBlock() {
  const { favorites, loaded } = useFavorites()
  const [friendlies, setFriendlies] = useState<LiveMatch[]>([])

  useEffect(() => {
    getAllFriendlies().then(data => setFriendlies(data))
  }, [])

  const upcomingWC = useMemo((): CalMatch[] => {
    if (!loaded || favorites.length === 0) return []
    return WC2026_MATCHES
      .filter(m => m.status === 'upcoming' && (favorites.includes(m.home.code) || favorites.includes(m.away.code)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4)
  }, [favorites, loaded])

  const upcomingAmi = useMemo((): LiveMatch[] => {
    if (!loaded || favorites.length === 0) return []
    return friendlies
      .filter(m => m.status === 'upcoming' && (favorites.includes(m.home.code) || favorites.includes(m.away.code)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4)
  }, [favorites, friendlies, loaded])

  // Don't render anything if no favorites or nothing to show
  if (!loaded || favorites.length === 0 || (upcomingWC.length + upcomingAmi.length === 0)) {
    return null
  }

  const allMatches = [
    ...upcomingAmi.map(m => ({ key: m.id, homeCode: m.home.code, homeName: m.home.name, awayCode: m.away.code, awayName: m.away.name, date: m.date, label: 'Amistoso', isWC: false })),
    ...upcomingWC.map(m => ({ key: m.id, homeCode: m.home.code, homeName: m.home.name, awayCode: m.away.code, awayName: m.away.name, date: m.date, label: m.phase === 'group' ? `Gr. ${m.group} WC` : 'WC 2026', isWC: true })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(160deg, rgba(16,28,50,0.95) 0%, rgba(10,18,36,0.98) 100%)',
        border: '1px solid rgba(245,197,66,0.2)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5C542" stroke="#F5C542" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <h3 className="font-display uppercase tracking-widest text-sm" style={{ color: '#F5C542' }}>
          Próximos partidos
        </h3>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(245,197,66,0.1)', color: 'rgba(245,197,66,0.7)', border: '1px solid rgba(245,197,66,0.18)' }}>
          mis selecciones
        </span>
      </div>

      {/* Matches */}
      <div>
        {allMatches.map(m => (
          <MatchRow
            key={m.key}
            homeCode={m.homeCode} homeName={m.homeName}
            awayCode={m.awayCode} awayName={m.awayName}
            dateStr={m.date} label={m.label} isWC={m.isWC}
          />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-[10px] mt-2.5" style={{ color: 'rgba(163,181,211,0.35)' }}>
        {favorites.length} selección{favorites.length !== 1 ? 'es' : ''} favorita{favorites.length !== 1 ? 's' : ''} · Gestionar en Calendario → ⭐ Mis Selecciones
      </p>
    </div>
  )
}
