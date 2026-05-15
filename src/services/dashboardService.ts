import { supabase } from '@/lib/supabase'

export interface RankEntry {
  userId: string
  displayName: string
  ownedCount: number
  extraCount: number
  tradesCount: number
  packsCount: number
  pct: number
}

export interface GlobalStats {
  totalUsers: number
  totalOwned: number
  totalTrades: number
  totalPacks: number
}

export interface StickerHeat {
  key: string
  count: number
}

export interface FeedItem {
  id: string
  requesterName: string
  ownerName: string
  stickerKeys: string[]
  at: string
}

export interface UserCount {
  user_id: string
  owned_count: number
  extra_count: number
}

export async function fetchUserCounts(): Promise<UserCount[]> {
  try {
    const { data, error } = await supabase.rpc('dashboard_user_counts')
    if (error) return []
    return (data ?? []) as UserCount[]
  } catch {
    return []
  }
}

export async function fetchAllProfiles(): Promise<{ id: string; name: string }[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name')
    if (error) return []
    return (data ?? []).map(d => ({ id: d.id, name: (d.display_name as string) ?? 'Usuario' }))
  } catch {
    return []
  }
}

export async function fetchRecentTrades(limit = 15): Promise<FeedItem[]> {
  try {
    const { data, error } = await supabase
      .from('trade_requests')
      .select('id, requester_name, owner_name, offered_sticker_keys, requested_sticker_keys, updated_at')
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return (data ?? []).map(d => ({
      id: d.id as string,
      requesterName: (d.requester_name as string) ?? 'Usuario',
      ownerName: (d.owner_name as string) ?? 'Usuario',
      stickerKeys: [
        ...((d.offered_sticker_keys as string[]) ?? []),
        ...((d.requested_sticker_keys as string[]) ?? []),
      ].slice(0, 6),
      at: d.updated_at as string,
    }))
  } catch {
    return []
  }
}

export async function fetchPacksPerUser(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('pack_items')
      .select('owner_id')
      .not('opened_at', 'is', null)
    if (error) return {}
    const m: Record<string, number> = {}
    ;(data ?? []).forEach((d: { owner_id: string }) => {
      m[d.owner_id] = (m[d.owner_id] ?? 0) + 1
    })
    return m
  } catch {
    return {}
  }
}

export async function fetchTradesPerUser(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('trade_requests')
      .select('requester_id, owner_id')
      .eq('status', 'accepted')
    if (error) return {}
    const m: Record<string, number> = {}
    ;(data ?? []).forEach((d: { requester_id: string; owner_id: string }) => {
      if (d.requester_id) m[d.requester_id] = (m[d.requester_id] ?? 0) + 1
      if (d.owner_id) m[d.owner_id] = (m[d.owner_id] ?? 0) + 1
    })
    return m
  } catch {
    return {}
  }
}

export async function fetchMostWanted(limit = 6): Promise<StickerHeat[]> {
  try {
    const { data, error } = await supabase.rpc('dashboard_wanted_stickers', { lmt: limit })
    if (error) return []
    return (data ?? []).map((d: { sticker_key: string; cnt: number }) => ({
      key: d.sticker_key,
      count: d.cnt,
    }))
  } catch {
    return []
  }
}

export async function fetchMostAvailable(limit = 6): Promise<StickerHeat[]> {
  try {
    const { data, error } = await supabase.rpc('dashboard_available_stickers', { lmt: limit })
    if (error) return []
    return (data ?? []).map((d: { sticker_key: string; cnt: number }) => ({
      key: d.sticker_key,
      count: d.cnt,
    }))
  } catch {
    return []
  }
}
