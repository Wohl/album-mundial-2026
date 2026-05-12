'use client'

import { useState, useMemo } from 'react'
import { StickerState, TradeRequest } from '@/types'
import { OtherUserSticker } from '@/services/tradeService'
import { getStickerName } from '@/lib/stickers'
import { TradeCard } from './TradeCard'
import { TradeOfferModal } from './TradeOfferModal'
import { isOfflineMode } from '@/lib/supabase'

interface MarketplaceViewProps {
  sessionId: string
  myStickers: StickerState[]
  trades: TradeRequest[]
  othersRepeated: OtherUserSticker[]
  loading: boolean
  onCreateTrade: (ownerId: string, requestedKey: string, offeredKey: string) => Promise<void>
  onRespondToTrade: (trade: TradeRequest, response: 'accepted' | 'rejected') => Promise<void>
  onCancelTrade: (tradeId: string) => Promise<void>
}

export const MarketplaceView = ({
  sessionId,
  myStickers,
  trades,
  othersRepeated,
  loading,
  onCreateTrade,
  onRespondToTrade,
  onCancelTrade,
}: MarketplaceViewProps) => {
  const [offerTarget, setOfferTarget] = useState<OtherUserSticker | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const myRepeated = useMemo(
    () => myStickers.filter((s) => s.status === 'repeated'),
    [myStickers]
  )

  const activeTrades = useMemo(
    () => trades.filter((t) => t.status !== 'cancelled'),
    [trades]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, { ownerName: string; ownerId: string; stickers: OtherUserSticker[] }>()
    othersRepeated.forEach((s) => {
      if (!map.has(s.session_id)) {
        map.set(s.session_id, { ownerName: s.owner_name, ownerId: s.session_id, stickers: [] })
      }
      map.get(s.session_id)!.stickers.push(s)
    })
    return Array.from(map.values())
  }, [othersRepeated])

  const handleConfirm = async (offeredKey: string) => {
    if (!offerTarget) return
    setSubmitting(true)
    try {
      await onCreateTrade(offerTarget.session_id, offerTarget.sticker_key, offeredKey)
      setOfferTarget(null)
    } catch (err) {
      console.error('Error creating trade:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (isOfflineMode) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-4">🔌</div>
        <div className="text-xl font-display uppercase text-gold2">Sin conexión</div>
        <p className="mt-2 text-sm">El mercado requiere conexión a Supabase.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-xl font-display">Cargando mercado...</div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Mis intercambios */}
      <section>
        <h2 className="text-2xl font-display text-gold2 uppercase mb-4">Mis intercambios</h2>
        {activeTrades.length === 0 ? (
          <p className="text-gray-500 text-sm">No tenés intercambios activos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                mySessionId={sessionId}
                onAccept={() => onRespondToTrade(trade, 'accepted')}
                onReject={() => onRespondToTrade(trade, 'rejected')}
                onCancel={() => onCancelTrade(trade.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Figuritas disponibles */}
      <section>
        <h2 className="text-2xl font-display text-gold2 uppercase mb-4">Figuritas disponibles</h2>
        {grouped.length === 0 ? (
          <p className="text-gray-500 text-sm">Nadie más tiene figuritas repetidas por ahora.</p>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.ownerId}>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
                  {group.ownerName}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {group.stickers.map((sticker) => {
                    const alreadyRequested = trades.some(
                      (t) =>
                        t.requester_id === sessionId &&
                        t.requested_sticker_key === sticker.sticker_key &&
                        t.owner_id === sticker.session_id &&
                        t.status === 'pending'
                    )
                    return (
                      <button
                        key={sticker.sticker_key}
                        disabled={alreadyRequested || myRepeated.length === 0}
                        onClick={() => setOfferTarget(sticker)}
                        className={`text-left p-3 rounded-lg border-2 transition ${
                          alreadyRequested
                            ? 'border-amber-500/50 bg-amber-500/10 cursor-default'
                            : myRepeated.length === 0
                            ? 'border-surface3 bg-surface2 opacity-50 cursor-not-allowed'
                            : 'border-surface3 bg-surface2 hover:border-gold2 hover:scale-105'
                        }`}
                      >
                        <div className="text-xs text-gold2 font-display">{sticker.sticker_key}</div>
                        <div className="text-xs font-semibold text-white mt-1 line-clamp-2">
                          {getStickerName(sticker.sticker_key)}
                        </div>
                        <div className="text-xs text-amber-400 mt-1">× {sticker.repeat_count}</div>
                        {alreadyRequested && (
                          <div className="text-xs text-amber-400 mt-1 font-semibold">Solicitada</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {myRepeated.length === 0 && grouped.length > 0 && (
          <p className="text-gray-500 text-sm mt-4">
            Necesitás tener figuritas repetidas propias para poder ofertar.
          </p>
        )}
      </section>

      {/* Modal de oferta */}
      {offerTarget && !submitting && (
        <TradeOfferModal
          targetSticker={offerTarget}
          myRepeated={myRepeated}
          onConfirm={handleConfirm}
          onClose={() => setOfferTarget(null)}
        />
      )}
    </div>
  )
}
