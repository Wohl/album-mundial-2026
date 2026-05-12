'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TradeRequest, StickerState } from '@/types'
import { tradeService, OtherUserSticker } from '@/services/tradeService'
import { supabase, isOfflineMode } from '@/lib/supabase'

export const useTrades = (sessionId: string | null, myStickers: StickerState[]) => {
  const [trades, setTrades] = useState<TradeRequest[]>([])
  const [othersRepeated, setOthersRepeated] = useState<OtherUserSticker[]>([])
  const [loading, setLoading] = useState(false)
  const myStickersRef = useRef(myStickers)
  myStickersRef.current = myStickers

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
        { event: '*', schema: 'public', table: 'trade_requests', filter: `requester_id=eq.${sessionId}` },
        () => loadTrades()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, loadTrades])

  const createTrade = useCallback(
    async (ownerId: string, requestedKey: string, offeredKey: string) => {
      if (!sessionId) return
      const trade = await tradeService.createTradeRequest(sessionId, ownerId, requestedKey, offeredKey)
      setTrades((prev) => [trade, ...prev])
    },
    [sessionId]
  )

  const respondToTrade = useCallback(
    async (trade: TradeRequest, response: 'accepted' | 'rejected') => {
      if (!sessionId) return

      const ownerStickers = response === 'accepted'
        ? await tradeService.getOtherUsersRepeated(trade.requester_id).then(() => myStickersRef.current)
        : []

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
    },
    [sessionId]
  )

  const cancelTrade = useCallback(
    async (tradeId: string) => {
      await tradeService.cancelTradeRequest(tradeId)
      setTrades((prev) => prev.map((t) => (t.id === tradeId ? { ...t, status: 'cancelled' } : t)))
    },
    []
  )

  const pendingIncoming = trades.filter(
    (t) => t.owner_id === sessionId && t.status === 'pending'
  ).length

  return { trades, othersRepeated, loading, pendingIncoming, createTrade, respondToTrade, cancelTrade, refetch: loadTrades }
}
