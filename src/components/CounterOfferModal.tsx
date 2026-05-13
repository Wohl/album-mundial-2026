'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TradeRequest, StickerState } from '@/types'
import { getStickerName } from '@/lib/stickers'
import { StickerFlag } from '@/components/TeamFlag'

type Phase = 'select' | 'submitting' | 'error'

interface CounterOfferModalProps {
  trade: TradeRequest
  myUserId: string
  myRepeated: StickerState[]
  phase: Phase
  errorMessage?: string | null
  onConfirm: (counterRequestedKeys: string[], counterOfferedKeys: string[]) => void
  onRetry: () => void
  onClose: () => void
}

const StickerOption = ({
  stickerKey,
  repeatCount,
  selected,
  disabled,
  onClick,
}: {
  stickerKey: string
  repeatCount: number
  selected: boolean
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
        ? 'border-purple-400 bg-purple-400/10 shadow-md shadow-purple-400/20'
        : 'border-surface3 bg-surface2 hover:border-gray-500'
    }`}
  >
    {selected && (
      <div className="absolute -top-2 -left-2 bg-purple-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
        ✓
      </div>
    )}
    <StickerFlag stickerKey={stickerKey} className="text-lg mb-1 leading-none block" />
    <div className="font-semibold text-white line-clamp-2 leading-tight">{getStickerName(stickerKey)}</div>
    <div className="text-purple-300 mt-1 font-mono">{stickerKey}</div>
    <div className="text-gray-500 mt-1">×{repeatCount} extras</div>
  </button>
)

export const CounterOfferModal = ({
  trade,
  myUserId,
  myRepeated,
  phase,
  errorMessage,
  onConfirm,
  onRetry,
  onClose,
}: CounterOfferModalProps) => {
  const isIncoming = trade.owner_id === myUserId
  const otherName = isIncoming ? trade.requester_name : trade.owner_name

  // What the other party wants from me (what I need to give in counter)
  const theyWant = useMemo(() => {
    if (trade.status === 'countered' && trade.counter_requested_keys?.length) {
      return trade.counter_requested_keys
    }
    return trade.requested_sticker_keys.length > 0
      ? trade.requested_sticker_keys
      : [trade.requested_sticker_key].filter(Boolean)
  }, [trade])

  // What the other party offers me (stays the same in counter)
  const theyOffer = useMemo(() => {
    if (trade.status === 'countered' && trade.counter_offered_keys?.length) {
      return trade.counter_offered_keys
    }
    return trade.offered_sticker_keys.length > 0
      ? trade.offered_sticker_keys
      : [trade.offered_sticker_key].filter(Boolean)
  }, [trade])

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    const first = myRepeated[0]?.sticker_key
    return first ? new Set([first]) : new Set()
  })

  const isLocked = phase === 'submitting'

  const toggleKey = (key: string) => {
    if (isLocked) return
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectedOffered = Array.from(selectedKeys)

  // In counter: I change what I give (counter_requested_keys from my perspective as owner)
  // counter_offered_keys stays as original theyOffer (what they pay me)
  const handleConfirm = () => {
    if (selectedKeys.size === 0) return
    if (isIncoming) {
      // Owner countering: changes what owner gives (counter_requested_keys)
      // Keeps what owner receives (counter_offered_keys = original offered)
      onConfirm(selectedOffered, theyOffer)
    } else {
      // Requester countering: changes what requester offers (counter_offered_keys)
      // Keeps what requester wants (counter_requested_keys = original requested)
      onConfirm(theyWant, selectedOffered)
    }
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
          className="relative bg-surface2 border border-purple-500/40 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
          initial={{ scale: 0.92, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 8 }}
        >
          {/* SUBMITTING overlay */}
          {phase === 'submitting' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface2/95 rounded-xl">
              <div className="text-purple-400 text-5xl mb-5 animate-pulse">↩</div>
              <p className="text-white font-bold text-lg font-display uppercase tracking-wide">Enviando contraoferta...</p>
            </div>
          )}

          {/* ERROR banner */}
          {phase === 'error' && (
            <div className="shrink-0 bg-red-900/70 border-b border-red-700/50 px-5 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-red-300 text-sm font-semibold">✗ Error al enviar la contraoferta</p>
                <button onClick={onRetry} className="shrink-0 text-xs font-bold text-white bg-red-700 hover:bg-red-600 px-3 py-1 rounded-lg transition">
                  Reintentar
                </button>
              </div>
              {errorMessage && <p className="text-red-400 text-xs">{errorMessage}</p>}
            </div>
          )}

          {/* Header */}
          <div className="p-5 border-b border-surface3 shrink-0">
            <h2 className="text-xl font-display text-purple-400 uppercase">Contraofertar</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Proponés nuevos términos a <span className="font-bold text-white">{otherName}</span>
            </p>
          </div>

          {/* Current terms */}
          <div className="px-5 py-4 shrink-0 space-y-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Términos actuales
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-surface3/40 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
                  {isIncoming ? 'Ellos ofrecen' : 'Vos ofrecés'}
                </div>
                {theyOffer.map((key) => (
                  <div key={key} className="flex items-center gap-1.5 mb-1">
                    <StickerFlag stickerKey={key} className="text-sm shrink-0" />
                    <span className="text-[10px] font-mono text-gold2">{key}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center text-gray-600 font-bold text-base shrink-0">⇄</div>
              <div className="flex-1 bg-surface3/40 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
                  {isIncoming ? 'Ellos piden' : 'Vos pedís'}
                </div>
                {theyWant.map((key) => (
                  <div key={key} className="flex items-center gap-1.5 mb-1">
                    <StickerFlag stickerKey={key} className="text-sm shrink-0" />
                    <span className="text-[10px] font-mono text-gold2">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New offer selection */}
          <div className="px-5 pb-2 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">
                {isIncoming ? 'Cambiá lo que ofrecés en cambio' : 'Cambiá lo que ofrecés'}
              </div>
              {selectedKeys.size > 0 && (
                <span className="text-[10px] text-purple-400 font-bold bg-purple-400/10 px-2 py-0.5 rounded-full">
                  {selectedKeys.size} seleccionada{selectedKeys.size !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {myRepeated.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No tenés figuritas repetidas para contraofertar.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {myRepeated.map((s) => (
                  <StickerOption
                    key={s.sticker_key}
                    stickerKey={s.sticker_key}
                    repeatCount={s.repeat_count}
                    selected={selectedKeys.has(s.sticker_key)}
                    disabled={isLocked}
                    onClick={() => toggleKey(s.sticker_key)}
                  />
                ))}
              </div>
            )}
          </div>

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
              onClick={handleConfirm}
              disabled={selectedKeys.size === 0 || isLocked}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg uppercase text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Contraofertar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
