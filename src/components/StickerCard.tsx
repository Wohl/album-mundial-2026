'use client'

import { useState, useRef, useEffect } from 'react'
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
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches)
  }, [])

  const imgSrc = isPlayerSticker
    ? `/players/${id.split('_')[0]}/${displayKey(id)}.png`
    : null

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMissing || isTouch || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    setTilt({ x: y * -12, y: x * 12 })
  }

  const handleMouseLeave = () => { if (!isTouch) setTilt({ x: 0, y: 0 }) }

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

  // ── Borde por rareza + estado ───────────────────────────────────
  const borderCls = isLegend
    ? isMissing
      ? 'border-purple-900/20'
      : 'border-purple-500/50'
    : foil
    ? isMissing
      ? 'border-gold/15'
      : 'border-gold2/60'
    : status === 'owned'
    ? 'border-green-500/35'
    : status === 'repeated'
    ? 'border-amber-500/35'
    : 'border-surface3/80'

  // ── Background por rareza + estado ─────────────────────────────
  const bgCls = isMissing
    ? 'bg-surface2'
    : isLegend
    ? 'bg-gradient-to-b from-purple-950/60 via-surface2 to-surface2'
    : foil
    ? 'bg-gradient-to-b from-yellow-950/50 via-surface2 to-surface2'
    : status === 'owned'
    ? 'bg-gradient-to-b from-green-950/40 via-surface2 to-surface2'
    : 'bg-gradient-to-b from-amber-950/30 via-surface2 to-surface2'

  // ── Sombra por estado ───────────────────────────────────────────
  const shadowCls = isMissing
    ? 'shadow-card'
    : isLegend
    ? 'shadow-plasma-sm'
    : foil
    ? 'shadow-gold-sm'
    : status === 'owned'
    ? 'shadow-md shadow-green-900/40'
    : 'shadow-md shadow-amber-900/30'

  const card = (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        scale: !isMissing && (tilt.x !== 0 || tilt.y !== 0) ? 1.04 : 1,
      }}
      whileTap={!isMissing ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
      className={[
        'card-shine',
        foil && !isMissing ? 'foil-active' : '',
        'relative rounded-xl border-2 flex flex-col overflow-hidden cursor-default',
        borderCls,
        bgCls,
        shadowCls,
        isMissing ? 'opacity-50' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* ── Rarity badge (top-left) ────────────────────────── */}
      {(isLegend || foil) && !isMissing && (
        <div
          className={`absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[7px] font-bold tracking-widest uppercase leading-none ${
            isLegend ? 'badge-legend text-white' : 'badge-foil text-dark'
          }`}
          style={{ letterSpacing: '0.12em' }}
        >
          {isLegend ? '✦ LEYENDA' : '★ FOIL'}
        </div>
      )}

      {/* ── Count badge (top-right) ────────────────────────── */}
      {totalCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.05 }}
          className={`absolute top-1.5 right-1.5 z-10 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-offset-0 ${
            status === 'owned'
              ? 'bg-green-500 text-white ring-green-400/25 shadow-md shadow-green-900/50'
              : 'bg-amber-500 text-dark ring-amber-400/25 shadow-md shadow-amber-900/40'
          }`}
        >
          {totalCount}
        </motion.div>
      )}

      {/* ── Player portrait ─────────────────────────────────── */}
      {imgSrc && imgStatus !== 'error' && (
        <div className={`w-full relative flex-shrink-0 overflow-hidden transition-[height] duration-300 ${
          imgStatus === 'loaded' ? 'h-32' : 'h-0'
        }`}>
          <img
            src={imgSrc}
            alt={playerName}
            className={`w-full h-full object-cover object-top transition-all duration-300 ${
              isMissing ? 'grayscale opacity-25 brightness-60' : 'opacity-100'
            }`}
            onLoad={() => setImgStatus('loaded')}
            onError={() => setImgStatus('error')}
          />
          {/* Gradiente inferior — funde con el fondo de la card */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface2 to-transparent pointer-events-none" />
          {/* Viñeta lateral sutil */}
          <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-surface2/50 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-surface2/50 to-transparent pointer-events-none" />

          {/* Acento de color por rareza en el top de imagen */}
          {!isMissing && (
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${
              isLegend ? 'bg-gradient-to-r from-holoMagenta via-holoCyan to-holoMagenta' :
              foil ? 'bg-gradient-to-r from-gold via-gold2 to-gold' :
              status === 'owned' ? 'bg-gradient-to-r from-green-600 to-green-400' :
              'bg-gradient-to-r from-amber-600 to-amber-400'
            }`} />
          )}
        </div>
      )}

      {/* ── Card info ───────────────────────────────────────── */}
      <div className="px-2.5 pt-2 pb-0.5 flex-1 flex flex-col">
        {/* Número de sticker + flag */}
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={`text-[10px] font-mono font-bold leading-none tracking-wide ${
            isLegend
              ? 'text-gradient-holo'
              : foil
              ? 'text-gold2'
              : isMissing
              ? 'text-surface4'
              : 'text-gold/80'
          }`}>
            {displayKey(id)}
          </span>
          {team && (
            <StickerFlag stickerKey={id} className="text-sm leading-none shrink-0 opacity-80" />
          )}
        </div>

        {/* Nombre del jugador */}
        <div
          className={`text-xs font-semibold leading-snug line-clamp-2 flex-1 mt-0.5 ${
            isMissing ? 'text-surface4' : isLegend ? 'text-white' : 'text-humo/90'
          }`}
          style={{ minHeight: '2.1rem' }}
        >
          {playerName}
        </div>

        {/* Equipo */}
        {team && (
          <div className="mt-1 mb-0.5">
            <span className={`text-[9px] font-semibold uppercase tracking-wider truncate ${
              isMissing ? 'text-surface4' : 'text-surface4'
            }`} style={{ color: isMissing ? undefined : 'rgba(245,197,66,0.45)' }}>
              {team}
            </span>
          </div>
        )}
      </div>

      {/* ── Action controls ─────────────────────────────────── */}
      <div className="px-2 pb-2 pt-1">
        {status === 'missing' && (
          <button
            onClick={() => onMark('owned')}
            className="w-full py-1.5 rounded-lg text-xs font-bold bg-surface3/80 hover:bg-verde/70 active:scale-95 text-surface4 hover:text-white transition-all duration-150 border border-surface3 hover:border-verde"
          >
            + Tengo
          </button>
        )}

        {(status === 'owned' || status === 'repeated') && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDecrement}
              className="w-8 h-7 rounded-lg text-sm font-bold bg-surface3/80 hover:bg-surface4 active:scale-95 text-gray-300 hover:text-white transition flex items-center justify-center border border-surface3/60"
            >
              −
            </button>
            <div className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center select-none ${
              status === 'owned'
                ? 'bg-green-900/50 text-green-300 border border-green-700/30'
                : 'bg-amber-900/40 text-amber-300 border border-amber-700/25'
            }`}>
              {status === 'owned' ? 'Lo tengo' : `×${totalCount}`}
            </div>
            <button
              onClick={handleIncrement}
              className="w-8 h-7 rounded-lg text-sm font-bold bg-surface3/80 hover:bg-surface4 active:scale-95 text-gray-300 hover:text-white transition flex items-center justify-center border border-surface3/60"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* ── Overlay de rareza: brillo de fondo sutil ───────── */}
      {!isMissing && (isLegend || foil) && (
        <div
          className={`absolute inset-0 pointer-events-none rounded-xl opacity-[0.04] ${
            isLegend
              ? 'bg-gradient-to-br from-holoMagenta via-transparent to-holoCyan'
              : 'bg-gradient-to-br from-gold via-transparent to-gold2'
          }`}
        />
      )}
    </motion.div>
  )

  // Legend → holo wrapper animado
  if (isLegend) {
    return (
      <div className="holo-wrapper rounded-xl">
        {card}
      </div>
    )
  }

  return card
}
