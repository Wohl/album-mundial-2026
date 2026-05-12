'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TradeRequest, StickerState } from '@/types'
import { tradeService, OtherUserSticker } from '@/services/tradeService'
import { supabase, isOfflineMode } from '@/lib/supabase'

export const useTrades = (
  sessionId: string | null,
  myStickers: StickerState[],
  onStickerUpdate?: () => void
) => {
  const [trades, setTrades] = useState<TradeRequest[]>([])
  const [othersRepeated, setOthersRepeated] = useState<OtherUserSticker[]>([])
  const [loading, setLoading] = useState(false)
  const myStickersRef = useRef(myStickers)
  myStickersRef.current = myStickers
  const onStickerUpdateRef = useRef(onStickerUpdate)
  onStickerUpdateRef.current = onStickerUpdate

  const loadTrades = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const [tradesData, othersData] = await Promise.all([
        tradeService.getMyTrades(sessionId),
        tradeService.getOtherUsersRepeated(sessionId),
      ])
      setTrades(tradesData)
      setOthersRepeated(othersData)
    } catch (err) {
      console.error('Error loading trades:', err)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    loadTrades()
  }, [loadTrades])

  useEffect(() => {
    if (!sessionId || isOfflineMode) return

    const channel = supabase
      .channel(`trades:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trade_requests', filter: `owner_id=eq.${sessionId}` },
        () => loadTrades()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trade_requests', filter: `requester_id=eq.${sessionId}` },
        (payload) => {
          loadTrades()
          if ((payload.new as { status?: string })?.status === 'accepted') {
            // Stickers were updated in DB — refresh after short delay
            setTimeout(() => onStickerUpdateRef.current?.(), 600)
            setTimeout(() => onStickerUpdateRef.current?.(), 1500)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trade_requests', filter: `requester_id=eq.${sessionId}` },
        () => loadTrades()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, loadTrades])

  const createTrade = useCallback(
    async (ownerId: string, requestedKey: string, offeredKey: string): Promise<TradeRequest> => {
      if (!sessionId) throw new Error('Sin sesión')
      const trade = await tradeService.createTradeRequest(sessionId, ownerId, requestedKey, offeredKey)
      setTrades((prev) => [trade, ...prev])
      setTimeout(() => loadTrades(), 600)
      return trade
    },
    [sessionId, loadTrades]
  )

  const respondToTrade = useCallback(
    async (trade: TradeRequest, response: 'accepted' | 'rejected') => {
      if (!sessionId) return

      let requesterStickers: StickerState[] = []
      if (response === 'accepted') {
        const { data } = await supabase
          .from('sticker_states')
          .select()
          .eq('session_id', trade.requester_id)
        requesterStickers = data ?? []
      }

      await tradeService.respondToTrade(trade.id, response, trade, myStickersRef.current, requesterStickers)
      setTrades((prev) => prev.map((t) => (t.id === trade.id ? { ...t, status: response } : t)))

      if (response === 'accepted') {
        onStickerUpdateRef.current?.()
        setTimeout(() => onStickerUpdateRef.current?.(), 800)
      }

      setTimeout(() => loadTrades(), 600)
    },
    [sessionId, loadTrades]
  )

  const cancelTrade = useCallback(async (tradeId: string) => {
    await tradeService.cancelTradeRequest(tradeId)
    setTrades((prev) => prev.map((t) => (t.id === tradeId ? { ...t, status: 'cancelled' } : t)))
    setTimeout(() => loadTrades(), 600)
  }, [loadTrades])

  const pendingIncoming = trades.filter(
    (t) => t.owner_id === sessionId && t.status === 'pending'
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
