'use client'

import { useState, useMemo, useCallback } from 'react'
import { StickerState, TradeRequest } from '@/types'
import { OtherUserSticker, tradeService } from '@/services/tradeService'
import { getStickerName, getStickerTeamFlag } from '@/lib/stickers'
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
type ExploreFilter = 'all' | 'need'

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
  const [showHistory, setShowHistory] = useState(false)
  const [exploreFilter, setExploreFilter] = useState<ExploreFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredSelectedStickers = useMemo(() => {
    let list = selectedUserStickers
    if (exploreFilter === 'need') {
      list = list.filter((s) => myMissingKeys.has(s.sticker_key))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (s) =>
          s.sticker_key.toLowerCase().includes(q) ||
          getStickerName(s.sticker_key).toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      const aNeed = myMissingKeys.has(a.sticker_key) ? 0 : 1
      const bNeed = myMissingKeys.has(b.sticker_key) ? 0 : 1
      return aNeed - bNeed
    })
  }, [selectedUserStickers, exploreFilter, searchQuery, myMissingKeys])

  const handleSelectUser = useCallback(
    async (userId: string) => {
      const isDeselect = selectedUserId === userId
      setSelectedUserId(isDeselect ? null : userId)
      setExploreFilter('all')
      setSearchQuery('')
      if (isDeselect) { setTargetMissing([]); return }
      try {
        const missing = await tradeService.getUserMissingStickers(userId)
        setTargetMissing(missing)
      } catch {
        setTargetMissing([])
      }
    },
    [selectedUserId]
  )

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

  // Trade buckets
  const pendingIncoming = useMemo(
    () => trades.filter((t) => t.owner_id === sessionId && t.status === 'pending'),
    [trades, sessionId]
  )
  const pendingOutgoing = useMemo(
    () => trades.filter((t) => t.requester_id === sessionId && t.status === 'pending'),
    [trades, sessionId]
  )
  const historyTrades = useMemo(
    () => trades.filter((t) => t.status !== 'pending'),
    [trades]
  )
  const completedCount = useMemo(
    () => trades.filter((t) => t.status === 'accepted').length,
    [trades]
  )

  const totalNeedAvailable = useMemo(
    () => othersRepeated.filter((s) => myMissingKeys.has(s.sticker_key)).length,
    [othersRepeated, myMissingKeys]
  )

  const needInSelected = useMemo(
    () => selectedUserStickers.filter((s) => myMissingKeys.has(s.sticker_key)).length,
    [selectedUserStickers, myMissingKeys]
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
        <div className="text-xl font-display animate-pulse">Cargando mercado...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Dashboard stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl p-4 text-center border transition ${
          pendingIncoming.length > 0
            ? 'bg-amber-500/10 border-amber-500/40'
            : 'bg-surface2 border-surface3'
        }`}>
          <div className={`text-2xl font-bold ${pendingIncoming.length > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
            {pendingIncoming.length}
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Por responder</div>
        </div>
        <div className="bg-surface2 border border-surface3 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${pendingOutgoing.length > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
            {pendingOutgoing.length}
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Enviadas</div>
        </div>
        <div className="bg-surface2 border border-surface3 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${completedCount > 0 ? 'text-green-400' : 'text-gray-500'}`}>
            {completedCount}
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Completadas</div>
        </div>
      </div>

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
          Intercambios
          {pendingIncoming.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center">
              {pendingIncoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setInnerTab('explore')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-semibold text-sm uppercase transition ${
            innerTab === 'explore'
              ? 'bg-surface2 text-gold2 border border-surface3 border-b-surface2 -mb-px'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Explorar
          {totalNeedAvailable > 0 && (
            <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
              {totalNeedAvailable}
            </span>
          )}
        </button>
      </div>

      {/* ── INTERCAMBIOS ── */}
      {innerTab === 'trades' && (
        <div className="space-y-6">
          {/* Por responder */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-display text-gold2 uppercase tracking-wide">Por responder</h2>
              {pendingIncoming.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingIncoming.length}
                </span>
              )}
            </div>
            {pendingIncoming.length === 0 ? (
              <div className="text-gray-600 text-sm py-4 text-center border border-dashed border-surface3 rounded-xl">
                No hay solicitudes esperando tu respuesta
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingIncoming.map((trade) => (
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

          {/* Solicitudes enviadas */}
          <section>
            <h2 className="text-sm font-display text-gold2 uppercase tracking-wide mb-3">Solicitudes enviadas</h2>
            {pendingOutgoing.length === 0 ? (
              <div className="text-gray-600 text-sm py-4 text-center border border-dashed border-surface3 rounded-xl">
                No tenés solicitudes activas enviadas
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingOutgoing.map((trade) => (
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

          {/* Historial */}
          {historyTrades.length > 0 && (
            <section>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm font-semibold uppercase tracking-wide transition"
              >
                <span className={`transition-transform duration-200 inline-block ${showHistory ? 'rotate-90' : ''}`}>
                  ›
                </span>
                Historial
                <span className="text-xs bg-surface3 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {historyTrades.length}
                </span>
              </button>
              {showHistory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {historyTrades.map((trade) => (
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
          )}

          {trades.length === 0 && (
            <div className="text-center py-12 text-gray-600 text-sm">
              <div className="text-4xl mb-3">🤝</div>
              <p className="font-semibold text-gray-500">Aún no tenés intercambios</p>
              <p className="mt-1">Explorá las figuritas disponibles para proponer uno.</p>
            </div>
          )}
        </div>
      )}

      {/* ── EXPLORAR ── */}
      {innerTab === 'explore' && (
        <div className="space-y-5">
          {users.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-lg font-semibold">Sin figuritas disponibles</p>
              <p className="text-sm mt-2">Cuando otros usuarios marquen repetidas, aparecerán aquí.</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-gray-500">
                  <span className="font-bold text-white">{users.length}</span> coleccionista{users.length !== 1 ? 's' : ''} activo{users.length !== 1 ? 's' : ''}
                </span>
                {totalNeedAvailable > 0 && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-green-400 font-semibold">
                      {totalNeedAvailable} figuritas que te faltan disponibles
                    </span>
                  </>
                )}
              </div>

              {/* User pills */}
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <button
                    key={u.ownerId}
                    onClick={() => handleSelectUser(u.ownerId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition border ${
                      selectedUserId === u.ownerId
                        ? 'bg-gold2 text-dark border-gold2 shadow-lg shadow-gold2/20'
                        : u.iNeedCount > 0
                        ? 'bg-green-500/10 text-gray-200 border-green-500/40 hover:border-green-400 hover:bg-green-500/15'
                        : 'bg-surface2 text-gray-300 border-surface3 hover:border-gold2/50 hover:text-white'
                    }`}
                  >
                    <span>{u.ownerName}</span>
                    {u.iNeedCount > 0 && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        selectedUserId === u.ownerId
                          ? 'bg-green-800 text-green-200'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {u.iNeedCount} ★
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedUserId === u.ownerId
                        ? 'bg-dark/20 text-dark/70'
                        : 'bg-surface3 text-gray-500'
                    }`}>
                      {u.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Selected user view */}
              {!selectedUserId ? (
                <div className="text-center py-12 text-gray-600 text-sm border border-dashed border-surface3 rounded-xl">
                  ↑ Seleccioná un coleccionista para ver sus figuritas disponibles
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Filter + search bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 bg-surface3/40 p-1 rounded-lg">
                      <button
                        onClick={() => setExploreFilter('all')}
                        className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${
                          exploreFilter === 'all'
                            ? 'bg-surface2 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Todas ({selectedUserStickers.length})
                      </button>
                      <button
                        onClick={() => setExploreFilter('need')}
                        className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${
                          exploreFilter === 'need'
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Te faltan ({needInSelected})
                      </button>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar figurita..."
                      className="flex-1 min-w-[8rem] bg-surface3/40 border border-surface3 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-gold2/50 transition"
                    />
                    {myRepeated.length === 0 && (
                      <span className="text-amber-400 text-xs font-semibold">
                        ⚠ Necesitás repetidas propias para ofertar
                      </span>
                    )}
                  </div>

                  {/* Sticker grid */}
                  {filteredSelectedStickers.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 text-sm border border-dashed border-surface3 rounded-xl">
                      {exploreFilter === 'need'
                        ? 'Este coleccionista no tiene figuritas que te falten'
                        : 'No hay resultados para tu búsqueda'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {filteredSelectedStickers.map((sticker) => {
                        const iNeedIt = myMissingKeys.has(sticker.sticker_key)
                        const alreadyRequested = trades.some(
                          (t) =>
                            t.requester_id === sessionId &&
                            t.requested_sticker_key === sticker.sticker_key &&
                            t.owner_id === sticker.session_id &&
                            t.status === 'pending'
                        )
                        const canRequest = !alreadyRequested && myRepeated.length > 0
                        const flag = getStickerTeamFlag(sticker.sticker_key)

                        return (
                          <button
                            key={sticker.sticker_key}
                            disabled={!canRequest}
                            onClick={() => setOfferTarget(sticker)}
                            className={`relative text-left p-3 rounded-xl border-2 transition group ${
                              alreadyRequested
                                ? 'border-amber-500/40 bg-amber-500/10 cursor-default'
                                : iNeedIt && canRequest
                                ? 'border-green-500/60 bg-green-500/10 hover:border-green-400 hover:scale-[1.02] cursor-pointer'
                                : canRequest
                                ? 'border-surface3 bg-surface2 hover:border-gold2/50 hover:scale-[1.02] cursor-pointer'
                                : 'border-surface3 bg-surface2 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            {iNeedIt && !alreadyRequested && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap z-10">
                                La necesitás
                              </div>
                            )}
                            {alreadyRequested && (
                              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
                                Solicitada
                              </div>
                            )}
                            {flag && <div className="text-xl mb-1 leading-none">{flag}</div>}
                            <div className="text-[11px] text-gold2 font-mono font-bold">{sticker.sticker_key}</div>
                            <div className="text-xs font-semibold text-white mt-0.5 line-clamp-2 leading-tight">
                              {getStickerName(sticker.sticker_key)}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">×{sticker.repeat_count} extras</div>
                            {canRequest && (
                              <div className={`mt-2 text-center text-[10px] font-bold py-1 rounded transition ${
                                iNeedIt
                                  ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30'
                                  : 'bg-surface3 text-gray-400 group-hover:text-gray-300'
                              }`}>
                                Pedir
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {myRepeated.length === 0 && users.length > 0 && (
            <p className="text-center text-amber-400/70 text-sm bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              Marcá figuritas como repetidas en tu álbum para poder hacer ofertas de intercambio.
            </p>
          )}
        </div>
      )}

      {/* Offer modal */}
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
