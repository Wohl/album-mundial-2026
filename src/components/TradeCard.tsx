'use client'

import { useMemo } from 'react'
import { TradeRequest, StickerState } from '@/types'
import { getStickerName, displayKey } from '@/lib/stickers'
import { StickerFlag } from '@/components/TeamFlag'

interface TradeCardProps {
  trade: TradeRequest
  myUserId: string
  myStickers?: StickerState[]
  loading?: boolean
  onAccept: () => void
  onReject: () => void
  onCancel: () => void
  onCounter?: () => void
}

type StickerStatus = 'owned' | 'repeated' | 'new'

const STICKER_ROW_BG: Record<StickerStatus, string> = {
  new:      'bg-green-500/8 border border-green-500/20',
  owned:    'bg-blue-500/8 border border-blue-500/20',
  repeated: 'bg-amber-500/8 border border-amber-500/20',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

const STATUS_STYLES: Record<TradeRequest['status'], { label: string; cls: string }> = {
  pending:   { label: 'Pendiente',    cls: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  accepted:  { label: 'Completado',   cls: 'bg-green-500/20 text-green-400 border-green-500/40' },
  rejected:  { label: 'Rechazado',    cls: 'bg-red-500/20 text-red-400 border-red-500/40' },
  cancelled: { label: 'Cancelado',    cls: 'bg-gray-500/20 text-gray-500 border-gray-500/40' },
  countered: { label: 'Contraoferta', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
}

const STICKER_STATUS_BADGE: Record<StickerStatus, { label: string; cls: string }> = {
  repeated: { label: 'Repetida',    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  owned:    { label: 'Ya la tenés', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  new:      { label: '¡Nueva!',     cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
}

const StickerRow = ({
  stickerKey,
  status,
}: {
  stickerKey: string
  status?: StickerStatus
}) => {
  const badge = status ? STICKER_STATUS_BADGE[status] : null
  const rowBg = status ? STICKER_ROW_BG[status] : ''
  return (
    <div className={`rounded-lg px-2 py-1.5 space-y-1 ${rowBg}`}>
      <div className="flex items-center gap-2">
        <StickerFlag stickerKey={stickerKey} className="text-base leading-none shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-gold2 font-mono font-bold leading-none">{displayKey(stickerKey)}</div>
          <div className="text-xs text-white font-semibold leading-tight truncate">{getStickerName(stickerKey)}</div>
        </div>
      </div>
      {badge && (
        <div className={`self-start inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide border ${badge.cls}`}>
          {status === 'new' && (
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          )}
          {status === 'owned' && (
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {status === 'repeated' && (
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            </svg>
          )}
          {badge.label}
        </div>
      )}
    </div>
  )
}

const StickerList = ({
  keys,
  label,
  statusMap,
}: {
  keys: string[]
  label: string
  statusMap: Map<string, StickerStatus>
}) => (
  <div className="flex-1 min-w-0 bg-surface3/40 rounded-xl p-2.5 space-y-1.5">
    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold text-center mb-2">{label}</div>
    <div className="space-y-1.5">
      {keys.map((key) => (
        <StickerRow key={key} stickerKey={key} status={statusMap.get(key)} />
      ))}
    </div>
  </div>
)

export const TradeCard = ({
  trade,
  myUserId,
  myStickers,
  loading = false,
  onAccept,
  onReject,
  onCancel,
  onCounter,
}: TradeCardProps) => {
  const isIncoming = trade.owner_id === myUserId
  const status = STATUS_STYLES[trade.status]
  const otherName = isIncoming ? trade.requester_name : trade.owner_name
  const iCountered = trade.status === 'countered' && trade.counter_by === myUserId

  // Build a map key → status using MY collection (only owned/repeated — skip 'missing')
  const statusMap = useMemo((): Map<string, StickerStatus> => {
    const map = new Map<string, StickerStatus>()
    if (!myStickers) return map
    myStickers.forEach((s) => {
      if (s.status === 'owned' || s.status === 'repeated') {
        map.set(s.sticker_key, s.status)
      }
    })
    return map
  }, [myStickers])

  // For any key not in statusMap, status = 'new' (I don't own it)
  const getStatus = (key: string): StickerStatus | undefined => {
    if (!myStickers) return undefined
    return statusMap.get(key) ?? 'new'
  }

  // Prefer array fields; fall back to legacy single-key fields
  const rawOffered = trade.offered_sticker_keys?.length
    ? trade.offered_sticker_keys
    : [trade.offered_sticker_key].filter(Boolean)
  const rawRequested = trade.requested_sticker_keys?.length
    ? trade.requested_sticker_keys
    : [trade.requested_sticker_key].filter(Boolean)

  // In countered state, show counter terms
  const displayedOffered = trade.status === 'countered' && trade.counter_offered_keys?.length
    ? (isIncoming ? trade.counter_offered_keys : trade.counter_requested_keys ?? rawOffered)
    : rawOffered
  const displayedRequested = trade.status === 'countered' && trade.counter_requested_keys?.length
    ? (isIncoming ? trade.counter_requested_keys : trade.counter_offered_keys ?? rawRequested)
    : rawRequested

  // Build status maps for each column
  // "offered" column = stickers being offered TO me (I'll receive them)
  // "requested" column = stickers being asked FROM me (I'd give them away)
  const offeredStatusMap = useMemo(() => {
    const map = new Map<string, StickerStatus>()
    displayedOffered.forEach((key) => {
      const s = getStatus(key)
      if (s) map.set(key, s)
    })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedOffered, statusMap])

  const requestedStatusMap = useMemo(() => {
    const map = new Map<string, StickerStatus>()
    displayedRequested.forEach((key) => {
      const s = getStatus(key)
      if (s) map.set(key, s)
    })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedRequested, statusMap])

  const canRespond =
    (isIncoming && trade.status === 'pending') ||
    (trade.status === 'countered' && !iCountered && (trade.owner_id === myUserId || trade.requester_id === myUserId))
  const canCancel = !isIncoming && trade.status === 'pending'
  const canCounter = !!onCounter && canRespond

  return (
    <div className={`bg-surface2 rounded-xl border overflow-hidden transition-all ${
      canRespond
        ? 'border-amber-500/50 shadow-lg shadow-amber-500/5'
        : trade.status === 'accepted'
        ? 'border-green-500/30'
        : trade.status === 'countered'
        ? 'border-purple-500/30'
        : 'border-surface3'
    }`}>
      {/* Header */}
      <div className={`px-4 py-2.5 flex items-center justify-between gap-2 ${
        isIncoming ? 'bg-amber-500/8' : 'bg-blue-500/8'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-bold uppercase tracking-wide shrink-0 ${
            isIncoming ? 'text-amber-400' : 'text-blue-400'
          }`}>
            {isIncoming ? '⬇ Recibida' : '⬆ Enviada'}
          </span>
          <span className="text-gray-600 shrink-0">·</span>
          <span className="text-gray-300 text-xs font-semibold truncate">{otherName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`border px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.cls}`}>
            {status.label}
          </span>
          <span className="text-gray-600 text-[10px]">{timeAgo(trade.created_at)}</span>
        </div>
      </div>

      {/* Counter-offer note */}
      {trade.status === 'countered' && (
        <div className={`px-4 py-2 text-xs font-semibold border-b border-surface3 ${
          iCountered ? 'text-purple-400/70' : 'text-purple-400'
        }`}>
          {iCountered
            ? '⏳ Esperando respuesta a tu contraoferta'
            : '↩ Contraoferta recibida — revisá los nuevos términos'}
        </div>
      )}

      {/* Sticker exchange */}
      <div className="p-3 flex items-stretch gap-2">
        <StickerList
          keys={displayedOffered}
          label={isIncoming ? 'Él ofrece' : 'Vos ofrecés'}
          statusMap={offeredStatusMap}
        />
        <div className="flex items-center text-gray-600 font-bold text-base shrink-0 self-center">⇄</div>
        <StickerList
          keys={displayedRequested}
          label={isIncoming ? 'Él pide' : 'Vos pedís'}
          statusMap={requestedStatusMap}
        />
      </div>

      {/* Actions */}
      {(canRespond || canCancel) && (
        <div className="flex gap-2 px-3 pb-3">
          {canRespond && (
            <>
              <button
                onClick={onAccept}
                disabled={loading}
                className="flex-1 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg uppercase transition"
              >
                {loading ? '...' : trade.status === 'countered' ? 'Aceptar oferta' : 'Aceptar'}
              </button>
              {canCounter && (
                <button
                  onClick={onCounter}
                  disabled={loading}
                  className="flex-1 py-2 bg-purple-800/80 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg uppercase transition"
                >
                  Contraofertar
                </button>
              )}
              <button
                onClick={onReject}
                disabled={loading}
                className="flex-1 py-2 bg-red-800/80 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg uppercase transition"
              >
                {loading ? '...' : 'Rechazar'}
              </button>
            </>
          )}
          {canCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full py-2 bg-surface3 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white text-xs font-bold rounded-lg uppercase transition"
            >
              {loading ? 'Cancelando...' : 'Cancelar solicitud'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
