'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickerState, TradeRequest, TradeMatch } from '@/types'
import { OtherUserSticker, tradeService } from '@/services/tradeService'
import { getStickerName } from '@/lib/stickers'
import { StickerFlag } from '@/components/TeamFlag'
import { TradeCard } from './TradeCard'
import { TradeOfferModal } from './TradeOfferModal'
import { CounterOfferModal } from './CounterOfferModal'
import { isOfflineMode } from '@/lib/supabase'

interface MarketplaceViewProps {
  userId: string
  myStickers: StickerState[]
  trades: TradeRequest[]
  othersRepeated: OtherUserSticker[]
  othersOwned: Map<string, Set<string>>
  matches: TradeMatch[]
  loading: boolean
  onCreateTrade: (ownerId: string, requestedKeys: string[], offeredKeys: string[]) => Promise<unknown>
  onRespondToTrade: (trade: TradeRequest, response: 'accepted' | 'rejected') => Promise<void>
  onCounterTrade: (tradeId: string, counterRequestedKeys: string[], counterOfferedKeys: string[]) => Promise<void>
  onCancelTrade: (tradeId: string) => Promise<void>
}

type InnerTab = 'trades' | 'explore' | 'matches' | 'solicitar'
type ExploreFilter = 'all' | 'need'
type ToastMsg = { id: number; msg: string; type: 'success' | 'error' }
type OfferPhase = 'select' | 'submitting' | 'success' | 'error'
type CounterPhase = 'select' | 'submitting' | 'error'

function getTradeKeys(trade: TradeRequest) {
  const req = trade.requested_sticker_keys?.length
    ? trade.requested_sticker_keys
    : [trade.requested_sticker_key].filter(Boolean)
  const off = trade.offered_sticker_keys?.length
    ? trade.offered_sticker_keys
    : [trade.offered_sticker_key].filter(Boolean)
  return { req, off }
}

