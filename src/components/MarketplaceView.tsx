'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  onCreateTrade: (ownerId: string, requestedKey: string, offeredKey: string) => Promise<unknown>
  onRespondToTrade: (trade: TradeRequest, response: 'accepted' | 'rejected') => Promise<void>
  onCancelTrade: (tradeId: string) => Promise<void>
}

type InnerTab = 'trades' | 'explore'
type ExploreFilter = 'all' | 'need'
type ToastMsg = { id: number; msg: string; type: 'success' | 'error' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function notifStyle(
  trade: TradeRequest,
  isIncoming: boolean,
  other: string
): { icon: string; label: string; cls: string } {
  if (trade.status === 'pending') {
    return isIncoming
      ? { icon: '📬', label: `${other} te pidió un intercambio`, cls: 'bg-amber-500/10 border-amber-500/30' }
      : { icon: '📤', label: `Solicitud enviada a ${other}`, cls: 'bg-blue-500/10 border-blue-500/30' }
  }
  if (trade.status === 'accepted') {
    return { icon: '✅', label: `Intercambio completado con ${other}`, cls: 'bg-green-500/10 border-green-500/30' }
  }
  if (trade.status === 'rejected') {
    return isIncoming
      ? { icon: '🚫', label: `Rechazaste la solicitud de ${other}`, cls: 'bg-red-500/10 border-red-500/30' }
      : { icon: '🚫', label: `${other} rechazó tu solicitud`, cls: 'bg-red-500/10 border-red-500/30' }
  }
  return { icon: '↩️', label: `Solicitud cancelada con ${other}`, cls: 'bg-gray-500/10 border-gray-500/30' }
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
  const [innerTab, setInnerTab] = useState<InnerTab>('trades')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [targetMissing, setTargetMissing] = useState<string[]>([])
  const [offerTarget, setOfferTarget] = useState<OtherUserSticker | null>(null)
  const [offerPhase, setOfferPhase] = useState<'select' | 'submitting' | 'success' | 'error'>('select')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [exploreFilter, setExploreFilter] = useState<ExploreFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const toastId = useRef(0)

  const pushToast = useCallback((msg: string, type: ToastMsg['type'] = 'success') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

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
      if (!map.has(s.session_id))
        map.set(s.session_id, { ownerName: s.owner_name, ownerId: s.session_id, count: 0, iNeedCount: 0 })
      const e = map.get(s.session_id)!
      e.count++
      if (myMissingKeys.has(s.sticker_key)) e.iNeedCount++
    })
    return Array.from(map.values()).sort((a, b) => b.iNeedCount - a.iNeedCount)
  }, [othersRepeated, myMissingKeys])

  const selectedUserStickers = useMemo(
    () => othersRepeated.filter((s) => s.session_id === selectedUserId),
    [othersRepeated, selectedUserId]
  )

  const filteredSelectedStickers = useMemo(() => {
    let list = selectedUserStickers
    if (exploreFilter === 'need') list = list.filter((s) => myMissingKeys.has(s.sticker_key))
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
      const deselect = selectedUserId === userId
      setSelectedUserId(deselect ? null : userId)
      setExploreFilter('all')
      setSearchQuery('')
      if (deselect) { setTargetMissing([]); return }
      try {
        const missing = await tradeService.getUserMissingStickers(userId)
        setTargetMissing(missing)
      } catch {
        setTargetMissing([])
      }
    },
    [selectedUserId]
  )

  // Trade buckets
  const pendingIncoming = useMemo(
    () => trades.filter((t) => t.owner_id === sessionId && t.status === 'pending'),
    [trades, sessionId]
  )
  const pendingOutgoing = useMemo(
    () => trades.filter((t) => t.requester_id === sessionId && t.status === 'pending'),
    [trades, sessionId]
  )
  const historyTrades = useMemo(() => trades.filter((t) => t.status !== 'pending'), [trades])
  const completedCount = useMemo(() => trades.filter((t) => t.status === 'accepted').length, [trades])

  const totalNeedAvailable = useMemo(
    () => othersRepeated.filter((s) => myMissingKeys.has(s.sticker_key)).length,
    [othersRepeated, myMissingKeys]
  )
  const needInSelected = useMemo(
    () => selectedUserStickers.filter((s) => myMissingKeys.has(s.sticker_key)).length,
    [selectedUserStickers, myMissingKeys]
  )

  const activityFeed = useMemo(
    () =>
      [...trades].sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at).getTime() -
          new Date(a.updated_at ?? a.created_at).getTime()
      ),
    [trades]
  )

  // ── Action handlers ──────────────────────────────────────────────────────────

  const handleConfirmOffer = useCallback(
    async (offeredKey: string) => {
      if (!offerTarget) return
      setOfferPhase('submitting')
      try {
        await onCreateTrade(offerTarget.session_id, offerTarget.sticker_key, offeredKey)
        setOfferPhase('success')
        pushToast('Solicitud enviada correctamente')
        setTimeout(() => {
          setOfferTarget(null)
          setOfferPhase('select')
        }, 2000)
      } catch (err) {
        console.error('createTrade error:', err)
        setOfferPhase('error')
      }
    },
    [offerTarget, onCreateTrade, pushToast]
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

  // ────────────────────────────────────────────────────────────────────────────

  if (isOfflineMode) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-4">🔌</div>
        <div className="text-xl font-display uppercase text-gold2">Sin conexión</div>
        <p className="mt-2 text-sm">
          El mercado requiere conexión a Supabase. Verificá las variables de entorno y tu red.
        </p>
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
      {/* ── Toasts ────────────────────────────────────────────────────────────── */}
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

      {/* ── Notifications panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              key="notif-bg"
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              key="notif-panel"
              className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-surface2 border-l border-surface3 shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="p-5 border-b border-surface3 flex items-center justify-between shrink-0">
                <h2 className="font-display text-gold2 uppercase text-lg tracking-wide">Actividad</h2>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-500 hover:text-white transition text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface3"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activityFeed.length === 0 ? (
                  <div className="text-center py-12 text-gray-600 text-sm">
                    <div className="text-4xl mb-3">🔔</div>
                    <p>Sin actividad registrada</p>
                    <p className="text-xs mt-1 text-gray-700">Los intercambios aparecerán aquí</p>
                  </div>
                ) : (
                  activityFeed.map((trade) => {
                    const isIncoming = trade.owner_id === sessionId
                    const other = isIncoming ? trade.requester_name : trade.owner_name
                    const { icon, label, cls } = notifStyle(trade, isIncoming, other)
                    return (
                      <div key={trade.id} className={`rounded-xl p-3 border ${cls}`}>
                        <div className="flex gap-2.5">
                          <span className="text-xl shrink-0 leading-none mt-0.5">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white leading-snug">{label}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              {getStickerTeamFlag(trade.offered_sticker_key)}{' '}
                              {getStickerName(trade.offered_sticker_key)}
                              <span className="mx-1.5 text-gray-600">⇄</span>
                              {getStickerTeamFlag(trade.requested_sticker_key)}{' '}
                              {getStickerName(trade.requested_sticker_key)}
                            </p>
                            <p className="text-[10px] text-gray-600 mt-1.5">
                              {timeAgo(trade.updated_at ?? trade.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Stats + bell ──────────────────────────────────────────────────────── */}
      <div className="flex gap-3 items-stretch">
        <div className="grid grid-cols-3 gap-3 flex-1">
          <div
            className={`rounded-xl p-4 text-center border transition ${
              pendingIncoming.length > 0
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'bg-surface2 border-surface3'
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                pendingIncoming.length > 0 ? 'text-amber-400' : 'text-gray-500'
              }`}
            >
              {pendingIncoming.length}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Por responder</div>
          </div>
          <div className="bg-surface2 border border-surface3 rounded-xl p-4 text-center">
            <div
              className={`text-2xl font-bold ${
                pendingOutgoing.length > 0 ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              {pendingOutgoing.length}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Enviadas</div>
          </div>
          <div className="bg-surface2 border border-surface3 rounded-xl p-4 text-center">
            <div
              className={`text-2xl font-bold ${completedCount > 0 ? 'text-green-400' : 'text-gray-500'}`}
            >
              {completedCount}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Completadas</div>
          </div>
        </div>
        <button
          onClick={() => setShowNotifications(true)}
          className="relative flex flex-col items-center justify-center bg-surface2 border border-surface3 rounded-xl px-4 gap-1 hover:border-gold2/50 hover:bg-surface3/50 transition shrink-0"
        >
          <span className="text-2xl">🔔</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Actividad</span>
          {pendingIncoming.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.2rem] h-[1.2rem] px-1 flex items-center justify-center">
              {pendingIncoming.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Inner tabs ────────────────────────────────────────────────────────── */}
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

      {/* ── INTERCAMBIOS ──────────────────────────────────────────────────────── */}
      {innerTab === 'trades' && (
        <div className="space-y-6">
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
                    loading={actionLoading === trade.id}
                    onAccept={() => handleAccept(trade)}
                    onReject={() => handleReject(trade)}
                    onCancel={() => handleCancel(trade.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-display text-gold2 uppercase tracking-wide mb-3">
              Solicitudes enviadas
            </h2>
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
                    loading={actionLoading === trade.id}
                    onAccept={() => handleAccept(trade)}
                    onReject={() => handleReject(trade)}
                    onCancel={() => handleCancel(trade.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {historyTrades.length > 0 && (
            <section>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm font-semibold uppercase tracking-wide transition"
              >
                <span
                  className={`transition-transform duration-200 inline-block ${
                    showHistory ? 'rotate-90' : ''
                  }`}
                >
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
              <p className="mt-1">Explorá las figuritas disponibles para proponer uno.</p>
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
                    <span className="text-green-400 font-semibold">
                      {totalNeedAvailable} figuritas que te faltan disponibles
                    </span>
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
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          selectedUserId === u.ownerId
                            ? 'bg-green-800 text-green-200'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {u.iNeedCount} ★
                      </span>
                    )}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedUserId === u.ownerId
                          ? 'bg-dark/20 text-dark/70'
                          : 'bg-surface3 text-gray-500'
                      }`}
                    >
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
                            onClick={() => { setOfferTarget(sticker); setOfferPhase('select') }}
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
                            <div className="text-[11px] text-gold2 font-mono font-bold">
                              {sticker.sticker_key}
                            </div>
                            <div className="text-xs font-semibold text-white mt-0.5 line-clamp-2 leading-tight">
                              {getStickerName(sticker.sticker_key)}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">
                              ×{sticker.repeat_count} extras
                            </div>
                            {canRequest && (
                              <div
                                className={`mt-2 text-center text-[10px] font-bold py-1 rounded transition ${
                                  iNeedIt
                                    ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30'
                                    : 'bg-surface3 text-gray-400 group-hover:text-gray-300'
                                }`}
                              >
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

      {/* ── Offer modal (siempre montado mientras offerTarget != null) ─────────── */}
      {offerTarget && (
        <TradeOfferModal
          targetSticker={offerTarget}
          myRepeated={myRepeated}
          targetMissing={targetMissing}
          phase={offerPhase}
          onConfirm={handleConfirmOffer}
          onRetry={() => setOfferPhase('select')}
          onClose={() => {
            if (offerPhase === 'submitting' || offerPhase === 'success') return
            setOfferTarget(null)
            setOfferPhase('select')
          }}
        />
      )}
    </div>
  )
}
