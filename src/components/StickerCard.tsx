'use client'

import { StickerState } from '@/types'

interface StickerCardProps {
  id: string
  name: string
  team?: string
  flag?: string
  foil?: boolean
  status?: StickerState['status']
  repeatCount?: number
  onMark: (status: 'owned' | 'missing' | 'repeated', count?: number) => void
}

export const StickerCard = ({
  id,
  name,
  team,
  flag,
  foil = false,
  status = 'missing',
  repeatCount = 0,
  onMark,
}: StickerCardProps) => {
  const handleDecrement = () => {
    const newCount = repeatCount - 1
    if (newCount <= 0) onMark('owned', 0)
    else onMark('repeated', newCount)
  }

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-150 overflow-hidden flex flex-col ${
        status === 'owned'
          ? foil
            ? 'border-gold2 bg-gradient-to-br from-gold/20 to-gold2/10 shadow-md shadow-gold/20'
            : 'border-blue-500/50 bg-blue-500/10'
          : status === 'repeated'
          ? 'border-amber-500/60 bg-amber-500/10'
          : 'border-surface3 bg-surface2 opacity-55'
      }`}
    >
      {/* Top: sticker info */}
      <div className="p-3 flex-1">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-mono text-gold2 font-bold leading-none">{id}</span>
          {foil && <span className="text-xs leading-none">✨</span>}
        </div>
        <div className="text-xs font-semibold text-white line-clamp-2 leading-snug min-h-[2.4rem]">
          {name}
        </div>
        {team && (
          <div className="text-[10px] text-gray-500 mt-1 truncate flex items-center gap-1">
            {flag && <span>{flag}</span>}
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

        {status === 'owned' && (
          <div className="flex gap-1">
            <button
              onClick={() => onMark('missing')}
              title="Marcar como faltante"
              className="w-8 py-1.5 rounded-lg text-xs font-bold bg-surface3 hover:bg-gray-600 active:scale-95 text-gray-400 transition"
            >
              ✕
            </button>
            <button
              onClick={() => onMark('repeated', 1)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-600/70 hover:bg-amber-600 active:scale-95 text-white transition"
            >
              +1 extra
            </button>
          </div>
        )}

        {status === 'repeated' && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDecrement}
              className="w-8 h-7 rounded-lg text-sm font-bold bg-surface3 hover:bg-gray-600 active:scale-95 text-white transition flex items-center justify-center"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-bold text-amber-400">{repeatCount}</span>
              <span className="text-[10px] text-gray-500 ml-1">extra{repeatCount !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={() => onMark('repeated', repeatCount + 1)}
              className="w-8 h-7 rounded-lg text-sm font-bold bg-amber-600/70 hover:bg-amber-600 active:scale-95 text-white transition flex items-center justify-center"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
