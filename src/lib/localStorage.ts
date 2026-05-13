import { StickerState } from '@/types'

const STICKERS_KEY = 'album_stickers'

export const localStorageService = {
  getStickers: (): StickerState[] => {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STICKERS_KEY)
    return data ? JSON.parse(data) : []
  },

  setStickers: (stickers: StickerState[]) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STICKERS_KEY, JSON.stringify(stickers))
  },

  updateSticker: (sticker: StickerState) => {
    if (typeof window === 'undefined') return
    const stickers = localStorageService.getStickers()
    const index = stickers.findIndex((s) => s.sticker_key === sticker.sticker_key)
    if (index >= 0) {
      stickers[index] = sticker
    } else {
      stickers.push(sticker)
    }
    localStorageService.setStickers(stickers)
  },

  clear: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STICKERS_KEY)
  },
}
