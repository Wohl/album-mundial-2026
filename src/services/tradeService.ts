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

const TRADE_SELECT = [
  'id', 'requester_id', 'owner_id',
  'requested_sticker_key', 'offered_sticker_key',
  'requested_sticker_keys', 'offered_sticker_keys',
  'counter_requested_keys', 'counter_offered_keys', 'counter_by',
  'status', 'created_at', 'updated_at',
].join(', ')

function rowToTrade(row: Record<string, unknown>, names: Map<string, string>): TradeRequest {
  const reqKey = (row.requested_sticker_key as string) ?? ''
  const offKey = (row.offered_sticker_key as string) ?? ''
  const reqKeys = (row.requested_sticker_keys as string[] | null) ?? (reqKey ? [reqKey] : [])
  const offKeys = (row.offered_sticker_keys as string[] | null) ?? (offKey ? [offKey] : [])
  return {
    id: row.id as string,
    requester_id: row.requester_id as string,
    requester_name: names.get(row.requester_id as string) ?? '',
    owner_id: row.owner_id as string,
    owner_name: names.get(row.owner_id as string) ?? '',
    requested_sticker_key: reqKey,
    offered_sticker_key: offKey,
    requested_sticker_keys: reqKeys,
    offered_sticker_keys: offKeys,
    counter_requested_keys: (row.counter_requested_keys as string[] | null) ?? null,
    counter_offered_keys: (row.counter_offered_keys as string[] | null) ?? null,
    counter_by: (row.counter_by as string | null) ?? null,
    status: row.status as TradeRequest['status'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
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
      .select(TRADE_SELECT)
      .or(`owner_id.eq.${userId},requester_id.eq.${userId}`)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    if (error) { console.error('getMyTrades:', error); return [] }
    if (!data || data.length === 0) return []

    const rows = data as unknown as Record<string, unknown>[]
    const userIds = Array.from(
      new Set(rows.flatMap((t) => [t.requester_id as string, t.owner_id as string]))
    )
    const names = await fetchProfileNames(userIds)
    return rows.map((row) => rowToTrade(row, names))
  },

  // Returns which of the candidate keys the target user does NOT own or repeat (their implicit missing)
  async getUserMissingFromList(targetUserId: string, candidateKeys: string[]): Promise<string[]> {
    if (candidateKeys.length === 0 || isOfflineMode) return []
    const { data } = await supabase
      .from('sticker_states')
      .select('sticker_key')
      .eq('user_id', targetUserId)
      .in('sticker_key', candidateKeys)
      .in('status', ['owned', 'repeated'])
    const owned = new Set((data ?? []).map((r) => r.sticker_key as string))
    return candidateKeys.filter((k) => !owned.has(k))
  },

  async createTradeRequest(
    requesterId: string,
    ownerId: string,
    requestedKeys: string[],
    offeredKeys: string[]
  ): Promise<TradeRequest> {
    if (isOfflineMode) throw new Error('Sin conexión')
    if (requestedKeys.length === 0 || offeredKeys.length === 0) {
      throw new Error('Seleccioná al menos una figurita de cada lado')
    }

    const { data, error } = await supabase
      .from('trade_requests')
      .insert({
        requester_id: requesterId,
        owner_id: ownerId,
        requested_sticker_key: requestedKeys[0],
        offered_sticker_key: offeredKeys[0],
        requested_sticker_keys: requestedKeys,
        offered_sticker_keys: offeredKeys,
      })
      .select(TRADE_SELECT)
      .single()

    if (error) throw error

    const names = await fetchProfileNames([requesterId, ownerId])
    return rowToTrade(data as unknown as Record<string, unknown>, names)
  },

  async respondToTrade(tradeId: string, response: 'accepted' | 'rejected'): Promise<void> {
    if (isOfflineMode) throw new Error('Sin conexión')

    if (response === 'accepted') {
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

  async counterTrade(
    tradeId: string,
    counterRequestedKeys: string[],
    counterOfferedKeys: string[]
  ): Promise<void> {
    if (isOfflineMode) throw new Error('Sin conexión')
    const { error } = await supabase.rpc('counter_trade', {
      p_trade_id: tradeId,
      p_counter_requested_keys: counterRequestedKeys,
      p_counter_offered_keys: counterOfferedKeys,
    })
    if (error) throw error
  },

  // Returns Map<userId, Set<stickerKey>> of stickers each user already owns or repeats
  // Only checks the given candidateKeys (my repeated stickers) for efficiency
  async getMultipleUsersOwned(userIds: string[], candidateKeys: string[]): Promise<Map<string, Set<string>>> {
    if (userIds.length === 0 || candidateKeys.length === 0 || isOfflineMode) return new Map()
    const { data, error } = await supabase
      .from('sticker_states')
      .select('user_id, sticker_key')
      .in('user_id', userIds)
      .in('sticker_key', candidateKeys)
      .in('status', ['owned', 'repeated'])
    if (error) return new Map()
    const map = new Map<string, Set<string>>()
    ;(data ?? []).forEach((r) => {
      const uid = r.user_id as string
      if (!map.has(uid)) map.set(uid, new Set())
      map.get(uid)!.add(r.sticker_key as string)
    })
    return map
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
