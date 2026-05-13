'use client'

import { TradeRequest } from '@/types'
import { getStickerName } from '@/lib/stickers'
import { StickerFlag } from '@/components/TeamFlag'

interface TradeCardProps {
  trade: TradeRequest
  myUserId: string
  loading?: boolean
  onAccept: () => void
  onReject: () => void
  onCancel: () => void
  onCounter?: () => void
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

const StickerList = ({ keys, label }: { keys: string[]; label: string }) => (
  <div className="flex-1 min-w-0 bg-surface3/60 rounded-lg p-3 space-y-2">
    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold text-center">{label}</div>
    <div className="space-y-1.5">
      {keys.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <StickerFlag stickerKey={key} className="text-lg leading-none shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-gold2 font-mono font-bold">{key}</div>
            <div className="text-xs text-white font-semibold leading-tight truncate">{getStickerName(key)}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const TradeCard = ({
  trade,
  myUserId,
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

  // Action permissions
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
        />
        <div className="flex items-center text-gray-600 font-bold text-base shrink-0 self-center">⇄</div>
        <StickerList
          keys={displayedRequested}
          label={isIncoming ? 'Él pide' : 'Vos pedís'}
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
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg uppercase transition"
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
