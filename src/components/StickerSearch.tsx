'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { StickerState } from '@/types'
import { getAllStickers, displayKey as dispKey, parseInputKey } from '@/lib/stickers'
import { StickerFlag } from '@/components/TeamFlag'

type NavTab = 'intro' | 'equipos' | 'final' | 'cocacola'

interface SearchResult {
  internalKey: string
  displayKey: string
  name: string
  category: string
  status: 'owned' | 'missing' | 'repeated'
  foil: boolean
  tab: NavTab
  teamCode?: string
  score: number
}

interface Props {
  userStickers: StickerState[]
  onNavigate: (tab: NavTab, teamCode?: string) => void
  onClose: () => void
}

// Built once at module load — avoids rebuilding on every render
const STICKER_INDEX = getAllStickers().map((s) => {
  const tab: NavTab =
    s.type === 'intro' ? 'intro'
    : s.type === 'final' ? 'final'
    : s.type === 'cocacola' ? 'cocacola'
    : 'equipos'
  const teamCode = s.type === 'regular' ? s.id.split('_')[0] : undefined
  const category =
    s.type === 'intro' ? 'Intro FWC'
    : s.type === 'final' ? 'Final FWC'
    : s.type === 'cocacola' ? 'Coca-Cola'
    : s.team ?? ''
  return { id: s.id, name: s.name, foil: s.foil, tab, teamCode, category }
})

function normalize(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s_]+/g, '_').replace(/^_|_$/g, '')
}

// Produce query variants: "MEX7" → also try "MEX_7"
function queryVariants(normalized: string): string[] {
  const vs = new Set([normalized])
  const m = normalized.match(/^([A-Z]{2,4})(\d{1,2})$/)
  if (m) vs.add(`${m[1]}_${m[2]}`)
  return Array.from(vs).filter(Boolean)
}

export function StickerSearch({ userStickers, onNavigate, onClose }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const stateMap = useMemo(() => {
    const m = new Map<string, StickerState>()
    userStickers.forEach((s) => m.set(s.sticker_key, s))
    return m
  }, [userStickers])

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = useMemo<SearchResult[]>(() => {
    const norm = normalize(query)
    if (norm.length === 0) return []
    const vs = queryVariants(norm)
    const qLC = query.trim().toLowerCase()
    const scored: Array<SearchResult & { score: number }> = []

    STICKER_INDEX.forEach(({ id, name, foil, tab, teamCode, category }) => {
      const dk = dispKey(id)
      const nameLC = name.toLowerCase()
      let score = 0

      for (const v of vs) {
        const parsed = parseInputKey(v) // 1-based user input → 0-based internal
        if (parsed === id)                                          { score = Math.max(score, 100); break }
        if (dk === v)                                               { score = Math.max(score, 95);  break }
        if (id === v)                                               { score = Math.max(score, 85);  break }
        if (id.startsWith(parsed) && parsed.length >= 2)           { score = Math.max(score, 70);  break }
        if (dk.startsWith(v) && v.length >= 2)                     { score = Math.max(score, 65);  break }
        if (id.startsWith(v) && v.length >= 2)                     { score = Math.max(score, 60);  break }
      }

      // Name / player search (min 2 chars)
      if (score === 0 && qLC.length >= 2) {
        const pos = nameLC.indexOf(qLC)
        if (pos !== -1) score = Math.max(10, 50 - pos * 0.1)
      }

      if (score === 0) return

      const state = stateMap.get(id)
      scored.push({
        internalKey: id,
        displayKey: dk,
        name,
        category,
        status: state?.status ?? 'missing',
        foil,
        tab,
        teamCode,
        score,
      })
    })

    return scored
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 12)
  }, [query, stateMap])

  const handleNavigate = useCallback((r: SearchResult) => {
    onNavigate(r.tab, r.teamCode)
    onClose()
  }, [onNavigate, onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -10 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-lg bg-surface2 border border-gold2/25 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface3">
          <span className="text-gray-500 text-base">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="MEX_7 · fwc12 · Messi · CC3 · mex7…"
            className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none"
            spellCheck={false}
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-500 hover:text-white text-sm transition"
            >
              ✕
            </button>
          )}
          <kbd className="hidden sm:block text-[10px] text-gray-600 border border-surface3 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto overscroll-contain">
          {!query.trim() && (
            <p className="text-center text-gray-600 text-xs py-8 leading-relaxed">
              Buscá por código · número · nombre de jugador
              <br />
              <span className="text-gray-700">Ej: MEX_7, mex7, FWC12, CC3, Messi</span>
            </p>
          )}

          {query.trim() && results.length === 0 && (
            <p className="text-center text-gray-600 text-xs py-8">
              Sin resultados para{' '}
              <span className="text-gray-400">&ldquo;{query}&rdquo;</span>
            </p>
          )}

          {results.map((r) => (
            <div
              key={r.internalKey}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface3 border-b border-surface3/40 last:border-0 transition"
            >
              {/* Status dot */}
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  r.status === 'owned'
                    ? 'bg-green-500'
                    : r.status === 'repeated'
                    ? 'bg-amber-500'
                    : 'bg-gray-600'
                }`}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {r.foil && <span className="text-[11px] leading-none">✨</span>}
                  <span className="font-mono text-[11px] font-bold text-gold2">
                    {r.displayKey}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      r.status === 'owned'
                        ? 'bg-green-500/20 text-green-400'
                        : r.status === 'repeated'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-700/80 text-gray-500'
                    }`}
                  >
                    {r.status === 'owned'
                      ? '✅ Tengo'
                      : r.status === 'repeated'
                      ? '🔁 Repetida'
                      : '❌ Falta'}
                  </span>
                </div>
                <div className="text-xs text-white/90 truncate mt-0.5">{r.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                  {r.teamCode && (
                    <StickerFlag stickerKey={r.internalKey} className="text-xs leading-none" />
                  )}
                  <span>{r.category}</span>
                </div>
              </div>

              {/* Navigate button */}
              <button
                onClick={() => handleNavigate(r)}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-gold2/10 hover:bg-gold2/25 text-gold2 border border-gold2/20 hover:border-gold2/40 transition"
              >
                Ver →
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-surface3 flex items-center justify-between text-[10px] text-gray-600">
          <span>
            {results.length > 0
              ? `${results.length} resultado${results.length !== 1 ? 's' : ''}`
              : '974 figuritas'}
          </span>
          <span>
            Clic en <strong className="text-gray-500">Ver →</strong> para ir a la figurita
          </span>
        </div>
      </motion.div>
    </div>
  )
}
