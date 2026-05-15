'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
  const playerName  = team ? name.replace(`${team} - `, '') : name
  const isLegend    = playerName.includes('✦') && !foil
  const isPlayerSticker = !foil && playerName !== 'Foto Equipo'
  const isMissing   = status === 'missing'

  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const imgSrc = isPlayerSticker
    ? `/players/${id.split('_')[0]}/${displayKey(id)}.png`
    : null

  const handleDecrement = () => {
    if (status === 'owned') onMark('missing')
    else {
      const n = repeatCount - 1
      if (n <= 0) onMark('owned', 0)
      else onMark('repeated', n)
    }
  }

  const handleIncrement = () => {
    if (status === 'owned') onMark('repeated', 1)
    else onMark('repeated', repeatCount + 1)
  }

  // ── Border por rareza + estado ──────────────────────────────────
  const borderCls = isLegend
    ? isMissing
      ? 'border-purple-900/25'
      : 'border-purple-500/55'
    : foil
    ? isMissing
      ? 'border-gold/20'
      : 'border-gold2/65'
    : status === 'owned'
    ? 'border-green-500/40'
    : status === 'repeated'
    ? 'border-amber-500/40'
    : 'border-surface3'

  // ── Background por rareza + estado ─────────────────────────────
  const bgCls = isMissing
    ? 'bg-surface2'
    : isLegend
    ? 'bg-gradient-to-b from-purple-950/70 via-surface2 to-surface2'
    : foil
    ? 'bg-gradient-to-b from-yellow-950/40 via-surface2 to-surface2'
    : status === 'owned'
    ? 'bg-gradient-to-b from-green-950/35 via-surface2 to-surface2'
    : 'bg-gradient-to-b from-amber-950/25 via-surface2 to-surface2'

  // ── Shadow por estado ───────────────────────────────────────────
  const shadowCls = isMissing
    ? ''
    : isLegend
    ? 'shadow-lg shadow-purple-900/30'
    : foil
    ? 'shadow-gold-sm'
    : 'shadow-card'

  const card = (
    <motion.div
      whileHover={!isMissing ? { y: -3, scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 480, damping: 28 }}
      className={[
        'card-shine',
        foil && !isMissing ? 'foil-active' : '',
        'relative rounded-xl border-2 flex flex-col overflow-hidden',
        borderCls,
        bgCls,
        shadowCls,
        isMissing ? 'opacity-55' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* ── Rarity badge (top-left) ────────────────────────── */}
      {(isLegend || foil) && !isMissing && (
        <div className={`absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[7px] font-bold tracking-widest uppercase leading-none ${
          isLegend
            ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
            : 'bg-gradient-to-r from-gold to-gold2 text-dark'
        }`}>
          {isLegend ? '✦ LEYENDA' : '★ FOIL'}
        </div>
      )}

      {/* ── Count badge (top-right) ────────────────────────── */}
      {totalCount > 0 && (
        <div className={`absolute top-2 right-2 z-10 text-[10px] font-bold w-[1.35rem] h-[1.35rem] rounded-full flex items-center justify-center ring-2 ${
          status === 'owned'
            ? 'bg-green-500 text-white ring-green-400/30 shadow-md shadow-green-900/40'
            : 'bg-amber-500 text-dark ring-amber-400/30 shadow-md shadow-amber-900/40'
        }`}>
          {totalCount}
        </div>
      )}

      {/* ── Player portrait ─────────────────────────────────── */}
      {imgSrc && imgStatus !== 'error' && (
        <div className={`w-full relative flex-shrink-0 overflow-hidden transition-[height] duration-300 ${
          imgStatus === 'loaded' ? 'h-28' : 'h-0'
        }`}>
          <img
            src={imgSrc}
            alt={playerName}
            className={`w-full h-full object-cover object-top transition-all duration-300 ${
              isMissing ? 'grayscale opacity-35 brightness-75' : 'opacity-100'
            }`}
            onLoad={() => setImgStatus('loaded')}
            onError={() => setImgStatus('error')}
          />
          {/* Gradient fade at bottom of image → merges with card bg */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-surface2 to-transparent pointer-events-none" />
          {/* Subtle vignette sides */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-surface2/40 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-surface2/40 to-transparent pointer-events-none" />
        </div>
      )}

      {/* ── Card info ───────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-0.5 flex-1 flex flex-col">
        {/* Code row */}
        <div className="flex items-center gap-1 mb-0.5">
          <span className={`text-[10px] font-mono font-bold leading-none tracking-wide ${
            isLegend
              ? 'text-gradient-holo'
              : foil
              ? 'text-gold2'
              : isMissing
              ? 'text-gray-600'
              : 'text-gold2/80'
          }`}>
            {displayKey(id)}
          </span>
          {foil && !isLegend && (
            <span className="text-[9px] leading-none opacity-80">✨</span>
          )}
          {isLegend && (
            <span className="text-[9px] leading-none text-amber-300">✦</span>
          )}
        </div>

        {/* Player name */}
        <div className={`text-xs font-semibold leading-snug line-clamp-2 flex-1 ${
          isMissing ? 'text-gray-600' : 'text-white'
        }`} style={{ minHeight: '2.2rem' }}>
          {playerName}
        </div>

        {/* Team with flag */}
        {team && (
          <div className="flex items-center gap-1 mt-1 mb-0.5">
            <StickerFlag stickerKey={id} className="text-xs leading-none shrink-0" />
            <span className="text-[10px] text-gray-600 truncate">{team}</span>
          </div>
        )}
      </div>

      {/* ── Action controls ─────────────────────────────────── */}
      <div className="px-2 pb-2 pt-1">
        {status === 'missing' && (
          <button
            onClick={() => onMark('owned')}
            className="w-full py-1.5 rounded-lg text-xs font-bold bg-surface3 hover:bg-blue-700 active:scale-95 text-gray-500 hover:text-white transition-all duration-150 border border-surface4 hover:border-blue-600"
          >
            + Tengo
          </button>
        )}

        {(status === 'owned' || status === 'repeated') && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDecrement}
              className="w-8 h-7 rounded-lg text-sm font-bold bg-surface3 hover:bg-surface4 active:scale-95 text-gray-300 hover:text-white transition flex items-center justify-center border border-surface4"
            >
              −
            </button>
            <div className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold text-center select-none ${
              status === 'owned'
                ? 'bg-green-700/50 text-green-200 border border-green-600/30'
                : 'bg-amber-600/40 text-amber-200 border border-amber-500/30'
            }`}>
              {status === 'owned' ? 'Lo tengo' : `×${totalCount}`}
            </div>
            <button
              onClick={handleIncrement}
              className="w-8 h-7 rounded-lg text-sm font-bold bg-surface3 hover:bg-surface4 active:scale-95 text-gray-300 hover:text-white transition flex items-center justify-center border border-surface4"
            >
              +
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )

  // Leyenda → holo wrapper animado
  if (isLegend) {
    return (
      <div className="holo-wrapper rounded-xl">
        {card}
      </div>
    )
  }

  return card
}
