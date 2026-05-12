'use client'

import { TradeRequest } from '@/types'
import { getStickerName } from '@/lib/stickers'

interface TradeCardProps {
  trade: TradeRequest
  mySessionId: string
  onAccept: () => void
  onReject: () => void
  onCancel: () => void
}

const STATUS_LABELS: Record<TradeRequest['status'], { label: string; className: string }> = {
  pending:   { label: 'Pendiente', className: 'bg-amber-600/70 text-white' },
  accepted:  { label: 'Aceptado',  className: 'bg-green-600/70 text-white' },
  rejected:  { label: 'Rechazado', className: 'bg-red-600/70 text-white' },
  cancelled: { label: 'Cancelado', className: 'bg-gray-600/70 text-white' },
}

export const TradeCard = ({ trade, mySessionId, onAccept, onReject, onCancel }: TradeCardProps) => {
  const isIncoming = trade.owner_id === mySessionId
  const badge = STATUS_LABELS[trade.status]

  return (
    <div className="bg-surface2 border border-surface3 rounded-lg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="text-sm text-gray-300">
          {isIncoming ? (
            <span>
              <span className="font-bold text-gold2">{trade.requester_name}</span> te solicita un intercambio
            </span>
          ) : (
            <span>
              Solicitud a <span className="font-bold text-gold2">{trade.owner_name}</span>
            </span>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded uppercase whitespace-nowrap ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Stickers */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-surface3/50 rounded p-2">
          <div className="text-gray-400 mb-1">Solicita</div>
          <div className="font-semibold text-white">{getStickerName(trade.requested_sticker_key)}</div>
          <div className="text-gold2 mt-0.5">{trade.requested_sticker_key}</div>
        </div>
        <div className="bg-surface3/50 rounded p-2">
          <div className="text-gray-400 mb-1">Ofrece</div>
          <div className="font-semibold text-white">{getStickerName(trade.offered_sticker_key)}</div>
          <div className="text-gold2 mt-0.5">{trade.offered_sticker_key}</div>
        </div>
      </div>

      {/* Actions */}
      {trade.status === 'pending' && (
        <div className="flex gap-2">
          {isIncoming ? (
            <>
              <button
                onClick={onAccept}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded uppercase transition"
              >
                Aceptar
              </button>
              <button
                onClick={onReject}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded uppercase transition"
              >
                Rechazar
              </button>
            </>
          ) : (
            <button
              onClick={onCancel}
              className="flex-1 py-2 bg-surface3 hover:bg-gray-600 text-white text-sm font-bold rounded uppercase transition"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
