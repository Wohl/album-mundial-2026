'use client'

import { UserProgress } from '@/types'

interface ProgressBarProps {
  progress: UserProgress
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const { owned, total, repeated, percentComplete } = progress
  // progress.missing is already correct (total - owned)

  return (
    <div className="w-full bg-surface2 rounded-lg p-6 border border-surface3">
      {/* Title and percentage */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-display text-gold2 uppercase">Tu colección</h3>
        <div className="text-2xl font-bold">
          <span className="text-gold2">{percentComplete.toFixed(1)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface3 rounded-full h-3 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-gold to-gold2 transition-all duration-500"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-green-400 font-bold text-2xl">{owned}</div>
          <div className="text-xs text-gray-400 uppercase mt-1">Tengo</div>
        </div>
        <div>
          <div className="text-amber-400 font-bold text-2xl">{repeated}</div>
          <div className="text-xs text-gray-400 uppercase mt-1">Repetidas</div>
        </div>
        <div>
          <div className="text-red-400 font-bold text-2xl">{progress.missing}</div>
          <div className="text-xs text-gray-400 uppercase mt-1">Faltan</div>
        </div>
      </div>
    </div>
  )
}
