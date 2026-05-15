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

  const filterBtns: { id: StatusFilter; label: string; count: number; color: string; activeColor: string }[] = [
    { id: 'all',      label: 'Todas',     count: counts.all,      color: 'text-gray-500',   activeColor: 'text-dark'       },
    { id: 'owned',    label: 'Tengo',     count: counts.owned,    color: 'text-green-500',  activeColor: 'text-green-900'  },
    { id: 'repeated', label: 'Repetidas', count: counts.repeated, color: 'text-amber-400',  activeColor: 'text-amber-900'  },
    { id: 'missing',  label: 'Me faltan', count: counts.missing,  color: 'text-red-400',    activeColor: 'text-red-900'    },
  ]

  const activeBg: Record<StatusFilter, string> = {
    all:      'bg-gradient-to-r from-gold to-gold2 border-gold2',
    owned:    'bg-green-500 border-green-400',
    repeated: 'bg-amber-500 border-amber-400',
    missing:  'bg-red-500 border-red-400',
  }

  return (
    <div className="w-full space-y-4">
      {title && (
        <h2 className="text-xl font-display text-gold2 uppercase tracking-wide">{title}</h2>
      )}

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterBtns.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
              filter === btn.id
                ? `${activeBg[btn.id]} text-white shadow-md`
                : 'bg-surface2 border-surface3 hover:border-surface4 hover:bg-surface3 text-gray-500 hover:text-gray-200'
            }`}
          >
            {btn.label}
            <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
              filter === btn.id
                ? 'bg-black/20 text-white'
                : `${btn.color} bg-surface3`
            }`}>
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm select-none">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre, código o equipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface2 border border-surface3 focus:border-gold2/40 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 text-xl leading-none transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Results */}
      {displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <div className="text-5xl mb-4 opacity-30">🔍</div>
          <p className="text-sm font-display tracking-wide uppercase">No hay figuritas que coincidan</p>
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
            <p className="text-xs text-gray-700 text-center pt-2 font-mono">
              {displayed.length} / {stickers.length} figuritas
            </p>
          )}
        </>
      )}
    </div>
  )
}