export const MarketplaceView = ({
  userId,
  myStickers,
  trades,
  othersRepeated,
  othersOwned,
  matches,
  loading,
  onCreateTrade,
  onRespondToTrade,
  onCounterTrade,
  onCancelTrade,
}: MarketplaceViewProps) => {
  const [innerTab, setInnerTab] = useState<InnerTab>('trades')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [targetMissing, setTargetMissing] = useState<string[]>([])
  // Offer modal state
  const [offerTargets, setOfferTargets] = useState<OtherUserSticker[] | null>(null)
  const [offerPreSelect, setOfferPreSelect] = useState<string[]>([])
  const [offerPhase, setOfferPhase] = useState<OfferPhase>('select')
  const [offerError, setOfferError] = useState<string | null>(null)
  // Counter-offer modal state
  const [counterTarget, setCounterTarget] = useState<TradeRequest | null>(null)
  const [counterPhase, setCounterPhase] = useState<CounterPhase>('select')
  const [counterError, setCounterError] = useState<string | null>(null)
  // Other UI state
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [exploreFilter, setExploreFilter] = useState<ExploreFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const toastId = useRef(0)
  // Solicitar tab state
  const [wantSearch, setWantSearch] = useState('')
  const [wantKey, setWantKey] = useState<string | null>(null)
  const [requestOfferKey, setRequestOfferKey] = useState<string | null>(null)

  const pushToast = useCallback((msg: string, type: ToastMsg['type'] = 'success') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const myRepeated = useMemo(
    () => myStickers.filter((s) => s.status === 'repeated'),
    [myStickers]
  )
  // A sticker is "one I need" if I don't already own or repeat it (no explicit 'missing' row required)
  const myOwnedOrRepeatedKeys = useMemo(
    () => new Set(myStickers.filter((s) => s.status === 'owned' || s.status === 'repeated').map((s) => s.sticker_key)),
    [myStickers]
  )

  const users = useMemo(() => {
    const map = new Map<string, { ownerName: string; ownerId: string; count: number; iNeedCount: number }>()
    othersRepeated.forEach((s) => {
      if (!map.has(s.user_id))
        map.set(s.user_id, { ownerName: s.owner_name, ownerId: s.user_id, count: 0, iNeedCount: 0 })
      const e = map.get(s.user_id)!
      e.count++
      if (!myOwnedOrRepeatedKeys.has(s.sticker_key)) e.iNeedCount++
    })
    return Array.from(map.values()).sort((a, b) => b.iNeedCount - a.iNeedCount)
  }, [othersRepeated, myOwnedOrRepeatedKeys])

  const selectedUserStickers = useMemo(
    () => othersRepeated.filter((s) => s.user_id === selectedUserId),
    [othersRepeated, selectedUserId]
  )

  const filteredSelectedStickers = useMemo(() => {
    let list = selectedUserStickers
    if (exploreFilter === 'need') list = list.filter((s) => !myOwnedOrRepeatedKeys.has(s.sticker_key))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (s) =>
          s.sticker_key.toLowerCase().includes(q) ||
          getStickerName(s.sticker_key).toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      const aNeed = !myOwnedOrRepeatedKeys.has(a.sticker_key) ? 0 : 1
      const bNeed = !myOwnedOrRepeatedKeys.has(b.sticker_key) ? 0 : 1
      return aNeed - bNeed
    })
  }, [selectedUserStickers, exploreFilter, searchQuery, myOwnedOrRepeatedKeys])

  const handleSelectUser = useCallback(
    async (uid: string) => {
      const deselect = selectedUserId === uid
      setSelectedUserId(deselect ? null : uid)
      setExploreFilter('all')
      setSearchQuery('')
      if (deselect) { setTargetMissing([]); return }
      try {
        // Returns which of my repeated stickers the target user doesn't already own
        const myRepeatedKeys = myRepeated.map((s) => s.sticker_key)
        const missing = await tradeService.getUserMissingFromList(uid, myRepeatedKeys)
        setTargetMissing(missing)
      } catch {
        setTargetMissing([])
      }
    },
    [selectedUserId, myRepeated]
  )

  // Trade buckets
  const toRespond = useMemo(
    () => trades.filter(
      (t) =>
        (t.owner_id === userId && t.status === 'pending') ||
        (t.status === 'countered' && t.counter_by !== userId &&
          (t.owner_id === userId || t.requester_id === userId))
    ),
    [trades, userId]
  )
  const pendingOutgoing = useMemo(
    () => trades.filter((t) => t.requester_id === userId && t.status === 'pending'),
    [trades, userId]
  )
  const iCountered = useMemo(
    () => trades.filter((t) => t.status === 'countered' && t.counter_by === userId),
    [trades, userId]
  )
  const historyTrades = useMemo(
    () => trades.filter((t) => ['accepted', 'rejected', 'cancelled'].includes(t.status)),
    [trades]
  )
  const completedCount = useMemo(() => trades.filter((t) => t.status === 'accepted').length, [trades])

  const totalNeedAvailable = useMemo(
    () => othersRepeated.filter((s) => !myOwnedOrRepeatedKeys.has(s.sticker_key)).length,
    [othersRepeated, myOwnedOrRepeatedKeys]
  )
  const needInSelected = useMemo(
    () => selectedUserStickers.filter((s) => !myOwnedOrRepeatedKeys.has(s.sticker_key)).length,
    [selectedUserStickers, myOwnedOrRepeatedKeys]
  )

  // Solicitar tab: unique available stickers from others that I don't own, sorted by availability count
  const availableWantStickers = useMemo(() => {
    const counts = new Map<string, number>()
    othersRepeated.forEach((s) => {
      if (!myOwnedOrRepeatedKeys.has(s.sticker_key)) {
        counts.set(s.sticker_key, (counts.get(s.sticker_key) ?? 0) + 1)
      }
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, count }))
  }, [othersRepeated, myOwnedOrRepeatedKeys])

  const filteredWantStickers = useMemo(() => {
    if (!wantSearch.trim()) return availableWantStickers.slice(0, 12)
    const q = wantSearch.toLowerCase()
    return availableWantStickers
      .filter(({ key }) => key.toLowerCase().includes(q) || getStickerName(key).toLowerCase().includes(q))
      .slice(0, 20)
  }, [availableWantStickers, wantSearch])

  const usersWithWant = useMemo(() => {
    if (!wantKey) return []
    const seen = new Set<string>()
    return othersRepeated.filter((s) => {
      if (s.sticker_key !== wantKey || seen.has(s.user_id)) return false
      seen.add(s.user_id)
      return true
    })
  }, [wantKey, othersRepeated])

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleOpenOffer = useCallback(
    (stickers: OtherUserSticker[], preSelect: string[] = []) => {
      setOfferTargets(stickers)
      setOfferPreSelect(preSelect)
      setOfferPhase('select')
      setOfferError(null)
    },
    []
  )

  const handleSuggestTrade = useCallback(
    (match: TradeMatch) => {
      const firstKey = match.theyHave[0]
      const targetSticker = firstKey
        ? othersRepeated.find((s) => s.user_id === match.userId && s.sticker_key === firstKey)
        : undefined
      if (!targetSticker) {
        setInnerTab('explore')
        handleSelectUser(match.userId)
        return
      }
      setTargetMissing(match.iHaveForThem)
      handleOpenOffer([targetSticker], match.iHaveForThem.slice(0, 1))
    },
    [othersRepeated, handleOpenOffer, handleSelectUser]
  )


  const handleConfirmOffer = useCallback(
    async (offeredKeys: string[]) => {
      if (!offerTargets || offerTargets.length === 0) return
      setOfferPhase('submitting')
      setOfferError(null)
      try {
        await onCreateTrade(
          offerTargets[0].user_id,
          offerTargets.map((s) => s.sticker_key),
          offeredKeys
        )
        setOfferPhase('success')
        pushToast('Solicitud enviada correctamente')
        setTimeout(() => {
          setOfferTargets(null)
          setOfferPhase('select')
          setOfferError(null)
        }, 2000)
      } catch (err) {
        const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? null
        setOfferError(msg)
        setOfferPhase('error')
      }
    },
    [offerTargets, onCreateTrade, pushToast]
  )

  const handleAccept = useCallback(
    async (trade: TradeRequest) => {
      if (actionLoading) return
      setActionLoading(trade.id)
      try {
        await onRespondToTrade(trade, 'accepted')
        pushToast('Intercambio aceptado — tu colección se actualiza en breve')
      } catch (err) {
        console.error('respondToTrade accepted error:', err)
        pushToast('Error al aceptar el intercambio', 'error')
      } finally {
        setActionLoading(null)
      }
    },
    [actionLoading, onRespondToTrade, pushToast]
  )

  const handleReject = useCallback(
    async (trade: TradeRequest) => {
      if (actionLoading) return
      setActionLoading(trade.id)
      try {
        await onRespondToTrade(trade, 'rejected')
        pushToast('Solicitud rechazada')
      } catch (err) {
        console.error('respondToTrade rejected error:', err)
        pushToast('Error al rechazar', 'error')
      } finally {
        setActionLoading(null)
      }
    },
    [actionLoading, onRespondToTrade, pushToast]
  )

  const handleCancel = useCallback(
    async (tradeId: string) => {
      if (actionLoading) return
      setActionLoading(tradeId)
      try {
        await onCancelTrade(tradeId)
        pushToast('Solicitud cancelada')
      } catch (err) {
        console.error('cancelTrade error:', err)
        pushToast('Error al cancelar', 'error')
      } finally {
        setActionLoading(null)
      }
    },
    [actionLoading, onCancelTrade, pushToast]
  )

  const handleCounter = useCallback(
    (trade: TradeRequest) => {
      setCounterTarget(trade)
      setCounterPhase('select')
      setCounterError(null)
    },
    []
  )

  const handleConfirmCounter = useCallback(
    async (counterRequestedKeys: string[], counterOfferedKeys: string[]) => {
      if (!counterTarget) return
      setCounterPhase('submitting')
      setCounterError(null)
      try {
        await onCounterTrade(counterTarget.id, counterRequestedKeys, counterOfferedKeys)
        pushToast('Contraoferta enviada')
        setCounterTarget(null)
        setCounterPhase('select')
      } catch (err) {
        const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? null
        setCounterError(msg)
        setCounterPhase('error')
      }
    },
    [counterTarget, onCounterTrade, pushToast]
  )

  const navigateToExplore = useCallback(
    (uid: string) => {
      setInnerTab('explore')
      handleSelectUser(uid)
    },
    [handleSelectUser]
  )

  // ──────────────────────────────────────────────────────────────────────────

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

  const toRespondCount = toRespond.length

  return (
    <div className="space-y-5">
      {/* ── Toasts ──────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`px-6 py-3 rounded-xl font-bold text-sm shadow-2xl whitespace-nowrap pointer-events-auto ${
                t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {t.type === 'success' ? '✓ ' : '✗ '}{t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={`rounded-xl p-4 text-center border transition ${
            toRespondCount > 0 ? 'bg-amber-500/10 border-amber-500/40' : 'bg-surface2 border-surface3'
          }`}
        >
          <div className={`text-2xl font-bold ${toRespondCount > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
            {toRespondCount}
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

      {/* ── Inner tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-surface3 pb-1 overflow-x-auto scrollbar-none">
        {(
          [
            { id: 'trades' as const, label: 'Intercambios', badge: toRespondCount },
            { id: 'explore' as const, label: 'Explorar', badge: totalNeedAvailable > 0 ? totalNeedAvailable : 0 },
            { id: 'matches' as const, label: 'Matches', badge: matches.length },
            { id: 'solicitar' as const, label: 'Solicitar', badge: 0 },
          ] as { id: InnerTab; label: string; badge: number }[]
        ).map(({ id, label, badge }) => (
          <button
            key={id}
            onClick={() => setInnerTab(id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-semibold text-sm uppercase transition ${
              innerTab === id
                ? 'bg-surface2 text-gold2 border border-surface3 border-b-surface2 -mb-px'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
            {badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                id === 'trades'
                  ? 'bg-red-500 text-white'
                  : id === 'matches'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── INTERCAMBIOS ──────────────────────────────────────────────────────── */}
      {innerTab === 'trades' && (
        <div className="space-y-6">
          {/* Por responder */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-display text-gold2 uppercase tracking-wide">Por responder</h2>
              {toRespondCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {toRespondCount}
                </span>
              )}
            </div>
            {toRespondCount === 0 ? (
              <div className="text-gray-600 text-sm py-4 text-center border border-dashed border-surface3 rounded-xl">
                No hay solicitudes esperando tu respuesta
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {toRespond.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    myUserId={userId}
                    loading={actionLoading === trade.id}
                    onAccept={() => handleAccept(trade)}
                    onReject={() => handleReject(trade)}
                    onCancel={() => handleCancel(trade.id)}
                    onCounter={() => handleCounter(trade)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Mis contraofertas en espera */}
          {iCountered.length > 0 && (
            <section>
              <h2 className="text-sm font-display text-purple-400 uppercase tracking-wide mb-3">
                Contraofertas enviadas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {iCountered.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    myUserId={userId}
                    loading={actionLoading === trade.id}
                    onAccept={() => handleAccept(trade)}
                    onReject={() => handleReject(trade)}
                    onCancel={() => handleCancel(trade.id)}
                  />
                ))}
              </div>
            </section>
          )}

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
                    myUserId={userId}
                    loading={actionLoading === trade.id}
                    onAccept={() => handleAccept(trade)}
                    onReject={() => handleReject(trade)}
                    onCancel={() => handleCancel(trade.id)}
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
                <span className={`transition-transform duration-200 inline-block ${showHistory ? 'rotate-90' : ''}`}>›</span>
                Historial
                <span className="text-xs bg-surface3 text-gray-500 px-1.5 py-0.5 rounded-full">{historyTrades.length}</span>
              </button>
              {showHistory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {historyTrades.map((trade) => (
                    <TradeCard
                      key={trade.id}
                      trade={trade}
                      myUserId={userId}
                      loading={actionLoading === trade.id}
                      onAccept={() => handleAccept(trade)}
                      onReject={() => handleReject(trade)}
                      onCancel={() => handleCancel(trade.id)}
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
              <p className="mt-1">Explorá las figuritas disponibles o revisá los Matches automáticos.</p>
            </div>
          )}
        </div>
      )}

      {/* ── EXPLORAR ──────────────────────────────────────────────────────────── */}
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-gray-500">
                  <span className="font-bold text-white">{users.length}</span>{' '}
                  coleccionista{users.length !== 1 ? 's' : ''} activo{users.length !== 1 ? 's' : ''}
                </span>
                {totalNeedAvailable > 0 && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-green-400 font-semibold">{totalNeedAvailable} figuritas que te faltan disponibles</span>
                  </>
                )}
              </div>

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
                        selectedUserId === u.ownerId ? 'bg-green-800 text-green-200' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {u.iNeedCount} ★
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedUserId === u.ownerId ? 'bg-dark/20 text-dark/70' : 'bg-surface3 text-gray-500'
                    }`}>
                      {u.count}
                    </span>
                  </button>
                ))}
              </div>

              {!selectedUserId ? (
                <div className="text-center py-12 text-gray-600 text-sm border border-dashed border-surface3 rounded-xl">
                  ↑ Seleccioná un coleccionista para ver sus figuritas disponibles
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Explore controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 bg-surface3/40 p-1 rounded-lg">
                      <button
                        onClick={() => setExploreFilter('all')}
                        className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${
                          exploreFilter === 'all' ? 'bg-surface2 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Todas ({selectedUserStickers.length})
                      </button>
                      <button
                        onClick={() => setExploreFilter('need')}
                        className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${
                          exploreFilter === 'need' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
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
                  </div>

                  {myRepeated.length === 0 && (
                    <span className="text-amber-400 text-xs font-semibold">
                      ⚠ Necesitás repetidas propias para ofertar
                    </span>
                  )}


                  {filteredSelectedStickers.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 text-sm border border-dashed border-surface3 rounded-xl">
                      {exploreFilter === 'need'
                        ? 'Este coleccionista no tiene figuritas que te falten'
                        : 'No hay resultados para tu búsqueda'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {filteredSelectedStickers.map((sticker) => {
                        const iNeedIt = !myOwnedOrRepeatedKeys.has(sticker.sticker_key)
                        const alreadyRequested = trades.some(
                          (t) =>
                            t.requester_id === userId &&
                            (t.requested_sticker_keys?.includes(sticker.sticker_key) ||
                              t.requested_sticker_key === sticker.sticker_key) &&
                            t.owner_id === sticker.user_id &&
                            t.status === 'pending'
                        )
                        const canRequest = !alreadyRequested && myRepeated.length > 0

                        return (
                          <button
                            key={sticker.sticker_key}
                            disabled={!canRequest}
                            onClick={() => handleOpenOffer([sticker])}
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
                            <StickerFlag stickerKey={sticker.sticker_key} className="text-xl mb-1 leading-none block" />
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

      {/* ── MATCHES ───────────────────────────────────────────────────────────── */}
      {innerTab === 'matches' && (
        <div className="space-y-5">
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <p className="text-purple-300 text-sm font-semibold">✨ Motor de matching automático</p>
            <p className="text-gray-400 text-xs mt-1">
              Coleccionistas con compatibilidad bidireccional: ellos tienen lo que te falta, y vos tenés lo que a ellos les falta.
              Los <span className="text-green-400 font-semibold">Match mutuo</span> son los más convenientes — usá "Proponer" para generar un intercambio sugerido al instante.
            </p>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-semibold">
                {myRepeated.length === 0 ? 'Necesitás repetidas para hacer matches' : 'Sin matches por ahora'}
              </p>
              <p className="text-sm mt-2">
                {myRepeated.length === 0
                  ? 'Cuando marques figuritas como repetidas, buscaremos coleccionistas compatibles.'
                  : 'Cuando otros usuarios tengan figuritas que te faltan y vos tengas para ofrecer, aparecerán aquí.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const isMutual = match.iHaveForThem.length > 0
                return (
                  <div
                    key={match.userId}
                    className={`bg-surface2 border rounded-xl overflow-hidden ${
                      isMutual ? 'border-green-500/40' : 'border-purple-500/30'
                    }`}
                  >
                    {/* Header */}
                    <div className={`px-4 py-3 flex items-center justify-between ${
                      isMutual ? 'bg-green-500/8' : 'bg-purple-500/8'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">{match.userName}</span>
                            {isMutual && (
                              <span className="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                ✨ Match mutuo
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <span className="text-green-400 font-semibold">{match.theyHave.length} te dan</span>
                            {isMutual && (
                              <>
                                <span className="mx-1 text-gray-600">·</span>
                                <span className="text-amber-400 font-semibold">{match.iHaveForThem.length} vos das</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => navigateToExplore(match.userId)}
                          className="px-2.5 py-1.5 bg-surface3 hover:bg-gray-600 text-gray-300 hover:text-white text-xs font-bold rounded-lg uppercase transition"
                        >
                          Ver →
                        </button>
                        <button
                          onClick={() => handleSuggestTrade(match)}
                          disabled={myRepeated.length === 0}
                          className={`px-2.5 py-1.5 text-white text-xs font-bold rounded-lg uppercase transition disabled:opacity-40 disabled:cursor-not-allowed ${
                            isMutual
                              ? 'bg-green-600 hover:bg-green-500'
                              : 'bg-purple-600 hover:bg-purple-500'
                          }`}
                        >
                          {isMutual ? '⇄ Proponer' : 'Pedir →'}
                        </button>
                      </div>
                    </div>

                    {/* They have (I need) */}
                    <div className="px-4 pt-3 pb-2">
                      <div className="text-[10px] text-green-400 uppercase tracking-wider mb-1.5 font-semibold">
                        Ellos tienen y vos necesitás ({match.theyHave.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.theyHave.slice(0, 10).map((key) => (
                          <div key={key} className="flex items-center gap-1 bg-green-500/10 border border-green-500/30 rounded-lg px-2 py-1">
                            <StickerFlag stickerKey={key} className="text-sm shrink-0" />
                            <span className="text-[10px] font-mono text-green-400 font-bold">{key}</span>
                          </div>
                        ))}
                        {match.theyHave.length > 10 && (
                          <span className="text-[10px] text-gray-500 self-center">+{match.theyHave.length - 10} más</span>
                        )}
                      </div>
                    </div>

                    {/* I have for them (mutual) */}
                    {isMutual && (
                      <div className="px-4 pb-3">
                        <div className="text-[10px] text-amber-400 uppercase tracking-wider mb-1.5 font-semibold">
                          Vos tenés y ellos necesitan ({match.iHaveForThem.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {match.iHaveForThem.slice(0, 10).map((key) => (
                            <div key={key} className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1">
                              <StickerFlag stickerKey={key} className="text-sm shrink-0" />
                              <span className="text-[10px] font-mono text-amber-400 font-bold">{key}</span>
                            </div>
                          ))}
                          {match.iHaveForThem.length > 10 && (
                            <span className="text-[10px] text-gray-500 self-center">+{match.iHaveForThem.length - 10} más</span>
                          )}
                        </div>
                      </div>
                    )}

                    {!isMutual && (
                      <div className="px-4 pb-3">
                        <p className="text-[10px] text-gray-600 italic">
                          Ellos no necesitan tus repetidas actuales — podés pedirles igualmente o esperar a tener más.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SOLICITAR ─────────────────────────────────────────────────────────── */}
      {innerTab === 'solicitar' && (
        <div className="space-y-5">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-blue-300 text-sm font-semibold">📋 Solicitud manual de intercambio</p>
            <p className="text-gray-400 text-xs mt-1">
              Especificá qué figurita querés y cuál ofrecés. El sistema te muestra quién la tiene disponible y si son compatibles.
            </p>
          </div>

          {/* PASO 1: ¿Qué querés? */}
          <section>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
              Paso 1 — ¿Qué figurita querés?
            </div>
            {wantKey ? (
              <div className="flex items-center gap-3 p-3 bg-gold2/10 border border-gold2/30 rounded-xl mb-3">
                <StickerFlag stickerKey={wantKey} className="text-3xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-gold2 text-xs font-mono font-bold">{wantKey}</div>
                  <div className="text-white text-sm font-semibold">{getStickerName(wantKey)}</div>
                </div>
                <button
                  onClick={() => { setWantKey(null); setRequestOfferKey(null) }}
                  className="shrink-0 text-gray-500 hover:text-white text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface3 transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={wantSearch}
                  onChange={(e) => setWantSearch(e.target.value)}
                  placeholder="Buscar por nombre o código (ej: ARG, Messi, CC1...)"
                  className="w-full bg-surface3/40 border border-surface3 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gold2/50 transition mb-3"
                />
                {filteredWantStickers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-surface3 rounded-xl">
                    {wantSearch ? 'Sin resultados — probá otro nombre o código' : 'No hay figuritas disponibles en el mercado'}
                  </div>
                ) : (
                  <>
                    {!wantSearch && (
                      <p className="text-[10px] text-gray-600 mb-2">Más disponibles en el mercado:</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {filteredWantStickers.map(({ key, count }) => (
                        <button
                          key={key}
                          onClick={() => setWantKey(key)}
                          className="text-left p-2.5 rounded-xl border border-surface3 bg-surface2 hover:border-green-500/60 hover:bg-green-500/10 transition"
                        >
                          <StickerFlag stickerKey={key} className="text-lg mb-1 block" />
                          <div className="text-[10px] font-mono text-gold2 font-bold">{key}</div>
                          <div className="text-xs text-white font-semibold line-clamp-2 leading-tight mt-0.5">
                            {getStickerName(key)}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            {count} coleccionista{count !== 1 ? 's' : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>

          {/* PASO 2: ¿Qué ofrecés? */}
          {wantKey && (
            <section>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                Paso 2 — ¿Qué ofrecés a cambio?
              </div>
              {myRepeated.length === 0 ? (
                <p className="text-amber-400 text-sm bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  No tenés figuritas repetidas para ofrecer.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {myRepeated.map((s) => (
                    <button
                      key={s.sticker_key}
                      onClick={() => setRequestOfferKey(requestOfferKey === s.sticker_key ? null : s.sticker_key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        requestOfferKey === s.sticker_key
                          ? 'border-gold2 bg-gold2/10 text-gold2 shadow-md shadow-gold2/10'
                          : 'border-surface3 bg-surface2 text-gray-300 hover:border-gold2/50 hover:text-white'
                      }`}
                    >
                      <StickerFlag stickerKey={s.sticker_key} className="text-sm shrink-0" />
                      <span className="font-mono">{s.sticker_key}</span>
                      <span className="text-gray-500">×{s.repeat_count}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* PASO 3: Coleccionistas compatibles */}
          {wantKey && (
            <section>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                Paso 3 — Quién tiene{' '}
                <span className="text-green-400 font-mono">{wantKey}</span>{' '}
                disponible ({usersWithWant.length})
              </div>
              {!requestOfferKey && myRepeated.length > 0 && (
                <p className="text-[11px] text-amber-400 mb-2">
                  ⚠ Seleccioná qué ofrecés (Paso 2) para ver compatibilidad y habilitar "Proponer".
                </p>
              )}
              {usersWithWant.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-surface3 rounded-xl">
                  Nadie tiene esta figurita disponible en este momento
                </div>
              ) : (
                <div className="space-y-2">
                  {usersWithWant.map((s) => {
                    const theirOwned = othersOwned.get(s.user_id)
                    const theyNeedMyOffer =
                      requestOfferKey && theirOwned !== undefined
                        ? !theirOwned.has(requestOfferKey)
                        : null
                    const alreadyRequested = trades.some(
                      (t) =>
                        t.requester_id === userId &&
                        (t.requested_sticker_keys?.includes(wantKey) ||
                          t.requested_sticker_key === wantKey) &&
                        t.owner_id === s.user_id &&
                        t.status === 'pending'
                    )
                    return (
                      <div
                        key={s.user_id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                          theyNeedMyOffer === true
                            ? 'bg-green-500/8 border-green-500/30'
                            : 'bg-surface2 border-surface3'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{s.owner_name}</span>
                            {theyNeedMyOffer === true && (
                              <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                                ✨ Compatibles
                              </span>
                            )}
                            {alreadyRequested && (
                              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                                Solicitada
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">×{s.repeat_count} extras disponibles</div>
                        </div>
                        <button
                          disabled={!requestOfferKey || alreadyRequested || myRepeated.length === 0}
                          onClick={() => {
                            setTargetMissing(requestOfferKey ? [requestOfferKey] : [])
                            handleOpenOffer([s], requestOfferKey ? [requestOfferKey] : [])
                          }}
                          className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-gold to-gold2 text-dark text-xs font-bold rounded-lg uppercase transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                        >
                          Proponer
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ── Offer modal ────────────────────────────────────────────────────────── */}
      {offerTargets && offerTargets.length > 0 && (
        <TradeOfferModal
          targetStickers={offerTargets}
          myRepeated={myRepeated}
          targetMissing={targetMissing}
          preSelectedKeys={offerPreSelect}
          phase={offerPhase}
          errorMessage={offerError}
          onConfirm={handleConfirmOffer}
          onRetry={() => { setOfferPhase('select'); setOfferError(null) }}
          onClose={() => {
            if (offerPhase === 'submitting' || offerPhase === 'success') return
            setOfferTargets(null)
            setOfferPreSelect([])
            setOfferPhase('select')
            setOfferError(null)
          }}
        />
      )}

      {/* ── Counter-offer modal ────────────────────────────────────────────────── */}
      {counterTarget && (
        <CounterOfferModal
          trade={counterTarget}
          myUserId={userId}
          myRepeated={myRepeated}
          phase={counterPhase}
          errorMessage={counterError}
          onConfirm={handleConfirmCounter}
          onRetry={() => { setCounterPhase('select'); setCounterError(null) }}
          onClose={() => {
            if (counterPhase === 'submitting') return
            setCounterTarget(null)
            setCounterPhase('select')
            setCounterError(null)
          }}
        />
      )}
    </div>
  )
}
