'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TradeRequest } from '@/types'
import { getStickerName } from '@/lib/stickers'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function notifLabel(trade: TradeRequest, userId: string) {
  const isIncoming = trade.owner_id === userId
  const other = isIncoming ? trade.requester_name : trade.owner_name
  const req = trade.requested_sticker_keys?.length
    ? trade.requested_sticker_keys
    : [trade.requested_sticker_key].filter(Boolean)
  const off = trade.offered_sticker_keys?.length
    ? trade.offered_sticker_keys
    : [trade.offered_sticker_key].filter(Boolean)
  const sl = (keys: string[]) =>
    keys.length === 1 ? getStickerName(keys[0]) : `${keys.length} figuritas`

  switch (trade.status) {
    case 'pending':
      return isIncoming
        ? { icon: '📬', label: `${other} te pidió un intercambio`, cls: 'bg-amber-500/10 border-amber-500/30', sub: `${sl(off)} ⇄ ${sl(req)}` }
        : { icon: '📤', label: `Solicitud enviada a ${other}`, cls: 'bg-blue-500/10 border-blue-500/30', sub: `${sl(off)} ⇄ ${sl(req)}` }
    case 'countered':
      return { icon: '↩', label: `Contraoferta con ${other}`, cls: 'bg-purple-500/10 border-purple-500/30', sub: '' }
    case 'accepted':
      return {
        icon: '✅',
        label: `Intercambio completado con ${other}`,
        cls: 'bg-green-500/10 border-green-500/30',
        sub: `${sl(off)} ⇄ ${sl(req)}`,
      }
    case 'rejected':
      return isIncoming
        ? { icon: '🚫', label: `Rechazaste la solicitud de ${other}`, cls: 'bg-red-500/10 border-red-500/30', sub: '' }
        : { icon: '🚫', label: `${other} rechazó tu solicitud`, cls: 'bg-red-500/10 border-red-500/30', sub: '' }
    default:
      return { icon: '↩️', label: `Solicitud cancelada con ${other}`, cls: 'bg-gray-500/10 border-gray-500/30', sub: '' }
  }
}

interface Props {
  show: boolean
  trades: TradeRequest[]
  userId: string
  onClose: () => void
}

export function NotificationsPanel({ show, trades, userId, onClose }: Props) {
  const activityFeed = useMemo(
    () =>
      [...trades].sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at).getTime() -
          new Date(a.updated_at ?? a.created_at).getTime()
      ),
    [trades]
  )

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="notif-bg"
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                onClick={onClose}
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
                </div>
              ) : (
                activityFeed.map((trade) => {
                  const { icon, label, cls, sub } = notifLabel(trade, userId)
                  return (
                    <div key={trade.id} className={`rounded-xl p-3 border ${cls}`}>
                      <div className="flex gap-2.5">
                        <span className="text-xl shrink-0 leading-none mt-0.5">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white leading-snug">{label}</p>
                          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
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
  )
}
