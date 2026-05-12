'use client'

import clsx from 'clsx'
import { StickerState } from '@/types'

interface StickerCardProps {
  id: string
  name: string
  team?: string
  foil?: boolean
  status?: StickerState['status']
  repeatCount?: number
  onClick?: (e: React.MouseEvent) => void
  onRightClick?: (e: React.MouseEvent) => void
}

export const StickerCard = ({
  id,
  name,
  team,
  foil = false,
  status = 'missing',
  repeatCount = 0,
  onClick,
  onRightClick,
}: StickerCardProps) => {
  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onRightClick?.(e)
  }

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={clsx(
        'relative h-32 rounded-lg cursor-pointer transition-all duration-300',
        'border-2 border-transparent hover:scale-105 hover:shadow-lg',
        {
          'bg-gradient-to-br from-gold/20 to-gold2/10 border-gold2 shadow-lg shadow-gold/30':
            foil && status === 'owned',
          'bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-400 shadow-lg shadow-blue/20':
            status === 'owned' && !foil,
          'bg-surface2 border-surface3 opacity-50': status === 'missing',
          'bg-gradient-to-br from-amber-600/20 to-amber-400/10 border-amber-400':
            status === 'repeated',
        }
      )}
    >
      {/* Shimmer effect */}
      {foil && status === 'owned' && (
        <div className="absolute inset-0 rounded-lg animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-3">
        <div>
          <div className="text-xs font-display text-gold2 uppercase tracking-wider">{id}</div>
          <div className="text-sm font-bold text-white mt-1 line-clamp-2">{name}</div>
          {team && <div className="text-xs text-gray-400 mt-1 truncate">{team}</div>}
        </div>

        {/* Status badges */}
        <div className="flex justify-between items-center">
          {status === 'owned' && (
            <span className="text-xs bg-green-600/60 px-2 py-1 rounded text-white font-semibold">
              ✓ No repetida
            </span>
          )}
          {status === 'repeated' && (
            <span className="text-xs bg-amber-600/60 px-2 py-1 rounded text-white font-semibold">
              × {repeatCount}
            </span>
          )}
          {status === 'missing' && (
            <span className="text-xs bg-red-600/60 px-2 py-1 rounded text-white font-semibold">
              ○ Faltante
            </span>
          )}
          {foil && (
            <span className="text-lg">✨</span>
          )}
        </div>
      </div>
    </div>
  )
}
