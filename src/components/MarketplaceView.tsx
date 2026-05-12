'use client'

import { useState, useMemo, useCallback } from 'react'
import { StickerState, TradeRequest } from '@/types'
import { OtherUserSticker, tradeService } from '@/services/tradeService'
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

type InnerTab = 'trades' | 'explore'

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
  const [innerTab, setInnerTab] = useState<InnerTab>('trades')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [targetMissing, setTargetMissing] = useState<string[]>([])
  const [offerTarget, setOfferTarget] = useState<OtherUserSticker | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const myRepeated = useMemo(
    () => myStickers.filter((s) => s.status === 'repeated'),
    [myStickers]
  )

  const myMissingKeys = useMemo(
    () => new Set(myStickers.filter((s) => s.status === 'missing').map((s) => s.sticker_key)),
    [myStickers]
  )

  const users = useMemo(() => {
    const map = new Map<string, { ownerName: string; ownerId: string; count: number; iNeedCount: number }>()
    othersRepeated.forEach((s) => {
      if (!map.has(s.session_id)) {
        map.set(s.session_id, { ownerName: s.owner_name, ownerId: s.session_id, count: 0, iNeedCount: 0 })
      }
      const entry = map.get(s.session_id)!
      entry.count++
      if (myMissingKeys.has(s.sticker_key)) entry.iNeedCount++
    })
    return Array.from(map.values()).sort((a, b) => b.iNeedCount - a.iNeedCount)
  }, [othersRepeated, myMissingKeys])

  const selectedUserStickers = useMemo(
    () => othersRepeated.filter((s) => s.session_id === selectedUserId),
    [othersRepeated, selectedUserId]
  )

  const handleSelectUser = useCallback(async (userId: string) => {
    setSelectedUserId((prev) => {
      if (prev === userId) return null
      return userId
    })
    if (selectedUserId === userId) return
    try {
      const missing = await tradeService.getUserMissingStickers(userId)
      setTargetMissing(missing)
    } catch {
      setTargetMissing([])
    }
  }, [selectedUserId])

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

  const pendingIncoming = trades.filter(
    (t) => t.owner_id === sessionId && t.status === 'pending'
  ).length

  const incomingTrades = useMemo(
    () => trades.filter((t) => t.owner_id === sessionId),
    [trades, sessionId]
  )
  const outgoingTrades = useMemo(
    () => trades.filter((t) => t.requester_id === sessionId),
    [trades, sessionId]
  )

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
    <div className="space-y-6">
      {/* Inner tabs */}
      <div className="flex gap-2 border-b border-surface3 pb-1">
        <button
          onClick={() => setInnerTab('trades')}
          className={`relative px-5 py-2.5 rounded-t-lg font-semibold text-sm uppercase transition ${
            innerTab === 'trades'
              ? 'bg-surface2 text-gold2 border border-surface3 border-b-surface2 -mb-px'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Mis intercambios
          {pendingIncoming > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingIncoming}
            </span>
          )}
        </button>
        <button
          onClick={() => setInnerTab('explore')}
          className={`px-5 py-2.5 rounded-t-lg font-semibold text-sm uppercase transition ${
            innerTab === 'explore'
              ? 'bg-surface2 text-gold2 border border-surface3 border-b-surface2 -mb-px'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Explorar
          {users.length > 0 && (
            <span className="ml-2 text-xs bg-surface3 text-gray-400 px-1.5 py-0.5 rounded-full">
              {users.length}
            </span>
          )}
        </button>
      </div>

      {/* ── MIS INTERCAMBIOS ── */}
      {innerTab === 'trades' && (
        <div className="space-y-8">
          <section>
            <h2 className="text-base font-display text-gold2 uppercase mb-3 flex items-center gap-2">
              Por aprobar
              {pendingIncoming > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingIncoming} nueva{pendingIncoming !== 1 ? 's' : ''}
                </span>
              )}
            </h2>
            {incomingTrades.length === 0 ? (
              <p className="text-gray-500 text-sm">Nadie te ha solicitado un intercambio todavía.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {incomingTrades.map((trade) => (
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

          <section>
            <h2 className="text-base font-display text-gold2 uppercase mb-3">Enviadas</h2>
            {outgoingTrades.length === 0 ? (
              <p className="text-gray-500 text-sm">No tenés solicitudes enviadas activas.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {outgoingTrades.map((trade) => (
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
        </div>
      )}

      {/* ── EXPLORAR ── */}
      {innerTab === 'explore' && (
        <div className="space-y-6">
          {users.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-lg">Nadie más tiene figuritas repetidas por ahora.</p>
            </div>
          ) : (
            <>
              {/* User pills */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Seleccioná un coleccionista</p>
                <div className="flex flex-wrap gap-2">
                  {users.map((u) => (
                    <button
                      key={u.ownerId}
                      onClick={() => handleSelectUser(u.ownerId)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition border ${
                        selectedUserId === u.ownerId
                          ? 'bg-gold2 text-dark border-gold2 shadow-lg shadow-gold2/20'
                          : 'bg-surface2 text-gray-300 border-surface3 hover:border-gold2/50 hover:text-white'
                      }`}
                    >
                      <span>{u.ownerName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        selectedUserId === u.ownerId
                          ? 'bg-dark/20 text-dark'
                          : 'bg-surface3 text-gray-400'
                      }`}>
                        {u.count}
                      </span>
                      {u.iNeedCount > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                          selectedUserId === u.ownerId
                            ? 'bg-green-700 text-white'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {u.iNeedCount} que necesitás
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected user view */}
              {!selectedUserId ? (
                <div className="text-center py-12 text-gray-600 text-sm border border-dashed border-surface3 rounded-xl">
                  ↑ Seleccioná un coleccionista para ver sus figuritas
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Info bar */}
                  <div className="flex flex-wrap items-center gap-4 text-sm bg-surface2 rounded-lg px-4 py-3 border border-surface3">
                    <span className="text-gray-400">
                      <span className="font-bold text-white">{selectedUserStickers.length}</span> repetidas disponibles
                    </span>
                    {selectedUserStickers.filter((s) => myMissingKeys.has(s.sticker_key)).length > 0 && (
                      <span className="text-green-400 font-semibold">
                        ✓ {selectedUserStickers.filter((s) => myMissingKeys.has(s.sticker_key)).length} que te faltan
                      </span>
                    )}
                    {myRepeated.length === 0 && (
                      <span className="text-amber-400 text-xs">
                        ⚠ Necesitás figuritas repetidas propias para ofertar
                      </span>
                    )}
                  </div>

                  {/* Sticker grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {[...selectedUserStickers]
                      .sort((a, b) => {
                        const aNeed = myMissingKeys.has(a.sticker_key) ? 0 : 1
                        const bNeed = myMissingKeys.has(b.sticker_key) ? 0 : 1
                        return aNeed - bNeed
                      })
                      .map((sticker) => {
                        const iNeedIt = myMissingKeys.has(sticker.sticker_key)
                        const alreadyRequested = trades.some(
                          (t) =>
                            t.requester_id === sessionId &&
                            t.requested_sticker_key === sticker.sticker_key &&
                            t.owner_id === sticker.session_id &&
                            t.status === 'pending'
                        )
                        const canRequest = !alreadyRequested && myRepeated.length > 0

                        return (
                          <button
                            key={sticker.sticker_key}
                            disabled={!canRequest}
                            onClick={() => setOfferTarget(sticker)}
                            className={`relative text-left p-3 rounded-xl border-2 transition group ${
                              alreadyRequested
                                ? 'border-amber-500/40 bg-amber-500/10 cursor-default'
                                : iNeedIt && canRequest
                                ? 'border-green-500/60 bg-green-500/10 hover:border-green-400 hover:scale-[1.03] cursor-pointer'
                                : canRequest
                                ? 'border-surface3 bg-surface2 hover:border-gold2/50 hover:scale-[1.03] cursor-pointer'
                                : 'border-surface3 bg-surface2 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            {iNeedIt && !alreadyRequested && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                La necesitás
                              </div>
                            )}
                            {alreadyRequested && (
                              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                Solicitada
                              </div>
                            )}
                            <div className="text-[11px] text-gold2 font-mono font-bold">{sticker.sticker_key}</div>
                            <div className="text-xs font-semibold text-white mt-1 line-clamp-2 leading-tight">
                              {getStickerName(sticker.sticker_key)}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">×{sticker.repeat_count} extras</div>
                            {canRequest && (
                              <div className={`mt-2 text-center text-[11px] font-bold py-1 rounded transition ${
                                iNeedIt
                                  ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30'
                                  : 'bg-surface3 text-gray-400 group-hover:bg-surface3/80'
                              }`}>
                                Pedir
                              </div>
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}
            </>
          )}

          {myRepeated.length === 0 && users.length > 0 && (
            <p className="text-center text-gray-500 text-sm bg-surface2 rounded-lg p-4 border border-surface3">
              Marcá figuritas como repetidas en tu álbum para poder hacer ofertas de intercambio.
            </p>
          )}
        </div>
      )}

      {/* Modal de oferta */}
      {offerTarget && !submitting && (
        <TradeOfferModal
          targetSticker={offerTarget}
          myRepeated={myRepeated}
          targetMissing={targetMissing}
          onConfirm={handleConfirm}
          onClose={() => setOfferTarget(null)}
        />
      )}
    </div>
  )
}
