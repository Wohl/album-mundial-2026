'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickerState } from '@/types'
import { getStickerName, displayKey } from '@/lib/stickers'
import { isOfflineMode } from '@/lib/supabase'
import { OtherUserSticker } from '@/services/tradeService'
import { StickerFlag } from '@/components/TeamFlag'

type Phase = 'select' | 'submitting' | 'success' | 'error'

interface TradeOfferModalProps {
  targetStickers: OtherUserSticker[]   // stickers being requested (1 or more)
  myRepeated: StickerState[]
  targetMissing: string[]
  preSelectedKeys?: string[]           // optional pre-selection for auto-suggest flow
  phase: Phase
  errorMessage?: string | null
  onConfirm: (offeredKeys: string[]) => void
  onRetry: () => void
  onClose: () => void
}

const StickerOption = ({
  sticker,
  selected,
  recommended,
  disabled,
  onClick,
}: {
  sticker: StickerState
  selected: boolean
  recommended: boolean
  disabled: boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative text-left p-3 rounded-lg border-2 text-xs transition ${
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : selected
        ? 'border-gold2 bg-gold2/10 shadow-md shadow-gold2/20'
        : recommended
        ? 'border-green-500/60 bg-green-500/10 hover:border-green-400'
        : 'border-surface3 bg-surface2 hover:border-gray-500'
    }`}
  >
    {recommended && !selected && (
      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
        La necesitan
      </div>
    )}
    {selected && (
      <div className="absolute -top-2 -left-2 bg-gold2 text-dark text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
        ✓
      </div>
    )}
    <StickerFlag stickerKey={sticker.sticker_key} className="text-lg mb-1 leading-none block" />
    <div className="font-semibold text-white line-clamp-2 leading-tight">{getStickerName(sticker.sticker_key)}</div>
    <div className="text-gold2 mt-1 font-mono">{displayKey(sticker.sticker_key)}</div>
    <div className="text-gray-500 mt-1">×{sticker.repeat_count} extras</div>
  </button>
)

export const TradeOfferModal = ({
  targetStickers,
  myRepeated,
  targetMissing,
  preSelectedKeys,
  phase,
  errorMessage,
  onConfirm,
  onRetry,
  onClose,
}: TradeOfferModalProps) => {
  const recommended = useMemo(
    () => myRepeated.filter((s) => targetMissing.includes(s.sticker_key)),
    [myRepeated, targetMissing]
  )
  const others = useMemo(
    () => myRepeated.filter((s) => !targetMissing.includes(s.sticker_key)),
    [myRepeated, targetMissing]
  )

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    if (preSelectedKeys && preSelectedKeys.length > 0) {
      const valid = preSelectedKeys.find((k) => myRepeated.some((s) => s.sticker_key === k))
      if (valid) return new Set([valid])
    }
    const first = recommended[0]?.sticker_key ?? others[0]?.sticker_key
    return first ? new Set([first]) : new Set()
  })

  const isLocked = phase === 'submitting' || phase === 'success'
  const ownerName = targetStickers[0]?.owner_name ?? ''
  const isMultiTarget = targetStickers.length > 1
  const selectedOffered = Array.from(selectedKeys)

  const toggleKey = (key: string) => {
    if (isLocked) return
    setSelectedKeys((prev) => {
      if (prev.has(key)) return new Set()
      return new Set([key])
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/75" onClick={isLocked ? undefined : onClose} />

        <motion.div
          className="relative bg-surface2 border border-gold2/30 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
          initial={{ scale: 0.92, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 8 }}
        >
          {/* SUBMITTING overlay */}
          {phase === 'submitting' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface2/95 rounded-xl">
              <div className="text-gold2 text-5xl mb-5 animate-pulse">⇄</div>
              <p className="text-white font-bold text-lg font-display uppercase tracking-wide">Enviando oferta...</p>
              <p className="text-gray-500 text-sm mt-2">Aguardá un momento</p>
            </div>
          )}

          {/* SUCCESS overlay */}
          {phase === 'success' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface2 rounded-xl">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-7xl mb-5"
              >
                ✅
              </motion.div>
              <p className="text-white font-bold text-xl font-display uppercase tracking-wide">¡Solicitud enviada!</p>
              <p className="text-gray-400 text-sm mt-2">{ownerName} recibirá tu propuesta</p>
              <p className="text-gray-600 text-xs mt-6 animate-pulse">Cerrando...</p>
            </div>
          )}

          {/* ERROR banner */}
          {phase === 'error' && (
            <div className="shrink-0 bg-red-900/70 border-b border-red-700/50 px-5 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-red-300 text-sm font-semibold">✗ Error al enviar la oferta</p>
                <button
                  onClick={onRetry}
                  className="shrink-0 text-xs font-bold text-white bg-red-700 hover:bg-red-600 px-3 py-1 rounded-lg transition"
                >
                  Reintentar
                </button>
              </div>
              <p className="text-red-400 text-xs leading-snug">
                {errorMessage
                  ? errorMessage
                  : isOfflineMode || (typeof navigator !== 'undefined' && !navigator.onLine)
                  ? 'Sin conexión — revisá tu red o la configuración de Supabase'
                  : 'No se pudo conectar con el servidor.'}
              </p>
            </div>
          )}

          {/* Header */}
          <div className="p-5 border-b border-surface3 shrink-0">
            <h2 className="text-xl font-display text-gold2 uppercase">Proponer intercambio</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Solicitas a <span className="font-bold text-white">{ownerName}</span>
            </p>
          </div>

          {/* Target stickers */}
          <div className="px-5 py-4 shrink-0">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">
              {isMultiTarget ? `Pedís ${targetStickers.length} figuritas` : 'Querés esta figurita'}
            </div>
            {isMultiTarget ? (
              <div className="flex flex-wrap gap-2">
                {targetStickers.map((s) => (
                  <div key={s.sticker_key} className="flex items-center gap-1.5 bg-surface3/40 border border-surface3 rounded-lg px-2.5 py-1.5">
                    <StickerFlag stickerKey={s.sticker_key} className="text-base leading-none shrink-0" />
                    <div>
                      <div className="text-gold2 text-[10px] font-mono font-bold">{displayKey(s.sticker_key)}</div>
                      <div className="text-white text-xs font-semibold leading-tight max-w-[8rem] truncate">{getStickerName(s.sticker_key)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-surface3/40 border border-surface3 rounded-xl p-3">
                <StickerFlag stickerKey={targetStickers[0].sticker_key} className="text-4xl leading-none shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white leading-tight">{getStickerName(targetStickers[0].sticker_key)}</div>
                  <div className="text-gold2 text-xs font-mono mt-0.5">{displayKey(targetStickers[0].sticker_key)}</div>
                  <div className="text-gray-500 text-xs mt-0.5">×{targetStickers[0].repeat_count} disponibles</div>
                </div>
              </div>
            )}
          </div>

          {/* Offer selection */}
          <div className="px-5 pb-2 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Elegí qué ofrecés a cambio
              </div>
              {selectedKeys.size > 0 && (
                <span className="text-[10px] text-gold2 font-bold bg-gold2/10 px-2 py-0.5 rounded-full">
                  {selectedKeys.size} seleccionada{selectedKeys.size !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {myRepeated.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No tenés figuritas repetidas para ofrecer.</p>
            ) : (
              <div className="space-y-4">
                {recommended.length > 0 && (
                  <div>
                    <div className="text-xs text-green-400 font-semibold mb-2 flex items-center gap-1.5">
                      <span>⭐</span> Recomendadas — ellos las necesitan
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {recommended.map((s) => (
                        <StickerOption
                          key={s.sticker_key}
                          sticker={s}
                          selected={selectedKeys.has(s.sticker_key)}
                          recommended
                          disabled={isLocked}
                          onClick={() => toggleKey(s.sticker_key)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {others.length > 0 && (
                  <div>
                    {recommended.length > 0 && (
                      <div className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-wider">
                        Otras repetidas
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {others.map((s) => (
                        <StickerOption
                          key={s.sticker_key}
                          sticker={s}
                          selected={selectedKeys.has(s.sticker_key)}
                          recommended={false}
                          disabled={isLocked}
                          onClick={() => toggleKey(s.sticker_key)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Swap preview */}
          {selectedKeys.size > 0 && (
            <div className="mx-5 mb-3 p-3 bg-surface3/30 border border-surface3 rounded-xl shrink-0">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 text-center">Vista previa</div>
              <div className="flex items-start gap-2 text-xs">
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-gray-500 mb-1">Vos dás ({selectedKeys.size})</div>
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {selectedOffered.map((key) => (
                      <div key={key} className="flex items-center gap-0.5">
                        <StickerFlag stickerKey={key} className="text-sm shrink-0" />
                        <span className="font-mono text-gold2 text-[10px]">{displayKey(key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-gray-500 font-bold shrink-0 pt-4">⇄</div>
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-gray-500 mb-1">Vos recibís ({targetStickers.length})</div>
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {targetStickers.map((s) => (
                      <div key={s.sticker_key} className="flex items-center gap-0.5">
                        <StickerFlag stickerKey={s.sticker_key} className="text-sm shrink-0" />
                        <span className="font-mono text-gold2 text-[10px]">{displayKey(s.sticker_key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-5 flex gap-3 border-t border-surface3 shrink-0">
            <button
              onClick={onClose}
              disabled={isLocked}
              className="flex-1 py-2.5 bg-surface3 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg uppercase text-sm transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => selectedKeys.size > 0 && phase === 'select' && onConfirm(selectedOffered)}
              disabled={selectedKeys.size === 0 || phase !== 'select'}
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
