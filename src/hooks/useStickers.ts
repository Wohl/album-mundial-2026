'use client'

import { useState, useEffect, useCallback } from 'react'
import { StickerState, UserProgress } from '@/types'
import { stickerService } from '@/services/stickerService'
import { supabase, isOfflineMode } from '@/lib/supabase'

export const useStickers = (userId: string | null, totalStickers: number) => {
  const [stickers, setStickers] = useState<StickerState[]>([])
  const [progress, setProgress] = useState<UserProgress>({
    total: totalStickers,
    owned: 0,
    missing: totalStickers,
    repeated: 0,
    percentComplete: 0,
  })
  const [loading, setLoading] = useState(false)

  const loadStickers = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const userStickers = await stickerService.getUserStickers(userId)
      setStickers(userStickers)
      const newProgress = stickerService.calculateProgress(userStickers, totalStickers)
      setProgress(newProgress)
    } catch (error) {
      console.error('Error loading stickers:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, totalStickers])

  const updateSticker = useCallback(
    async (stickerKey: string, status: 'missing' | 'owned' | 'repeated', repeatCount: number = 0) => {
      if (!userId) return

      try {
        const updated = await stickerService.updateStickerStatus(
          userId,
          stickerKey,
          status,
          repeatCount
        )

        setStickers((prev) => {
          const existing = prev.findIndex((s) => s.sticker_key === stickerKey)
          const newStickers = existing >= 0 ? [...prev] : [...prev, updated]

          if (existing >= 0) {
            newStickers[existing] = updated
          }

          const newProgress = stickerService.calculateProgress(newStickers, totalStickers)
          setProgress(newProgress)
          return newStickers
        })
      } catch (error) {
        console.error('Error updating sticker:', error)
      }
    },
    [userId, totalStickers]
  )

  const deleteSticker = useCallback(
    async (stickerKey: string) => {
      if (!userId) return

      try {
        await stickerService.deleteSticker(userId, stickerKey)
        setStickers((prev) => {
          const newStickers = prev.filter((s) => s.sticker_key !== stickerKey)
          const newProgress = stickerService.calculateProgress(newStickers, totalStickers)
          setProgress(newProgress)
          return newStickers
        })
      } catch (error) {
        console.error('Error deleting sticker:', error)
      }
    },
    [userId, totalStickers]
  )

  useEffect(() => {
    loadStickers()
  }, [loadStickers])

  useEffect(() => {
    if (!userId || isOfflineMode) return

    const channel = supabase
      .channel(`sticker_states:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sticker_states', filter: `user_id=eq.${userId}` },
        () => loadStickers()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, loadStickers])

  return {
    stickers,
    progress,
    loading,
    updateSticker,
    deleteSticker,
    refetch: loadStickers,
  }
}
