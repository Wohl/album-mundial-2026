'use client'

import { useMemo } from 'react'
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

  return (
    <div className="space-y-8">
      {groups.map(([group, teams]) => (
        <div key={group}>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Grupo {group}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {teams.map((team) => (
              <button
                key={team.code}
                onClick={() => onSelectTeam(team.code)}
                className={`text-left p-3 rounded-xl border-2 transition active:scale-95 ${
                  selectedTeam === team.code
                    ? 'border-gold2 bg-gold2/10 shadow-md shadow-gold2/10'
                    : 'border-surface3 bg-surface2 hover:border-gold2/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <TeamFlag code={team.code} className="text-xl" />
                  <span className="text-sm font-semibold text-white truncate leading-tight">
                    {team.name}
                  </span>
                </div>
                <div className="w-full bg-surface3 rounded-full h-1.5 mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      team.pct === 100
                        ? 'bg-gold2'
                        : team.pct >= 75
                        ? 'bg-green-500'
                        : team.pct >= 40
                        ? 'bg-blue-500'
                        : 'bg-surface3'
                    }`}
                    style={{ width: `${Math.max(team.pct, team.pct > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{team.owned}/20</span>
                  <span
                    className={
                      team.pct === 100
                        ? 'text-gold2 font-bold'
                        : team.pct > 0
                        ? 'text-gray-300'
                        : 'text-gray-600'
                    }
                  >
                    {team.pct}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
