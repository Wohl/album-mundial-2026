'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickerState } from '@/types'
import { getStickerName } from '@/lib/stickers'
import { OtherUserSticker } from '@/services/tradeService'

interface TradeOfferModalProps {
  targetSticker: OtherUserSticker
  myRepeated: StickerState[]
  onConfirm: (offeredKey: string) => void
  onClose: () => void
}

export const TradeOfferModal = ({ targetSticker, myRepeated, onConfirm, onClose }: TradeOfferModalProps) => {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative bg-surface2 border border-gold2/30 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="p-5 border-b border-surface3">
            <h2 className="text-xl font-display text-gold2 uppercase">Proponer intercambio</h2>
            <p className="text-gray-400 text-sm mt-1">
              Solicitas a <span className="font-bold text-white">{targetSticker.owner_name}</span>
            </p>
          </div>

          {/* Sticker que quiero */}
          <div className="px-5 py-4 bg-surface3/30 mx-5 mt-4 rounded-lg">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Quiero esta figurita</div>
            <div className="font-bold text-white">{getStickerName(targetSticker.sticker_key)}</div>
            <div className="text-gold2 text-sm">{targetSticker.sticker_key}</div>
          </div>

          {/* Mis repetidas */}
          <div className="px-5 pt-4 pb-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Elige qué ofreces a cambio
            </div>
            {myRepeated.length === 0 ? (
              <p className="text-gray-500 text-sm">No tenés figuritas repetidas disponibles para ofrecer.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {myRepeated.map((s) => (
                  <button
                    key={s.sticker_key}
                    onClick={() => setSelected(s.sticker_key)}
                    className={`text-left p-2 rounded-lg border-2 text-xs transition ${
                      selected === s.sticker_key
                        ? 'border-gold2 bg-gold2/10'
                        : 'border-surface3 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold text-white line-clamp-2">{getStickerName(s.sticker_key)}</div>
                    <div className="text-gold2 mt-0.5">{s.sticker_key}</div>
                    <div className="text-amber-400 mt-0.5">× {s.repeat_count} extras</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 flex gap-3 border-t border-surface3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-surface3 hover:bg-gray-600 text-white font-bold rounded uppercase text-sm transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => selected && onConfirm(selected)}
              disabled={!selected}
              className="flex-1 py-2 bg-gradient-to-r from-gold to-gold2 text-dark font-bold rounded uppercase text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
