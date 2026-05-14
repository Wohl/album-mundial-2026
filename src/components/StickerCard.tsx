'use client'

import { StickerState } from '@/types'
import { displayKey } from '@/lib/stickers'
import { StickerFlag } from '@/components/TeamFlag'

interface StickerCardProps {
  id: string
  name: string
  team?: string
  foil?: boolean
  status?: StickerState['status']
  repeatCount?: number
  onMark: (status: 'owned' | 'missing' | 'repeated', count?: number) => void
}

export const StickerCard = ({
  id,
  name,
  team,
  foil = false,
  status = 'missing',
  repeatCount = 0,
  onMark,
}: StickerCardProps) => {
  const totalCount = status === 'owned' ? 1 : status === 'repeated' ? repeatCount + 1 : 0

  // Strip "Team - " prefix so only the player name is shown
  const playerName = team ? name.replace(`${team} - `, '') : name
  // Star players carry the ✦ symbol in their name; foil shields keep their own border
  const isStar = playerName.includes('✦') && !foil

  const handleDecrement = () => {
    if (status === 'owned') {
      onMark('missing')
    } else {
      const newCount = repeatCount - 1
      if (newCount <= 0) onMark('owned', 0)
      else onMark('repeated', newCount)
    }
  }

  const handleIncrement = () => {
    if (status === 'owned') {
      onMark('repeated', 1)
    } else {
      onMark('repeated', repeatCount + 1)
    }
  }

  // ── Inner card ───────────────────────────────────────────────
  const innerCard = (
    <div
      className={`relative transition-all duration-150 overflow-hidden flex flex-col ${
        isStar
          ? // Holo wrapper provides the border; inner card just needs background
            `rounded-[10px] border-0 ${
              status === 'owned'
                ? 'bg-green-500/10'
                : status === 'repeated'
                ? 'bg-amber-500/10'
                : 'bg-surface2 opacity-55'
            }`
          : // Normal card with explicit border
            `rounded-xl border-2 ${
              status === 'owned'
                ? foil
                  ? 'border-gold2 bg-gradient-to-br from-gold/20 to-gold2/10 shadow-md shadow-gold/20'
                  : 'border-green-500/60 bg-green-500/10'
                : status === 'repeated'
                ? 'border-amber-500/60 bg-amber-500/10'
                : 'border-surface3 bg-surface2 opacity-55'
            }`
      }`}
    >
      {/* Count badge — top-right corner */}
      {totalCount > 0 && (
        <div
          className={`absolute top-1.5 right-1.5 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center z-10 ${
            status === 'owned' ? 'bg-green-500 text-white' : 'bg-amber-500 text-dark'
          }`}
        >
          {totalCount}
        </div>
      )}

      {/* Top: sticker info */}
      <div className="p-3 flex-1">
        {/* Code + badges row */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] font-mono text-gold2 font-bold leading-none">
            {displayKey(id)}
          </span>
          {foil && <span className="text-[10px] leading-none">✨</span>}
          {isStar && (
            <span className="text-[10px] leading-none text-amber-300">✦</span>
          )}
        </div>

        {/* Player / sticker name */}
        <div className="text-xs font-semibold text-white line-clamp-2 leading-snug min-h-[2.4rem]">
          {playerName}
        </div>

        {/* Team with flag */}
        {team && (
          <div className="text-[10px] text-gray-500 mt-1 truncate flex items-center gap-1">
            <StickerFlag stickerKey={id} className="text-sm leading-none" />
            <span>{team}</span>
          </div>
        )}
      </div>

      {/* Bottom: action controls */}
      <div className="px-2 pb-2">
        {status === 'missing' && (
          <button
            onClick={() => onMark('owned')}
            className="w-full py-1.5 rounded-lg text-xs font-bold bg-blue-600/80 hover:bg-blue-500 active:scale-95 text-white transition"
          >
            Tengo
          </button>
        )}

        {(status === 'owned' || status === 'repeated') && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDecrement}
              className="w-8 h-7 rounded-lg text-sm font-bold bg-surface3 hover:bg-gray-600 active:scale-95 text-white transition flex items-center justify-center"
            >
              −
            </button>
            <button
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition pointer-events-none ${
                status === 'owned'
                  ? 'bg-green-600/80 text-white'
                  : 'bg-amber-500/80 text-dark'
              }`}
            >
              Lo tengo
            </button>
            <button
              onClick={handleIncrement}
              className="w-8 h-7 rounded-lg text-sm font-bold bg-surface3 hover:bg-gray-600 active:scale-95 text-white transition flex items-center justify-center"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Star players get the rotating holographic border wrapper
  if (isStar) {
    return (
      <div className="holo-wrapper rounded-xl">
        {innerCard}
      </div>
    )
  }

  return innerCard
}
