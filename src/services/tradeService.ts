import { TradeRequest, StickerState } from '@/types'
import { supabase, isOfflineMode } from '@/lib/supabase'

export type OtherUserSticker = StickerState & { owner_name: string }

async function fetchSessionNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const { data } = await supabase
    .from('sessions')
    .select('id, display_name')
    .in('id', ids)
  const map = new Map<string, string>()
  ;(data ?? []).forEach((s: { id: string; display_name: string }) => map.set(s.id, s.display_name))
  return map
}

export const tradeService = {
  async getOtherUsersRepeated(mySessionId: string): Promise<OtherUserSticker[]> {
    if (isOfflineMode) return []

    const { data, error } = await supabase
      .from('sticker_states')
      .select('id, session_id, sticker_key, status, repeat_count, updated_at')
      .eq('status', 'repeated')
      .neq('session_id', mySessionId)

    if (error) { console.error('getOtherUsersRepeated:', error); return [] }
    if (!data || data.length === 0) return []

    const sessionIds = Array.from(new Set(data.map((r) => r.session_id as string)))
    const names = await fetchSessionNames(sessionIds)

    return data.map((row) => ({
      id: row.id as string,
      session_id: row.session_id as string,
      sticker_key: row.sticker_key as string,
      status: row.status as StickerState['status'],
      repeat_count: row.repeat_count as number,
      updated_at: row.updated_at as string,
      owner_name: names.get(row.session_id as string) ?? '',
    }))
  },

  async getMyTrades(sessionId: string): Promise<TradeRequest[]> {
    if (isOfflineMode) return []

    const { data, error } = await supabase
      .from('trade_requests')
      .select('id, requester_id, owner_id, requested_sticker_key, offered_sticker_key, status, created_at, updated_at')
      .or(`owner_id.eq.${sessionId},requester_id.eq.${sessionId}`)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    if (error) { console.error('getMyTrades:', error); return [] }
    if (!data || data.length === 0) return []

    const sessionIds = Array.from(
      new Set(data.flatMap((t) => [t.requester_id as string, t.owner_id as string]))
    )
    const names = await fetchSessionNames(sessionIds)

    return data.map((row) => ({
      id: row.id as string,
      requester_id: row.requester_id as string,
      requester_name: names.get(row.requester_id as string) ?? '',
      owner_id: row.owner_id as string,
      owner_name: names.get(row.owner_id as string) ?? '',
      requested_sticker_key: row.requested_sticker_key as string,
      offered_sticker_key: row.offered_sticker_key as string,
      status: row.status as TradeRequest['status'],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }))
  },

  async getUserMissingStickers(targetSessionId: string): Promise<string[]> {
    if (isOfflineMode) return []
    const { data, error } = await supabase
      .from('sticker_states')
      .select('sticker_key')
      .eq('session_id', targetSessionId)
      .eq('status', 'missing')
    if (error) return []
    return (data ?? []).map((r) => r.sticker_key as string)
  },

  async createTradeRequest(
    requesterId: string,
    ownerId: string,
    requestedKey: string,
    offeredKey: string
  ): Promise<TradeRequest> {
    if (isOfflineMode) throw new Error('Sin conexión')

    const { data, error } = await supabase
      .from('trade_requests')
      .insert({
        requester_id: requesterId,
        owner_id: ownerId,
        requested_sticker_key: requestedKey,
        offered_sticker_key: offeredKey,
      })
      .select('id, requester_id, owner_id, requested_sticker_key, offered_sticker_key, status, created_at, updated_at')
      .single()

    if (error) throw error

    const names = await fetchSessionNames([requesterId, ownerId])

    return {
      id: data.id,
      requester_id: data.requester_id,
      requester_name: names.get(data.requester_id) ?? '',
      owner_id: data.owner_id,
      owner_name: names.get(data.owner_id) ?? '',
      requested_sticker_key: data.requested_sticker_key,
      offered_sticker_key: data.offered_sticker_key,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  },

  async respondToTrade(
    tradeId: string,
    response: 'accepted' | 'rejected',
    trade: TradeRequest,
    ownerStickers: StickerState[],
    requesterStickers: StickerState[]
  ): Promise<void> {
    if (isOfflineMode) throw new Error('Sin conexión')

    const { error: statusError } = await supabase
      .from('trade_requests')
      .update({ status: response })
      .eq('id', tradeId)

    if (statusError) throw statusError
    if (response !== 'accepted') return

    const upsert = async (sessionId: string, key: string, status: StickerState['status'], count: number) => {
      const { error } = await supabase
        .from('sticker_states')
        .upsert(
          [{ session_id: sessionId, sticker_key: key, status, repeat_count: count }],
          { onConflict: 'session_id,sticker_key' }
        )
      if (error) throw error
    }

    const decrementSticker = async (sessionId: string, key: string, sticker?: StickerState) => {
      if (!sticker || sticker.status === 'missing') {
        await upsert(sessionId, key, 'missing', 0)
        return
      }

      if (sticker.status === 'owned') {
        await upsert(sessionId, key, 'missing', 0)
        return
      }

      const remainingExtras = Math.max(0, (sticker.repeat_count ?? 0) - 1)
      if (remainingExtras === 0) {
        await upsert(sessionId, key, 'owned', 0)
      } else {
        await upsert(sessionId, key, 'repeated', remainingExtras)
      }
    }

    const incrementSticker = async (sessionId: string, key: string, sticker?: StickerState) => {
      if (!sticker || sticker.status === 'missing') {
        await upsert(sessionId, key, 'owned', 0)
        return
      }

      if (sticker.status === 'owned') {
        await upsert(sessionId, key, 'repeated', 1)
        return
      }

      await upsert(sessionId, key, 'repeated', (sticker.repeat_count ?? 0) + 1)
    }

    // Owner loses one copy of requested sticker
    const ownerHasRequested = ownerStickers.find((s) => s.sticker_key === trade.requested_sticker_key)
    await decrementSticker(trade.owner_id, trade.requested_sticker_key, ownerHasRequested)

    // Requester gains requested sticker
    const requesterHasRequested = requesterStickers.find((s) => s.sticker_key === trade.requested_sticker_key)
    await incrementSticker(trade.requester_id, trade.requested_sticker_key, requesterHasRequested)

    // Requester loses one copy of offered sticker
    const requesterHasOffered = requesterStickers.find((s) => s.sticker_key === trade.offered_sticker_key)
    await decrementSticker(trade.requester_id, trade.offered_sticker_key, requesterHasOffered)

    // Owner gains offered sticker
    const ownerHasOffered = ownerStickers.find((s) => s.sticker_key === trade.offered_sticker_key)
    await incrementSticker(trade.owner_id, trade.offered_sticker_key, ownerHasOffered)
  },

  async cancelTradeRequest(tradeId: string): Promise<void> {
    if (isOfflineMode) throw new Error('Sin conexión')

    const { error } = await supabase
      .from('trade_requests')
      .update({ status: 'cancelled' })
      .eq('id', tradeId)

    if (error) throw error
  },
}
