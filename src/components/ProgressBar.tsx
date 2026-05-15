'use client'

import { motion } from 'framer-motion'
import { UserProgress } from '@/types'

interface ProgressBarProps {
  progress: UserProgress
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const { owned, total, repeated, percentComplete } = progress

  return (
    <div className="relative w-full rounded-2xl border border-surface3 overflow-hidden bg-surface2">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 diamond-pattern opacity-60 pointer-events-none" />
      {/* Subtle gold flare top-right */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-gold/5 blur-2xl pointer-events-none" />

      <div className="relative z-10 p-5">
        {/* Header row */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 mb-0.5">Tu colección</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-display text-gradient-gold leading-none">
                {percentComplete.toFixed(1)}
              </span>
              <span className="text-gold/60 font-display text-xl leading-none">%</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">
              <span className="text-gray-400 font-semibold">{owned}</span> de {total}
            </p>
            <p className="text-[10px] text-gray-700 uppercase tracking-wider">figuritas</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface3 rounded-full h-2 overflow-hidden mb-5 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold via-gold2 to-gold3"
            initial={{ width: 0 }}
            animate={{ width: `${percentComplete}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ boxShadow: '0 0 8px rgba(240,201,64,0.5)' }}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Tengo */}
          <div className="relative text-center p-3 rounded-xl bg-green-950/30 border border-green-900/30">
            <div className="text-green-400 font-bold text-2xl leading-none mb-1">{owned}</div>
            <div className="text-[10px] text-green-700 uppercase tracking-wider">Tengo</div>
          </div>

          {/* Extras */}
          <div className="relative text-center p-3 rounded-xl bg-amber-950/25 border border-amber-900/25">
            <div className="text-amber-400 font-bold text-2xl leading-none mb-1">{repeated}</div>
            <div className="text-[10px] text-amber-700 uppercase tracking-wider">Extras</div>
          </div>

          {/* Faltan */}
          <div className="relative text-center p-3 rounded-xl bg-red-950/20 border border-red-900/20">
            <div className="text-red-400 font-bold text-2xl leading-none mb-1">{progress.missing}</div>
            <div className="text-[10px] text-red-800 uppercase tracking-wider">Faltan</div>
          </div>
        </div>
      </div>
    </div>
  )
}
