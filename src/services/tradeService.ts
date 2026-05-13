import { TradeRequest, StickerState } from '@/types'
import { supabase, isOfflineMode } from '@/lib/supabase'

export type OtherUserSticker = StickerState & { owner_name: string }

async function fetchProfileNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ids)
  const map = new Map<string, string>()
  ;(data ?? []).forEach((p: { id: string; display_name: string }) => map.set(p.id, p.display_name))
  return map
}

export const tradeService = {
  async getOtherUsersRepeated(myUserId: string): Promise<OtherUserSticker[]> {
    if (isOfflineMode) return []

    const { data, error } = await supabase
      .from('sticker_states')
      .select('id, user_id, sticker_key, status, repeat_count, updated_at')
      .eq('status', 'repeated')
      .neq('user_id', myUserId)

    if (error) { console.error('getOtherUsersRepeated:', error); return [] }
    if (!data || data.length === 0) return []

    const userIds = Array.from(new Set(data.map((r) => r.user_id as string)))
    const names = await fetchProfileNames(userIds)

    return data.map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      sticker_key: row.sticker_key as string,
      status: row.status as StickerState['status'],
      repeat_count: row.repeat_count as number,
      updated_at: row.updated_at as string,
      owner_name: names.get(row.user_id as string) ?? '',
    }))
  },

  async getMyTrades(userId: string): Promise<TradeRequest[]> {
    if (isOfflineMode) return []

    const { data, error } = await supabase
      .from('trade_requests')
      .select('id, requester_id, owner_id, requested_sticker_key, offered_sticker_key, status, created_at, updated_at')
      .or(`owner_id.eq.${userId},requester_id.eq.${userId}`)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    if (error) { console.error('getMyTrades:', error); return [] }
    if (!data || data.length === 0) return []

    const userIds = Array.from(
      new Set(data.flatMap((t) => [t.requester_id as string, t.owner_id as string]))
    )
    const names = await fetchProfileNames(userIds)

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

  async getUserMissingStickers(targetUserId: string): Promise<string[]> {
    if (isOfflineMode) return []
    const { data, error } = await supabase
      .from('sticker_states')
      .select('sticker_key')
      .eq('user_id', targetUserId)
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

    const names = await fetchProfileNames([requesterId, ownerId])

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

  async respondToTrade(tradeId: string, response: 'accepted' | 'rejected'): Promise<void> {
    if (isOfflineMode) throw new Error('Sin conexión')

    if (response === 'accepted') {
      // Atomic swap via DB function — bypasses RLS for both users' stickers
      const { error } = await supabase.rpc('accept_trade', { p_trade_id: tradeId })
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('trade_requests')
        .update({ status: response })
        .eq('id', tradeId)
      if (error) throw error
    }
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
