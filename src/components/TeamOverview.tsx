'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { StickerState } from '@/types'
import { TEAMS } from '@/stickers'
import { TeamFlag } from '@/components/TeamFlag'

interface TeamOverviewProps {
  userStickers: StickerState[]
  selectedTeam: string | null
  onSelectTeam: (code: string) => void
}

export const TeamOverview = ({ userStickers, selectedTeam, onSelectTeam }: TeamOverviewProps) => {
  const stickerMap = useMemo(() => {
    const map = new Map<string, StickerState>()
    userStickers.forEach((s) => map.set(s.sticker_key, s))
    return map
  }, [userStickers])

  const teamStats = useMemo(() =>
    TEAMS.map((team) => {
      const keys = Array.from({ length: 20 }, (_, i) => `${team.code}_${i}`)
      const owned = keys.filter((k) => {
        const s = stickerMap.get(k)
        return s && (s.status === 'owned' || s.status === 'repeated')
      }).length
      const pct = Math.round((owned / 20) * 100)
      return { ...team, owned, pct }
    }),
    [stickerMap]
  )

  const groups = useMemo(() => {
    const g = new Map<string, typeof teamStats>()
    teamStats.forEach((t) => {
      if (!g.has(t.group)) g.set(t.group, [])
      g.get(t.group)!.push(t)
    })
    return Array.from(g.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [teamStats])

  const barStyle = (pct: number) => {
    if (pct === 100) return { background: 'linear-gradient(90deg, #F5C542, #FFD700)', boxShadow: '0 0 8px rgba(255,215,0,0.5)' }
    if (pct >= 75)  return { background: 'linear-gradient(90deg, #16a34a, #22c55e)' }
    if (pct >= 40)  return { background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)' }
    if (pct > 0)    return { background: 'linear-gradient(90deg, #c2410c, #f97316)' }
    return { background: '#1A2840' }
  }

  const cardAccent = (pct: number) => {
    if (pct === 100) return 'border-gold/50 shadow-gold-sm'
    if (pct >= 75)  return 'border-green-600/30'
    if (pct >= 40)  return 'border-blue-700/25'
    if (pct > 0)    return 'border-surface3'
    return 'border-surface3/60'
  }

  return (
    <div className="space-y-10">
      {groups.map(([group, teams], groupIdx) => (
        <div key={group}>
          {/* Cabecera de grupo — estilo FIFA */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-display text-dark font-bold"
                style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)' }}
              >
                {group}
              </div>
              <span className="text-[10px] font-display text-surface4 uppercase tracking-[0.4em]">
                Grupo {group}
              </span>
            </div>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(245,197,66,0.3), transparent)' }} />
            <span className="text-[10px] text-surface4 font-mono">
              {teams.filter(t => t.pct > 0).length}/{teams.length} activos
            </span>
          </div>

          {/* Grid de equipos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {teams.map((team, i) => {
              const isSelected = selectedTeam === team.code
              const isComplete = team.pct === 100

              return (
                <motion.button
                  key={team.code}
                  onClick={() => onSelectTeam(team.code)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIdx * 0.04 + i * 0.03, duration: 0.25 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`text-left p-3.5 rounded-xl border-2 transition-colors relative overflow-hidden group ${
                    isSelected
                      ? 'border-gold/60 shadow-gold-sm'
                      : cardAccent(team.pct)
                  }`}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(245,197,66,0.10) 0%, #0F172A 100%)'
                      : isComplete
                      ? 'linear-gradient(135deg, rgba(245,197,66,0.06) 0%, #0F172A 100%)'
                      : 'linear-gradient(135deg, #132030 0%, #0F172A 100%)',
                  }}
                >
                  {/* Brillo superior cuando está seleccionado */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                  )}

                  {/* Patrón de fondo sutil */}
                  <div className="absolute inset-0 geo-pattern opacity-30 pointer-events-none" />

                  {/* Bandera + nombre */}
                  <div className="relative flex items-center gap-2.5 mb-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-surface3/80 flex items-center justify-center bg-surface3/60 shadow-md">
                      <TeamFlag code={team.code} className="text-2xl leading-none" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-humo/90 truncate leading-tight group-hover:text-white transition-colors">
                        {team.name}
                      </p>
                      <p className="text-[9px] text-surface4 uppercase tracking-widest mt-0.5">
                        {team.code}
                      </p>
                    </div>
                    {isComplete && (
                      <div className="shrink-0 w-5 h-5 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
                        <span className="text-gold text-[10px] font-bold">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div className="relative w-full bg-surface3/80 rounded-full h-1.5 mb-2.5 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(team.pct, team.pct > 0 ? 5 : 0)}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: groupIdx * 0.04 + i * 0.03 + 0.1 }}
                      style={barStyle(team.pct)}
                    />
                  </div>

                  {/* Stats */}
                  <div className="relative flex items-center justify-between">
                    <span className="text-[10px] text-surface4 font-mono">{team.owned}/20</span>
                    <span className={`text-[11px] font-bold font-mono ${
                      isComplete ? 'text-gold' : team.pct >= 75 ? 'text-green-400' : team.pct >= 40 ? 'text-blue-400' : team.pct > 0 ? 'text-gray-400' : 'text-surface4'
                    }`}>
                      {team.pct}%
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
