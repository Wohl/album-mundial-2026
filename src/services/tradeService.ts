import { TradeRequest, StickerState } from '@/types'
import { supabase, isOfflineMode } from '@/lib/supabase'

export type OtherUserSticker = StickerState & { owner_name: string }

function mapTradeRow(row: Record<string, unknown>): TradeRequest {
  return {
    id: row.id as string,
    requester_id: row.requester_id as string,
    requester_name: (row.requester as Record<string, string>)?.display_name ?? '',
    owner_id: row.owner_id as string,
    owner_name: (row.owner as Record<string, string>)?.display_name ?? '',
    requested_sticker_key: row.requested_sticker_key as string,
    offered_sticker_key: row.offered_sticker_key as string,
    status: row.status as TradeRequest['status'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export const tradeService = {
  async getOtherUsersRepeated(mySessionId: string): Promise<OtherUserSticker[]> {
    if (isOfflineMode) return []

    const { data, error } = await supabase
      .from('sticker_states')
      .select('*, sessions!sticker_states_session_id_fkey(display_name)')
      .eq('status', 'repeated')
      .neq('session_id', mySessionId)

    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id,
      session_id: row.session_id,
      sticker_key: row.sticker_key,
      status: row.status,
      repeat_count: row.repeat_count,
      updated_at: row.updated_at,
      owner_name: (row.sessions as Record<string, string>)?.display_name ?? '',
    }))
  },

  async getMyTrades(sessionId: string): Promise<TradeRequest[]> {
    if (isOfflineMode) return []

    const { data, error } = await supabase
      .from('trade_requests')
      .select(
        '*, requester:sessions!trade_requests_requester_id_fkey(display_name), owner:sessions!trade_requests_owner_id_fkey(display_name)'
      )
      .or(`owner_id.eq.${sessionId},requester_id.eq.${sessionId}`)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapTradeRow)
  },

  async getUserMissingStickers(targetSessionId: string): Promise<string[]> {
    if (isOfflineMode) return []
    const { data, error } = await supabase
      .from('sticker_states')
      .select('sticker_key')
      .eq('session_id', targetSessionId)
      .eq('status', 'missing')
    if (error) return []
    return (data ?? []).map((r) => r.sticker_key)
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
      .insert({ requester_id: requesterId, owner_id: ownerId, requested_sticker_key: requestedKey, offered_sticker_key: offeredKey })
      .select(
        '*, requester:sessions!trade_requests_requester_id_fkey(display_name), owner:sessions!trade_requests_owner_id_fkey(display_name)'
      )
      .single()

    if (error) throw error
    return mapTradeRow(data as Record<string, unknown>)
  },

  async respondToTrade(
    tradeId: string,
    response: 'accepted' | 'rejected',
    trade: TradeRequest,
    ownerStickers: StickerState[],
    requesterStickers: StickerState[]
  ): Promise<void> {
    if (isOfflineMode) throw new Error('Sin conexión')

    const { error } = await supabase
      .from('trade_requests')
      .update({ status: response })
      .eq('id', tradeId)

    if (error) throw error

    if (response !== 'accepted') return

    const upsertSticker = (sessionId: string, key: string, status: StickerState['status'], count: number) =>
      supabase
        .from('sticker_states')
        .upsert([{ session_id: sessionId, sticker_key: key, status, repeat_count: count }], {
          onConflict: 'session_id,sticker_key',
        })

    const ownerHasRequested = ownerStickers.find((s) => s.sticker_key === trade.requested_sticker_key)
    const newOwnerCount = Math.max(0, (ownerHasRequested?.repeat_count ?? 1) - 1)
    await upsertSticker(
      trade.owner_id,
      trade.requested_sticker_key,
      newOwnerCount === 0 ? 'owned' : 'repeated',
      newOwnerCount
    )

    const requesterHasRequested = requesterStickers.find((s) => s.sticker_key === trade.requested_sticker_key)
    const reqGainCount =
      requesterHasRequested?.status === 'repeated'
        ? (requesterHasRequested.repeat_count ?? 0) + 1
        : requesterHasRequested?.status === 'owned'
        ? 1
        : 0
    const reqGainStatus =
      !requesterHasRequested || requesterHasRequested.status === 'missing' ? 'owned' : 'repeated'
    await upsertSticker(trade.requester_id, trade.requested_sticker_key, reqGainStatus, reqGainCount)

    const requesterHasOffered = requesterStickers.find((s) => s.sticker_key === trade.offered_sticker_key)
    const newRequesterCount = Math.max(0, (requesterHasOffered?.repeat_count ?? 1) - 1)
    await upsertSticker(
      trade.requester_id,
      trade.offered_sticker_key,
      newRequesterCount === 0 ? 'owned' : 'repeated',
      newRequesterCount
    )

    const ownerHasOffered = ownerStickers.find((s) => s.sticker_key === trade.offered_sticker_key)
    const ownerGainCount =
      ownerHasOffered?.status === 'repeated'
        ? (ownerHasOffered.repeat_count ?? 0) + 1
        : ownerHasOffered?.status === 'owned'
        ? 1
        : 0
    const ownerGainStatus =
      !ownerHasOffered || ownerHasOffered.status === 'missing' ? 'owned' : 'repeated'
    await upsertSticker(trade.owner_id, trade.offered_sticker_key, ownerGainStatus, ownerGainCount)
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
