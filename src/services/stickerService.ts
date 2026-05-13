import { StickerState, UserProgress } from '@/types'
import { supabase, isOfflineMode } from '@/lib/supabase'
import { localStorageService } from '@/lib/localStorage'

export const stickerService = {
  async getUserStickers(userId: string): Promise<StickerState[]> {
    if (isOfflineMode) {
      return localStorageService.getStickers()
    }

    try {
      const { data, error } = await supabase
        .from('sticker_states')
        .select()
        .eq('user_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching stickers:', error)
      return []
    }
  },

  async updateStickerStatus(
    userId: string,
    stickerKey: string,
    status: 'missing' | 'owned' | 'repeated',
    repeatCount: number = 0
  ): Promise<StickerState> {
    const sticker: StickerState = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      user_id: userId,
      sticker_key: stickerKey,
      status,
      repeat_count: repeatCount,
      updated_at: new Date().toISOString(),
    }

    if (isOfflineMode) {
      localStorageService.updateSticker(sticker)
      return sticker
    }

    try {
      const { data, error } = await supabase
        .from('sticker_states')
        .upsert(
          [{ user_id: userId, sticker_key: stickerKey, status, repeat_count: repeatCount }],
          { onConflict: 'user_id,sticker_key' }
        )
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating sticker:', error)
      throw error
    }
  },

  async deleteSticker(userId: string, stickerKey: string): Promise<void> {
    if (isOfflineMode) {
      const stickers = localStorageService.getStickers()
      const filtered = stickers.filter(
        (s) => !(s.user_id === userId && s.sticker_key === stickerKey)
      )
      localStorageService.setStickers(filtered)
      return
    }

    try {
      await supabase
        .from('sticker_states')
        .delete()
        .eq('user_id', userId)
        .eq('sticker_key', stickerKey)
    } catch (error) {
      console.error('Error deleting sticker:', error)
    }
  },

  calculateProgress(stickers: StickerState[], total: number): UserProgress {
    const owned = stickers.filter((s) => s.status === 'owned' || s.status === 'repeated').length
    const repeated = stickers.reduce(
      (sum, s) => sum + (s.status === 'repeated' ? (s.repeat_count ?? 0) : 0),
      0
    )
    const missing = total - owned

    return {
      total,
      owned,
      missing,
      repeated,
      percentComplete: total > 0 ? (owned / total) * 100 : 0,
    }
  },
}
