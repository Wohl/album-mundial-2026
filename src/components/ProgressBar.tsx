'use client'

import { motion } from 'framer-motion'
import { UserProgress } from '@/types'

interface ProgressBarProps {
  progress: UserProgress
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const { owned, total, repeated, percentComplete } = progress
  const missing = progress.missing

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border"
      style={{
        background: 'linear-gradient(135deg, #0C1A30 0%, #0F1E38 50%, #0C1A30 100%)',
        borderColor: 'rgba(245,197,66,0.14)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(245,197,66,0.07)',
      }}
    >
      {/* Patrón de fondo */}
      <div className="absolute inset-0 diamond-pattern opacity-40 pointer-events-none" />

      {/* Destellos ambientales */}
      <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,197,66,0.06) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(14,90,54,0.08) 0%, transparent 70%)' }} />

      {/* Línea dorada superior */}
      <div className="header-accent" />

      <div className="relative z-10 p-5 space-y-4">

        {/* ── FILA SUPERIOR: título + copa ───────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.35em] font-semibold mb-2"
              style={{ color: 'rgba(163,181,211,0.45)' }}>
              Tu colección
            </p>
            {/* Número principal: owned / total */}
            <div className="flex items-baseline gap-2">
              <span className="font-display leading-none"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  background: 'linear-gradient(135deg, #F5C542 0%, #FFD700 60%, #FFF5CC 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {owned.toLocaleString('es')}
              </span>
              <span className="font-display text-xl leading-none" style={{ color: 'rgba(245,197,66,0.35)' }}>
                / {total}
              </span>
            </div>
            <p className="text-xs mt-1 font-semibold tabular-nums"
              style={{ color: 'rgba(163,181,211,0.55)' }}>
              {percentComplete.toFixed(1)}% completado
            </p>
          </div>

          {/* Copa decorativa */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-1">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245,197,66,0.15) 0%, rgba(255,215,0,0.06) 100%)',
                border: '1px solid rgba(245,197,66,0.22)',
                boxShadow: '0 0 16px rgba(245,197,66,0.1)',
              }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
            </div>
            <span className="text-[9px] font-display tracking-widest" style={{ color: 'rgba(245,197,66,0.55)' }}>
              2026
            </span>
          </div>
        </div>

        {/* ── BARRA DE PROGRESO ──────────────────────────────── */}
        <div>
          <div className="w-full rounded-full overflow-hidden relative" style={{ height: '10px' }}>
            {/* Track */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(20,36,60,0.9)' }} />

            {/* Fill */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'linear-gradient(90deg, #D4A017 0%, #F5C542 45%, #FFD700 75%, #FFF5CC 100%)',
                boxShadow: '0 0 10px rgba(255,215,0,0.45)',
              }}
            />

            {/* Tip dot */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{ width: 10, height: 10, boxShadow: '0 0 7px rgba(255,215,0,0.85)' }}
              initial={{ left: '0%' }}
              animate={{ left: `calc(${percentComplete}% - 5px)` }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Etiquetas de progreso */}
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px]" style={{ color: 'rgba(163,181,211,0.35)' }}>0</span>
            <span className="text-[9px]" style={{ color: 'rgba(163,181,211,0.35)' }}>{total}</span>
          </div>
        </div>

        {/* ── ESTADÍSTICAS ───────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Tengo */}
          <div className="relative text-center py-2.5 px-2 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(6,50,20,0.45) 0%, rgba(12,24,44,0.75) 100%)',
              border: '1px solid rgba(34,197,94,0.18)',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent)' }} />
            <div className="font-display text-xl leading-none mb-1" style={{ color: '#4ade80' }}>
              {owned.toLocaleString('es')}
            </div>
            <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'rgba(34,197,94,0.55)' }}>
              Tengo
            </div>
          </div>

          {/* Extras */}
          <div className="relative text-center py-2.5 px-2 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(80,40,0,0.35) 0%, rgba(12,24,44,0.75) 100%)',
              border: '1px solid rgba(245,158,11,0.16)',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }} />
            <div className="font-display text-xl leading-none mb-1" style={{ color: '#fbbf24' }}>
              {repeated}
            </div>
            <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'rgba(245,158,11,0.55)' }}>
              Extras
            </div>
          </div>

          {/* Faltan */}
          <div className="relative text-center py-2.5 px-2 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(60,10,10,0.35) 0%, rgba(12,24,44,0.75) 100%)',
              border: '1px solid rgba(239,68,68,0.16)',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)' }} />
            <div className="font-display text-xl leading-none mb-1" style={{ color: '#f87171' }}>
              {missing}
            </div>
            <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'rgba(239,68,68,0.55)' }}>
              Faltan
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
