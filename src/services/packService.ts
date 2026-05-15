import { supabase, isOfflineMode } from '@/lib/supabase'

export interface PackItem {
  id: string
  owner_id: string
  sticker_key: string
  trade_id: string | null
  created_at: string
}

export const packService = {
  async addItems(ownerId: string, tradeId: string, stickerKeys: string[]): Promise<void> {
    if (isOfflineMode || stickerKeys.length === 0) return
    const rows = stickerKeys.map((key) => ({
      owner_id: ownerId,
      sticker_key: key,
      trade_id: tradeId,
    }))
    const { error } = await supabase.from('pack_items').insert(rows)
    if (error) console.error('packService.addItems:', error)
  },

  async getUnopenedItems(ownerId: string): Promise<PackItem[]> {
    if (isOfflineMode) return []
    const { data, error } = await supabase
      .from('pack_items')
      .select('id, owner_id, sticker_key, trade_id, created_at')
      .eq('owner_id', ownerId)
      .is('opened_at', null)
      .order('created_at', { ascending: true })
    if (error) { console.error('packService.getUnopenedItems:', error); return [] }
    return (data ?? []) as PackItem[]
  },

  async markOpened(itemIds: string[]): Promise<void> {
    if (isOfflineMode || itemIds.length === 0) return
    const { error } = await supabase
      .from('pack_items')
      .update({ opened_at: new Date().toISOString() })
      .in('id', itemIds)
    if (error) console.error('packService.markOpened:', error)
  },
}
