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

  const barColor = (pct: number) =>
    pct === 100  ? 'from-gold to-gold2'
    : pct >= 75  ? 'from-green-600 to-green-400'
    : pct >= 40  ? 'from-blue-700 to-blue-500'
    : pct > 0    ? 'from-orange-700 to-orange-500'
    :              'from-surface4 to-surface3'

  return (
    <div className="space-y-8">
      {groups.map(([group, teams]) => (
        <div key={group}>
          {/* Group header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-display text-gray-600 uppercase tracking-[0.3em]">
              Grupo {group}
            </span>
            <div className="flex-1 h-px bg-surface3" />
          </div>

          {/* Team cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {teams.map((team) => {
              const isSelected = selectedTeam === team.code
              const isComplete = team.pct === 100

              return (
                <motion.button
                  key={team.code}
                  onClick={() => onSelectTeam(team.code)}
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    isSelected
                      ? 'border-gold2/60 bg-gradient-to-b from-gold/10 to-surface2 shadow-gold-sm'
                      : isComplete
                      ? 'border-gold/30 bg-gradient-to-b from-gold/5 to-surface2 hover:border-gold/50'
                      : 'border-surface3 bg-surface2 hover:border-surface4 hover:bg-surface3/60'
                  }`}
                >
                  {/* Flag + name */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <TeamFlag code={team.code} className="text-xl shrink-0" />
                    <span className="text-sm font-semibold text-white truncate leading-tight">
                      {team.name}
                    </span>
                    {isComplete && (
                      <span className="ml-auto text-gold2 text-sm shrink-0">✓</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-surface3 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${barColor(team.pct)}`}
                      style={{ width: `${Math.max(team.pct, team.pct > 0 ? 6 : 0)}%` }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-600 font-mono">{team.owned}/20</span>
                    <span className={`text-[11px] font-bold font-mono ${
                      isComplete ? 'text-gold2' : team.pct > 0 ? 'text-gray-400' : 'text-gray-700'
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
