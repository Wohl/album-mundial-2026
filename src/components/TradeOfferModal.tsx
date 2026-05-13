'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickerState } from '@/types'
import { getStickerName } from '@/lib/stickers'
import { isOfflineMode } from '@/lib/supabase'
import { OtherUserSticker } from '@/services/tradeService'
import { StickerFlag } from '@/components/TeamFlag'

type Phase = 'select' | 'submitting' | 'success' | 'error'

interface TradeOfferModalProps {
  targetSticker: OtherUserSticker
  myRepeated: StickerState[]
  targetMissing: string[]
  phase: Phase
  errorMessage?: string | null
  onConfirm: (offeredKey: string) => void
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
}) => {
  return (
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
      <StickerFlag stickerKey={sticker.sticker_key} className="text-lg mb-1 leading-none block" />
      <div className="font-semibold text-white line-clamp-2 leading-tight">{getStickerName(sticker.sticker_key)}</div>
      <div className="text-gold2 mt-1 font-mono">{sticker.sticker_key}</div>
      <div className="text-gray-500 mt-1">×{sticker.repeat_count} extras</div>
    </button>
  )
}

export const TradeOfferModal = ({
  targetSticker,
  myRepeated,
  targetMissing,
  phase,
  errorMessage,
  onConfirm,
  onRetry,
  onClose,
}: TradeOfferModalProps) => {
  const recommended = myRepeated.filter((s) => targetMissing.includes(s.sticker_key))
  const others = myRepeated.filter((s) => !targetMissing.includes(s.sticker_key))
  const [selected, setSelected] = useState<string | null>(null)

  const isLocked = phase === 'submitting' || phase === 'success'

  useEffect(() => {
    const defaultSelection = recommended[0]?.sticker_key ?? others[0]?.sticker_key ?? null
    if (defaultSelection && defaultSelection !== selected) {
      setSelected(defaultSelection)
    }
  }, [recommended, others, selected])

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
          {/* ── SUBMITTING overlay ──────────────────────────────────────────── */}
          {phase === 'submitting' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface2/95 rounded-xl">
              <div className="text-gold2 text-5xl mb-5 animate-pulse">⇄</div>
              <p className="text-white font-bold text-lg font-display uppercase tracking-wide">
                Enviando oferta...
              </p>
              <p className="text-gray-500 text-sm mt-2">Aguardá un momento</p>
            </div>
          )}

          {/* ── SUCCESS overlay ─────────────────────────────────────────────── */}
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
              <p className="text-white font-bold text-xl font-display uppercase tracking-wide">
                ¡Solicitud enviada!
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {targetSticker.owner_name} recibirá tu propuesta
              </p>
              <p className="text-gray-600 text-xs mt-6 animate-pulse">Cerrando...</p>
            </div>
          )}

          {/* ── ERROR banner ────────────────────────────────────────────────── */}
          {phase === 'error' && (
            <div className="shrink-0 bg-red-900/70 border-b border-red-700/50 px-5 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-red-300 text-sm font-semibold">
                  ✗ Error al enviar la oferta
                </p>
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
                  : 'No se pudo conectar con el servidor. Si el problema persiste, verificá las políticas RLS de la tabla trade_requests en Supabase.'}
              </p>
            </div>
          )}

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="p-5 border-b border-surface3 shrink-0">
            <h2 className="text-xl font-display text-gold2 uppercase">Proponer intercambio</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Solicitas a <span className="font-bold text-white">{targetSticker.owner_name}</span>
            </p>
          </div>

          {/* ── Target sticker ──────────────────────────────────────────────── */}
          <div className="px-5 py-4 shrink-0">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">
              Querés esta figurita
            </div>
            <div className="flex items-center gap-3 bg-surface3/40 border border-surface3 rounded-xl p-3">
              <StickerFlag stickerKey={targetSticker.sticker_key} className="text-4xl leading-none shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-white leading-tight">
                  {getStickerName(targetSticker.sticker_key)}
                </div>
                <div className="text-gold2 text-xs font-mono mt-0.5">{targetSticker.sticker_key}</div>
                <div className="text-gray-500 text-xs mt-0.5">×{targetSticker.repeat_count} disponibles</div>
              </div>
            </div>
          </div>

          {/* ── Offer selection ─────────────────────────────────────────────── */}
          <div className="px-5 pb-2 overflow-y-auto flex-1 min-h-0">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 font-semibold">
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
                      <span>⭐</span> Recomendadas — ellos las necesitan
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {recommended.map((s) => (
                        <StickerOption
                          key={s.sticker_key}
                          sticker={s}
                          selected={selected === s.sticker_key}
                          recommended
                          disabled={isLocked}
                          onClick={() => setSelected(s.sticker_key)}
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
                          selected={selected === s.sticker_key}
                          recommended={false}
                          disabled={isLocked}
                          onClick={() => setSelected(s.sticker_key)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Swap preview ────────────────────────────────────────────────── */}
          {selected && (
            <div className="mx-5 mb-3 p-3 bg-surface3/30 border border-surface3 rounded-xl shrink-0">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 text-center">
                Vista previa
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-gray-500 mb-1">Vos dás</div>
                  <div className="flex items-center justify-center gap-1 font-bold text-white">
                    <StickerFlag stickerKey={selected} className="text-sm shrink-0" />
                    <span className="line-clamp-1">{getStickerName(selected)}</span>
                  </div>
                </div>
                <div className="text-gray-500 font-bold shrink-0">⇄</div>
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-gray-500 mb-1">Vos recibís</div>
                  <div className="flex items-center justify-center gap-1 font-bold text-white">
                    <StickerFlag stickerKey={targetSticker.sticker_key} className="text-sm shrink-0" />
                    <span className="line-clamp-1">{getStickerName(targetSticker.sticker_key)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div className="p-5 flex gap-3 border-t border-surface3 shrink-0">
            <button
              onClick={onClose}
              disabled={isLocked}
              className="flex-1 py-2.5 bg-surface3 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg uppercase text-sm transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => selected && phase === 'select' && onConfirm(selected)}
              disabled={!selected || phase !== 'select'}
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
