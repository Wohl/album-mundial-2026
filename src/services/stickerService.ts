import { StickerState, UserProgress } from '@/types'
import { supabase, isOfflineMode } from '@/lib/supabase'
import { localStorageService } from '@/lib/localStorage'

export const stickerService = {
  async getUserStickers(sessionId: string): Promise<StickerState[]> {
    if (isOfflineMode) {
      return localStorageService.getStickers()
    }

    try {
      const { data, error } = await supabase
        .from('sticker_states')
        .select()
        .eq('session_id', sessionId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching stickers:', error)
      return []
    }
  },

  async updateStickerStatus(
    sessionId: string,
    stickerKey: string,
    status: 'missing' | 'owned' | 'repeated',
    repeatCount: number = 0
  ): Promise<StickerState> {
    const sticker: StickerState = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      session_id: sessionId,
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
          [{ session_id: sessionId, sticker_key: stickerKey, status, repeat_count: repeatCount }],
          { onConflict: 'session_id,sticker_key' }
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

  async deleteSticker(sessionId: string, stickerKey: string): Promise<void> {
    if (isOfflineMode) {
      const stickers = localStorageService.getStickers()
      const filtered = stickers.filter(
        (s) => !(s.session_id === sessionId && s.sticker_key === stickerKey)
      )
      localStorageService.setStickers(filtered)
      return
    }

    try {
      await supabase
        .from('sticker_states')
        .delete()
        .eq('session_id', sessionId)
        .eq('sticker_key', stickerKey)
    } catch (error) {
      console.error('Error deleting sticker:', error)
    }
  },

  calculateProgress(stickers: StickerState[], total: number): UserProgress {
    // owned = stickers you have (unique + those with extras)
    const owned = stickers.filter((s) => s.status === 'owned' || s.status === 'repeated').length
    // repeated = number of sticker types with extras
    const repeated = stickers.filter((s) => s.status === 'repeated').length
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
