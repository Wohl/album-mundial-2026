'use client'

import { TradeRequest } from '@/types'
import { getStickerName, getStickerTeamFlag } from '@/lib/stickers'

interface TradeCardProps {
  trade: TradeRequest
  mySessionId: string
  loading?: boolean
  onAccept: () => void
  onReject: () => void
  onCancel: () => void
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
  pending:   { label: 'Pendiente', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  accepted:  { label: 'Completado', cls: 'bg-green-500/20 text-green-400 border-green-500/40' },
  rejected:  { label: 'Rechazado', cls: 'bg-red-500/20 text-red-400 border-red-500/40' },
  cancelled: { label: 'Cancelado', cls: 'bg-gray-500/20 text-gray-500 border-gray-500/40' },
}

const StickerChip = ({ stickerKey, label }: { stickerKey: string; label: string }) => {
  const flag = getStickerTeamFlag(stickerKey)
  const name = getStickerName(stickerKey)
  return (
    <div className="flex-1 min-w-0 bg-surface3/60 rounded-lg p-3 text-center space-y-1">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{label}</div>
      {flag && <div className="text-2xl leading-none">{flag}</div>}
      <div className="text-xs font-bold text-white leading-tight line-clamp-2">{name}</div>
      <div className="text-[10px] text-gold2 font-mono">{stickerKey}</div>
    </div>
  )
}

export const TradeCard = ({ trade, mySessionId, loading = false, onAccept, onReject, onCancel }: TradeCardProps) => {
  const isIncoming = trade.owner_id === mySessionId
  const status = STATUS_STYLES[trade.status]
  const otherName = isIncoming ? trade.requester_name : trade.owner_name

  return (
    <div className={`bg-surface2 rounded-xl border overflow-hidden transition-all ${
      isIncoming && trade.status === 'pending'
        ? 'border-amber-500/50 shadow-lg shadow-amber-500/5'
        : trade.status === 'accepted'
        ? 'border-green-500/30'
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

      {/* Sticker exchange */}
      <div className="p-3 flex items-stretch gap-2">
        <StickerChip stickerKey={trade.offered_sticker_key} label={isIncoming ? 'Él ofrece' : 'Vos ofrecés'} />
        <div className="flex items-center text-gray-600 font-bold text-base shrink-0 pb-1">⇄</div>
        <StickerChip stickerKey={trade.requested_sticker_key} label={isIncoming ? 'Él pide' : 'Vos pedís'} />
      </div>

      {/* Actions */}
      {trade.status === 'pending' && (
        <div className="flex gap-2 px-3 pb-3">
          {isIncoming ? (
            <>
              <button
                onClick={onAccept}
                disabled={loading}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg uppercase transition"
              >
                {loading ? '...' : 'Aceptar'}
              </button>
              <button
                onClick={onReject}
                disabled={loading}
                className="flex-1 py-2 bg-red-800/80 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg uppercase transition"
              >
                {loading ? '...' : 'Rechazar'}
              </button>
            </>
          ) : (
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
