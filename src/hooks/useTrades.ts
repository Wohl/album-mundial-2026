'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { TradeRequest, StickerState, TradeMatch } from '@/types'
import { tradeService, OtherUserSticker } from '@/services/tradeService'
import { supabase, isOfflineMode } from '@/lib/supabase'

export const useTrades = (
  userId: string | null,
  myStickers: StickerState[],
  onStickerUpdate?: () => void
) => {
  const [trades, setTrades] = useState<TradeRequest[]>([])
  const [othersRepeated, setOthersRepeated] = useState<OtherUserSticker[]>([])
  const [othersOwned, setOthersOwned] = useState<Map<string, Set<string>>>(new Map())
  const [loading, setLoading] = useState(false)
  const onStickerUpdateRef = useRef(onStickerUpdate)
  onStickerUpdateRef.current = onStickerUpdate

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

  // Batch-fetch which of my repeated stickers each relevant user already owns (bidirectional matching)
  useEffect(() => {
    if (!userId || isOfflineMode || othersRepeated.length === 0 || myStickers.length === 0) return
    const myRepeatedKeys = myStickers
      .filter((s) => s.status === 'repeated')
      .map((s) => s.sticker_key)
    if (myRepeatedKeys.length === 0) { setOthersOwned(new Map()); return }

    const myOwnedOrRepeatedKeys = new Set(
      myStickers
        .filter((s) => s.status === 'owned' || s.status === 'repeated')
        .map((s) => s.sticker_key)
    )
    // Only care about users who have at least one sticker I don't own
    const relevantIds = Array.from(new Set(
      othersRepeated
        .filter((s) => !myOwnedOrRepeatedKeys.has(s.sticker_key))
        .map((s) => s.user_id)
    ))
    if (relevantIds.length === 0) { setOthersOwned(new Map()); return }
    tradeService.getMultipleUsersOwned(relevantIds, myRepeatedKeys).then(setOthersOwned)
  }, [userId, othersRepeated, myStickers])

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

  // Bidirectional auto-matching engine
  // "theyHave" = their repeated stickers I don't own/repeat (implicit missing on my side)
  // "iHaveForThem" = my repeated stickers they don't own/repeat (implicit missing on their side)
  const matches = useMemo((): TradeMatch[] => {
    if (!userId) return []
    const myRepeatedKeys = myStickers
      .filter((s) => s.status === 'repeated')
      .map((s) => s.sticker_key)
    if (myRepeatedKeys.length === 0) return []

    const myOwnedOrRepeatedKeys = new Set(
      myStickers
        .filter((s) => s.status === 'owned' || s.status === 'repeated')
        .map((s) => s.sticker_key)
    )

    const byUser = new Map<string, { userId: string; userName: string; theyHave: string[] }>()
    othersRepeated.forEach((s) => {
      if (!byUser.has(s.user_id)) {
        byUser.set(s.user_id, { userId: s.user_id, userName: s.owner_name, theyHave: [] })
      }
      // They have something I need = I don't already own or repeat it
      if (!myOwnedOrRepeatedKeys.has(s.sticker_key)) {
        byUser.get(s.user_id)!.theyHave.push(s.sticker_key)
      }
    })

    return Array.from(byUser.values())
      .filter((u) => u.theyHave.length > 0)
      .map((u) => {
        const theirOwned = othersOwned.get(u.userId) ?? new Set<string>()
        // iHaveForThem = my repeated stickers they don't already own
        const iHaveForThem = myRepeatedKeys.filter((k) => !theirOwned.has(k))
        return {
          userId: u.userId,
          userName: u.userName,
          theyHave: u.theyHave,
          iHave: myRepeatedKeys,
          iHaveForThem,
          score: u.theyHave.length * 2 + iHaveForThem.length,
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [userId, myStickers, othersRepeated, othersOwned])

  const createTrade = useCallback(
    async (ownerId: string, requestedKeys: string[], offeredKeys: string[]): Promise<TradeRequest> => {
      if (!userId) throw new Error('Sin sesión')
      const trade = await tradeService.createTradeRequest(userId, ownerId, requestedKeys, offeredKeys)
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

  const counterTrade = useCallback(
    async (tradeId: string, counterRequestedKeys: string[], counterOfferedKeys: string[]) => {
      await tradeService.counterTrade(tradeId, counterRequestedKeys, counterOfferedKeys)
      setTrades((prev) =>
        prev.map((t) => (t.id === tradeId ? { ...t, status: 'countered' as const } : t))
      )
      setTimeout(() => loadTrades(), 600)
    },
    [loadTrades]
  )

  const cancelTrade = useCallback(async (tradeId: string) => {
    await tradeService.cancelTradeRequest(tradeId)
    setTrades((prev) => prev.map((t) => (t.id === tradeId ? { ...t, status: 'cancelled' as const } : t)))
    setTimeout(() => loadTrades(), 600)
  }, [loadTrades])

  // Count trades awaiting my response (pending incoming + countered by other party)
  const pendingIncoming = trades.filter(
    (t) =>
      (t.owner_id === userId && t.status === 'pending') ||
      (t.status === 'countered' && t.counter_by !== userId &&
        (t.owner_id === userId || t.requester_id === userId))
  ).length

  return {
    trades,
    othersRepeated,
    matches,
    loading,
    pendingIncoming,
    createTrade,
    respondToTrade,
    counterTrade,
    cancelTrade,
    refetch: loadTrades,
  }
}
