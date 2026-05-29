'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { StickerState } from '@/types'
import { displayKey, getStickerName } from '@/lib/stickers'
import { StickerFlag } from '@/components/TeamFlag'

interface TradeReceivedSummaryProps {
  /** Sticker keys received in this trade or bulk operation */
  receivedKeys: string[]
  /** Sticker states snapshot taken BEFORE the trade was accepted, used for categorization */
  myStickersSnapshot: StickerState[]
  title?: string
  subtitle?: string
  onClose: () => void
}

export const TradeReceivedSummary = ({
  receivedKeys,
  myStickersSnapshot,
  title = 'Intercambio completado',
  subtitle,
  onClose,
}: TradeReceivedSummaryProps) => {
  const ownedKeys = new Set(
    myStickersSnapshot
      .filter((s) => s.status === 'owned' || s.status === 'repeated')
      .map((s) => s.sticker_key)
  )

  const newOnes = receivedKeys.filter((k) => !ownedKeys.has(k))
  const extras = receivedKeys.filter((k) => ownedKeys.has(k))

  const defaultSubtitle =
    subtitle ??
    `${receivedKeys.length} figurita${receivedKeys.length !== 1 ? 's' : ''} recibida${receivedKeys.length !== 1 ? 's' : ''}`

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/80" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(13,22,40,0.98)',
            border: '1px solid rgba(245,197,66,0.25)',
          }}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 290 }}
        >
          {/* Header */}
          <div
            className="p-5 border-b"
            style={{
              borderColor: 'rgba(245,197,66,0.15)',
              background: 'linear-gradient(135deg, rgba(245,197,66,0.07) 0%, transparent 60%)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)' }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#081120"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-display text-gold2 uppercase tracking-wide leading-tight">
                  {title}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">{defaultSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-72 overflow-y-auto">
            {receivedKeys.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No se recibieron figuritas en este intercambio.
              </p>
            )}

            {newOnes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">
                    ✨ Nuevas
                  </span>
                  <span className="text-[10px] bg-green-500/20 text-green-400 font-bold px-1.5 py-0.5 rounded-full">
                    {newOnes.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newOnes.map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                      style={{
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.28)',
                      }}
                    >
                      <StickerFlag stickerKey={key} className="text-base shrink-0 leading-none" />
                      <div>
                        <div className="text-[10px] font-mono text-green-400 font-bold leading-none">
                          {displayKey(key)}
                        </div>
                        <div className="text-[10px] text-gray-300 leading-tight max-w-[8rem] truncate">
                          {getStickerName(key)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extras.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    Extras
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded-full">
                    {extras.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {extras.map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                      style={{
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.25)',
                      }}
                    >
                      <StickerFlag stickerKey={key} className="text-base shrink-0 leading-none" />
                      <div>
                        <div className="text-[10px] font-mono text-amber-400 font-bold leading-none">
                          {displayKey(key)}
                        </div>
                        <div className="text-[10px] text-gray-300 leading-tight max-w-[8rem] truncate">
                          {getStickerName(key)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t" style={{ borderColor: 'rgba(245,197,66,0.12)' }}>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-dark text-sm uppercase transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)' }}
            >
              Continuar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
