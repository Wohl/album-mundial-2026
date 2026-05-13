'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TradeRequest, StickerState } from '@/types'
import { tradeService, OtherUserSticker } from '@/services/tradeService'
import { supabase, isOfflineMode } from '@/lib/supabase'

export const useTrades = (
  userId: string | null,
  myStickers: StickerState[],
  onStickerUpdate?: () => void
) => {
  const [trades, setTrades] = useState<TradeRequest[]>([])
  const [othersRepeated, setOthersRepeated] = useState<OtherUserSticker[]>([])
  const [loading, setLoading] = useState(false)
  const onStickerUpdateRef = useRef(onStickerUpdate)
  onStickerUpdateRef.current = onStickerUpdate

  // Keep myStickers accessible in callbacks without re-creating them
  void myStickers

  const loadTrades = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [tradesData, othersData] = await Promise.all([
        tradeService.getMyTrades(userId),
        tradeService.getOtherUsersRepeated(userId),
      ])
      setTrades(tradesData)
      setOthersRepeated(othersData)
    } catch (err) {
      console.error('Error loading trades:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadTrades()
  }, [loadTrades])

  useEffect(() => {
    if (!userId || isOfflineMode) return

    const channel = supabase
      .channel(`trades:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trade_requests', filter: `owner_id=eq.${userId}` },
        () => loadTrades()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trade_requests', filter: `requester_id=eq.${userId}` },
        (payload) => {
          loadTrades()
          if ((payload.new as { status?: string })?.status === 'accepted') {
            setTimeout(() => onStickerUpdateRef.current?.(), 600)
            setTimeout(() => onStickerUpdateRef.current?.(), 1500)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trade_requests', filter: `requester_id=eq.${userId}` },
        () => loadTrades()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, loadTrades])

  const createTrade = useCallback(
    async (ownerId: string, requestedKey: string, offeredKey: string): Promise<TradeRequest> => {
      if (!userId) throw new Error('Sin sesión')
      const trade = await tradeService.createTradeRequest(userId, ownerId, requestedKey, offeredKey)
      setTrades((prev) => [trade, ...prev])
      setTimeout(() => loadTrades(), 600)
      return trade
    },
    [userId, loadTrades]
  )

  const respondToTrade = useCallback(
    async (trade: TradeRequest, response: 'accepted' | 'rejected') => {
      if (!userId) return

      await tradeService.respondToTrade(trade.id, response)
      setTrades((prev) => prev.map((t) => (t.id === trade.id ? { ...t, status: response } : t)))

      if (response === 'accepted') {
        onStickerUpdateRef.current?.()
        setTimeout(() => onStickerUpdateRef.current?.(), 800)
      }

      setTimeout(() => loadTrades(), 600)
    },
    [userId, loadTrades]
  )

  const cancelTrade = useCallback(async (tradeId: string) => {
    await tradeService.cancelTradeRequest(tradeId)
    setTrades((prev) => prev.map((t) => (t.id === tradeId ? { ...t, status: 'cancelled' } : t)))
    setTimeout(() => loadTrades(), 600)
  }, [loadTrades])

  const pendingIncoming = trades.filter(
    (t) => t.owner_id === userId && t.status === 'pending'
  ).length

  return {
    trades,
    othersRepeated,
    loading,
    pendingIncoming,
    createTrade,
    respondToTrade,
    cancelTrade,
    refetch: loadTrades,
  }
}
