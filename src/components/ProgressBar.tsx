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
    <div className="relative w-full rounded-2xl overflow-hidden border border-surface3/60"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #132030 60%, #0F172A 100%)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(245,197,66,0.08)',
      }}
    >
      {/* Patrón de diamantes fondo */}
      <div className="absolute inset-0 diamond-pattern opacity-50 pointer-events-none" />

      {/* Destellos de estadio */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-verde/8 blur-2xl pointer-events-none" />

      {/* Línea dorada superior */}
      <div className="header-accent" />

      <div className="relative z-10 p-5">
        {/* Fila superior: porcentaje + conteo */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-surface4 mb-1 font-semibold">
              Tu colección
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-display text-gradient-gold leading-none">
                {percentComplete.toFixed(1)}
              </span>
              <span className="text-gold/50 font-display text-2xl leading-none">%</span>
            </div>
          </div>

          {/* Indicador de Copa */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 bg-surface3/60 border border-surface3 rounded-lg px-3 py-1.5">
              <span className="text-base leading-none">🏆</span>
              <div className="text-right">
                <p className="text-[10px] text-surface4 leading-none">Mundial</p>
                <p className="text-xs font-bold text-gold leading-none mt-0.5">2026</p>
              </div>
            </div>
            <p className="text-[10px] text-surface4 font-mono">
              <span className="text-gray-400 font-bold">{owned}</span>
              <span className="mx-0.5">/</span>
              <span>{total}</span>
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full rounded-full h-3 overflow-hidden mb-5 relative progress-track">
          {/* Track de fondo */}
          <div className="absolute inset-0 rounded-full bg-surface3/80" />

          {/* Barra de progreso animada */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentComplete}%` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'linear-gradient(90deg, #F5C542 0%, #FFD700 50%, #FFF5CC 100%)',
              boxShadow: '0 0 12px rgba(255,215,0,0.5), 0 0 4px rgba(255,245,180,0.8)',
            }}
          />

          {/* Puntito de cabeza */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-lg"
            initial={{ left: '0%' }}
            animate={{ left: `calc(${percentComplete}% - 5px)` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ boxShadow: '0 0 8px rgba(255,215,0,0.9)' }}
          />
        </div>

        {/* Grid de estadísticas */}
        <div className="grid grid-cols-3 gap-3">
          {/* Tengo */}
          <div className="relative text-center p-3 rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(6,50,20,0.5) 0%, rgba(19,32,48,0.8) 100%)', border: '1px solid rgba(34,197,94,0.20)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
            <div className="text-green-400 font-display text-2xl leading-none mb-1">{owned}</div>
            <div className="text-[9px] text-green-700 uppercase tracking-widest font-semibold">Tengo</div>
          </div>

          {/* Extras */}
          <div className="relative text-center p-3 rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(80,40,0,0.4) 0%, rgba(19,32,48,0.8) 100%)', border: '1px solid rgba(245,158,11,0.18)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <div className="text-amber-400 font-display text-2xl leading-none mb-1">{repeated}</div>
            <div className="text-[9px] text-amber-700 uppercase tracking-widest font-semibold">Extras</div>
          </div>

          {/* Faltan */}
          <div className="relative text-center p-3 rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(60,10,10,0.4) 0%, rgba(19,32,48,0.8) 100%)', border: '1px solid rgba(239,68,68,0.18)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <div className="text-red-400 font-display text-2xl leading-none mb-1">{missing}</div>
            <div className="text-[9px] text-red-800 uppercase tracking-widest font-semibold">Faltan</div>
          </div>
        </div>
      </div>
    </div>
  )
}
