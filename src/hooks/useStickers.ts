'use client'

import { useState, useEffect, useCallback } from 'react'
import { StickerState, UserProgress } from '@/types'
import { stickerService } from '@/services/stickerService'

export const useStickers = (sessionId: string | null, totalStickers: number) => {
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
    if (!sessionId) return

    setLoading(true)
    try {
      const userStickers = await stickerService.getUserStickers(sessionId)
      setStickers(userStickers)
      const newProgress = stickerService.calculateProgress(userStickers, totalStickers)
      setProgress(newProgress)
    } catch (error) {
      console.error('Error loading stickers:', error)
    } finally {
      setLoading(false)
    }
  }, [sessionId, totalStickers])

  const updateSticker = useCallback(
    async (stickerKey: string, status: 'missing' | 'owned' | 'repeated', repeatCount: number = 0) => {
      if (!sessionId) return

      try {
        const updated = await stickerService.updateStickerStatus(
          sessionId,
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
    [sessionId, totalStickers]
  )

  const deleteSticker = useCallback(
    async (stickerKey: string) => {
      if (!sessionId) return

      try {
        await stickerService.deleteSticker(sessionId, stickerKey)
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
    [sessionId, totalStickers]
  )

  useEffect(() => {
    loadStickers()
  }, [loadStickers])

  return {
    stickers,
    progress,
    loading,
    updateSticker,
    deleteSticker,
    refetch: loadStickers,
  }
}
