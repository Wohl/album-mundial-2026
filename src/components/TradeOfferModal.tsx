'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickerState } from '@/types'
import { getStickerName } from '@/lib/stickers'
import { OtherUserSticker } from '@/services/tradeService'

interface TradeOfferModalProps {
  targetSticker: OtherUserSticker
  myRepeated: StickerState[]
  targetMissing: string[]
  onConfirm: (offeredKey: string) => void
  onClose: () => void
}

const StickerOption = ({
  sticker,
  selected,
  recommended,
  onClick,
}: {
  sticker: StickerState
  selected: boolean
  recommended: boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={`relative text-left p-3 rounded-lg border-2 text-xs transition ${
      selected
        ? 'border-gold2 bg-gold2/10 shadow-md shadow-gold2/20'
        : recommended
        ? 'border-green-500/60 bg-green-500/10 hover:border-green-400'
        : 'border-surface3 bg-surface2 hover:border-gray-500'
    }`}
  >
    {recommended && (
      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
        La necesitan
      </div>
    )}
    {selected && (
      <div className="absolute -top-2 -left-2 bg-gold2 text-dark text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
        ✓
      </div>
    )}
    <div className="font-semibold text-white line-clamp-2 leading-tight">{getStickerName(sticker.sticker_key)}</div>
    <div className="text-gold2 mt-1 font-mono">{sticker.sticker_key}</div>
    <div className="text-gray-500 mt-1">×{sticker.repeat_count} extras</div>
  </button>
)

export const TradeOfferModal = ({
  targetSticker,
  myRepeated,
  targetMissing,
  onConfirm,
  onClose,
}: TradeOfferModalProps) => {
  const [selected, setSelected] = useState<string | null>(null)

  const recommended = myRepeated.filter((s) => targetMissing.includes(s.sticker_key))
  const others = myRepeated.filter((s) => !targetMissing.includes(s.sticker_key))

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />

        <motion.div
          className="relative bg-surface2 border border-gold2/30 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="p-5 border-b border-surface3 shrink-0">
            <h2 className="text-xl font-display text-gold2 uppercase">Proponer intercambio</h2>
            <p className="text-gray-400 text-sm mt-1">
              Solicitas a <span className="font-bold text-white">{targetSticker.owner_name}</span>
            </p>
          </div>

          {/* Quiero esta figurita */}
          <div className="px-5 py-3 mx-5 mt-4 rounded-lg bg-surface3/40 border border-surface3 shrink-0">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Querés esta figurita</div>
            <div className="font-bold text-white">{getStickerName(targetSticker.sticker_key)}</div>
            <div className="text-gold2 text-sm font-mono">{targetSticker.sticker_key}</div>
            <div className="text-gray-500 text-xs mt-0.5">×{targetSticker.repeat_count} disponibles</div>
          </div>

          {/* Elegir oferta */}
          <div className="px-5 pt-4 pb-2 overflow-y-auto flex-1 min-h-0">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Elegí qué ofrecés a cambio
            </div>

            {myRepeated.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                No tenés figuritas repetidas para ofrecer.
              </p>
            ) : (
              <div className="space-y-4">
                {recommended.length > 0 && (
                  <div>
                    <div className="text-xs text-green-400 font-semibold mb-2 flex items-center gap-1.5">
                      <span className="text-base">⭐</span>
                      Recomendadas — ellos las necesitan
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {recommended.map((s) => (
                        <StickerOption
                          key={s.sticker_key}
                          sticker={s}
                          selected={selected === s.sticker_key}
                          recommended
                          onClick={() => setSelected(s.sticker_key)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {others.length > 0 && (
                  <div>
                    {recommended.length > 0 && (
                      <div className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">
                        Otras repetidas
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {others.map((s) => (
                        <StickerOption
                          key={s.sticker_key}
                          sticker={s}
                          selected={selected === s.sticker_key}
                          recommended={false}
                          onClick={() => setSelected(s.sticker_key)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 flex gap-3 border-t border-surface3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-surface3 hover:bg-gray-600 text-white font-bold rounded-lg uppercase text-sm transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => selected && onConfirm(selected)}
              disabled={!selected}
              className="flex-1 py-2.5 bg-gradient-to-r from-gold to-gold2 text-dark font-bold rounded-lg uppercase text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar oferta
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
