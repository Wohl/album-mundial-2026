'use client'

import { useState, useMemo } from 'react'
import { Sticker, StickerState } from '@/types'
import { StickerCard } from './StickerCard'

type StatusFilter = 'all' | 'owned' | 'repeated' | 'missing'

interface StickerGalleryProps {
  stickers: Sticker[]
  userStickers: StickerState[]
  onUpdateSticker: (key: string, status: 'owned' | 'missing' | 'repeated', count?: number) => void
  defaultFilter?: StatusFilter
  title?: string
}

export const StickerGallery = ({
  stickers,
  userStickers,
  onUpdateSticker,
  defaultFilter = 'all',
  title,
}: StickerGalleryProps) => {
  const [filter, setFilter] = useState<StatusFilter>(defaultFilter)
  const [search, setSearch] = useState('')

  const stickerMap = useMemo(() => {
    const map = new Map<string, StickerState>()
    userStickers.forEach((s) => map.set(s.sticker_key, s))
    return map
  }, [userStickers])

  const counts = useMemo(() => {
    let owned = 0, repeated = 0, missing = 0
    stickers.forEach((s) => {
      const st = stickerMap.get(s.id)?.status ?? 'missing'
      if (st === 'owned') owned++
      else if (st === 'repeated') repeated++
      else missing++
    })
    return { owned, repeated, missing, all: stickers.length }
  }, [stickers, stickerMap])

  const displayed = useMemo(() => {
    const q = search.toLowerCase().trim()
    return stickers.filter((s) => {
      const status = stickerMap.get(s.id)?.status ?? 'missing'
      if (filter !== 'all' && status !== filter) return false
      if (!q) return true
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.team?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [stickers, stickerMap, filter, search])

  const filterBtns: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all',      label: 'Todas',      count: counts.all     },
    { id: 'owned',    label: 'Tengo',      count: counts.owned   },
    { id: 'repeated', label: 'Repetidas',  count: counts.repeated},
    { id: 'missing',  label: 'Me faltan',  count: counts.missing },
  ]

  const countColors: Record<StatusFilter, string> = {
    all:      'text-gray-300',
    owned:    'text-blue-400',
    repeated: 'text-amber-400',
    missing:  'text-red-400',
  }

  return (
    <div className="w-full space-y-4">
      {title && <h2 className="text-xl font-display text-gold2 uppercase">{title}</h2>}

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterBtns.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border shrink-0 ${
              filter === btn.id
                ? 'bg-gold2 text-dark border-gold2 shadow-sm shadow-gold2/30'
                : 'bg-surface2 border-surface3 hover:border-gold2/40 text-gray-300'
            }`}
          >
            {btn.label}
            <span className={`font-bold ${filter === btn.id ? 'text-dark/70' : countColors[btn.id]}`}>
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface2 border border-surface3 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold2/50 transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Results */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm">No hay figuritas que coincidan</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {displayed.map((sticker) => {
              const userState = stickerMap.get(sticker.id)
              return (
                <StickerCard
                  key={sticker.id}
                  id={sticker.id}
                  name={sticker.name}
                  team={sticker.team}

                  foil={sticker.foil}
                  status={userState?.status ?? 'missing'}
                  repeatCount={userState?.repeat_count ?? 0}
                  onMark={(status, count = 0) => onUpdateSticker(sticker.id, status, count)}
                />
              )
            })}
          </div>
          {(search || filter !== 'all') && (
            <p className="text-xs text-gray-600 text-center pt-2">
              {displayed.length} de {stickers.length} figuritas
            </p>
          )}
        </>
      )}
    </div>
  )
}
