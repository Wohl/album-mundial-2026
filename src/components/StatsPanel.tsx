'use client'

import { useMemo } from 'react'
import { StickerState, UserProgress } from '@/types'
import { TEAMS } from '@/stickers'
import { getStickerName, displayKey } from '@/lib/stickers'
import { TeamFlag } from '@/components/TeamFlag'

interface StatsPanelProps {
  progress: UserProgress
  stickers: StickerState[]
}

const StatCard = ({
  value,
  label,
  color,
  sub,
}: {
  value: string
  label: string
  color: string
  sub?: string
}) => (
  <div className="bg-surface2 border border-surface3 rounded-xl p-4 text-center">
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">{label}</div>
    {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
  </div>
)

export const StatsPanel = ({ progress, stickers }: StatsPanelProps) => {
  const stickerMap = useMemo(() => {
    const map = new Map<string, StickerState>()
    stickers.forEach((s) => map.set(s.sticker_key, s))
    return map
  }, [stickers])

  const teamStats = useMemo(() =>
    TEAMS.map((team) => {
      const keys = Array.from({ length: 20 }, (_, i) => `${team.code}_${i}`)
      const owned = keys.filter((k) => {
        const s = stickerMap.get(k)
        return s && (s.status === 'owned' || s.status === 'repeated')
      }).length
      return { ...team, owned, pct: Math.round((owned / 20) * 100) }
    }).sort((a, b) => b.pct - a.pct),
    [stickerMap]
  )

  const mostRepeated = useMemo(() =>
    [...stickers]
      .filter((s) => s.status === 'repeated' && (s.repeat_count ?? 0) > 0)
      .sort((a, b) => (b.repeat_count ?? 0) - (a.repeat_count ?? 0))
      .slice(0, 8),
    [stickers]
  )

  const totalExtras = useMemo(() =>
    stickers.reduce((sum, s) => sum + (s.status === 'repeated' ? (s.repeat_count ?? 0) : 0), 0),
    [stickers]
  )

  // Types with at least one extra (separate from progress.repeated which is now total extra copies)
  const repeatedTypes = useMemo(
    () => stickers.filter((s) => s.status === 'repeated').length,
    [stickers]
  )

  const complete100 = teamStats.filter((t) => t.pct === 100).length
  const missingCount = progress.missing

  return (
    <div className="space-y-10">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          value={`${progress.percentComplete.toFixed(1)}%`}
          label="Completado"
          color="text-gold2"
          sub={`${progress.owned} / ${progress.total}`}
        />
        <StatCard
          value={String(progress.owned)}
          label="Tengo"
          color="text-blue-400"
          sub={`${progress.owned - repeatedTypes} únicas`}
        />
        <StatCard
          value={String(totalExtras)}
          label="Extras"
          color="text-amber-400"
          sub={`${repeatedTypes} tipo${repeatedTypes !== 1 ? 's' : ''}`}
        />
        <StatCard
          value={String(missingCount)}
          label="Me faltan"
          color="text-red-400"
          sub={`${progress.total > 0 ? ((missingCount / progress.total) * 100).toFixed(0) : 0}% del álbum`}
        />
      </div>

      {/* Team ranking */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-display text-gold2 uppercase">Progreso por selección</h3>
          {complete100 > 0 && (
            <span className="text-xs bg-gold2/20 text-gold2 px-2 py-1 rounded-full font-semibold">
              {complete100} completada{complete100 !== 1 ? 's' : ''} ✓
            </span>
          )}
        </div>
        <div className="space-y-2">
          {teamStats.map((team, i) => (
            <div key={team.code} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-5 text-right">{i + 1}</span>
              <TeamFlag code={team.code} className="text-lg w-7 text-center" />
              <span className="text-sm text-white w-28 truncate shrink-0">{team.name}</span>
              <div className="flex-1 bg-surface3 rounded-full h-2 min-w-0">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    team.pct === 100
                      ? 'bg-gold2'
                      : team.pct >= 75
                      ? 'bg-green-500'
                      : team.pct >= 40
                      ? 'bg-blue-500'
                      : team.pct > 0
                      ? 'bg-blue-700'
                      : 'bg-transparent'
                  }`}
                  style={{ width: `${team.pct}%` }}
                />
              </div>
              <span
                className={`text-xs w-10 text-right shrink-0 ${
                  team.pct === 100 ? 'text-gold2 font-bold' : 'text-gray-500'
                }`}
              >
                {team.owned}/20
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Most repeated */}
      {mostRepeated.length > 0 && (
        <div>
          <h3 className="text-base font-display text-gold2 uppercase mb-4">
            Más repetidas
            <span className="text-sm font-sans font-normal text-gray-500 ml-2 normal-case">
              {totalExtras} extras en total
            </span>
          </h3>
          <div className="space-y-2">
            {mostRepeated.map((s) => (
              <div
                key={s.sticker_key}
                className="flex items-center gap-3 bg-surface2 rounded-lg px-4 py-2.5 border border-surface3"
              >
                <span className="font-mono text-xs text-gold2 w-16 shrink-0">{displayKey(s.sticker_key)}</span>
                <span className="flex-1 text-sm text-white truncate">
                  {getStickerName(s.sticker_key)}
                </span>
                <span className="text-amber-400 font-bold text-sm shrink-0">×{s.repeat_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mostRepeated.length === 0 && progress.repeated === 0 && (
        <div className="text-center py-8 text-gray-600 text-sm">
          Aún no tenés figuritas repetidas registradas.
        </div>
      )}
    </div>
  )
}
