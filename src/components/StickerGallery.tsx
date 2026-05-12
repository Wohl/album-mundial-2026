'use client'

import { Sticker, StickerState } from '@/types'
import { StickerCard } from './StickerCard'
import { useMemo } from 'react'

interface StickerGalleryProps {
  stickers: Sticker[]
  userStickers: StickerState[]
  onStickerClick: (stickerId: string) => void
  title?: string
}

export const StickerGallery = ({
  stickers,
  userStickers,
  onStickerClick,
  title,
}: StickerGalleryProps) => {
  const stickerMap = useMemo(() => {
    const map = new Map<string, StickerState>()
    userStickers.forEach((s) => map.set(s.sticker_key, s))
    return map
  }, [userStickers])

  return (
    <div className="w-full">
      {title && <h2 className="text-2xl font-display text-gold2 mb-6 uppercase">{title}</h2>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {stickers.map((sticker) => {
          const userState = stickerMap.get(sticker.id)
          return (
            <div 
              key={sticker.id} 
              onClick={() => onStickerClick(sticker.id)}
              className="cursor-pointer"
            >
              <StickerCard
                id={sticker.id}
                name={sticker.name}
                team={sticker.team}
                foil={sticker.foil}
                status={userState?.status || 'missing'}
                repeatCount={userState?.repeat_count || 0}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
