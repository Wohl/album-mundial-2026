'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSession } from '@/hooks/useSession'
import { useStickers } from '@/hooks/useStickers'
import { useTrades } from '@/hooks/useTrades'
import { WelcomeModal } from '@/components/WelcomeModal'
import { ProgressBar } from '@/components/ProgressBar'
import { StickerGallery } from '@/components/StickerGallery'
import { TeamOverview } from '@/components/TeamOverview'
import { MarketplaceView } from '@/components/MarketplaceView'
import { StatsPanel } from '@/components/StatsPanel'
import { BulkEntryModal } from '@/components/BulkEntryModal'
import { getAllStickers, getTotalStickers } from '@/lib/stickers'
import { INTRO_STICKERS, TEAMS } from '@/stickers'
import type { Sticker } from '@/types'

type Tab = 'portada' | 'equipos' | 'todo' | 'repetidas' | 'stats' | 'market'

export default function Home() {
  const { session, loading: sessionLoading, createSession } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('equipos')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [showBulk, setShowBulk] = useState(false)

  const totalStickers = getTotalStickers()
  const { stickers, progress, loading, updateSticker } = useStickers(session?.id || null, totalStickers)
  const {
    trades,
    othersRepeated,
    loading: tradesLoading,
    pendingIncoming,
    createTrade,
    respondToTrade,
    cancelTrade,
  } = useTrades(session?.id || null, stickers)

  const handleCreateSession = useCallback(
    async (name: string) => {
      try { await createSession(name) } catch (e) { console.error(e) }
    },
    [createSession]
  )

  const handleUpdateSticker = useCallback(
    (key: string, status: 'owned' | 'missing' | 'repeated', count: number = 0) => {
      if (session?.id) updateSticker(key, status, count)
    },
    [session?.id, updateSticker]
  )

  const handleBulkMark = useCallback(
    (ids: string[]) => {
      ids.forEach((id) => handleUpdateSticker(id, 'owned', 0))
    },
    [handleUpdateSticker]
  )

  const allStickers = useMemo(() => getAllStickers(), [])

  const introStickers = useMemo<Sticker[]>(() =>
    INTRO_STICKERS.map((s) => ({ id: s.id, name: s.name, type: 'intro', foil: s.foil })),
    []
  )

  const selectedTeamStickers = useMemo<Sticker[]>(() => {
    if (!selectedTeam) return []
    const team = TEAMS.find((t) => t.code === selectedTeam)
    if (!team) return []
    return Array.from({ length: 20 }, (_, i) => ({
      id: `${team.code}_${i}`,
      name: team.players[i] ?? `Jugador ${i + 1}`,
      team: team.name,
      type: 'regular' as const,
      foil: i === 0,
    }))
  }, [selectedTeam])

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold2 text-2xl font-display uppercase">Cargando...</div>
      </div>
    )
  }

  if (!session) return <WelcomeModal onSubmit={handleCreateSession} />

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'portada',  label: 'Portada'    },
    { id: 'equipos',  label: 'Equipos'    },
    { id: 'todo',     label: 'Todo'       },
    { id: 'repetidas',label: 'Repetidas'  },
    { id: 'stats',    label: 'Stats'      },
    { id: 'market',   label: 'Mercado', badge: pendingIncoming },
  ]

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'equipos') setSelectedTeam(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark via-surface to-dark">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 bg-surface2/95 backdrop-blur border-b border-gold2/20 py-3 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display text-gold2 uppercase leading-none">Álbum</h1>
              <p className="text-gray-500 text-xs">Mundial 2026</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBulk(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface3 hover:bg-gray-600 text-gray-300 border border-surface3 transition"
              >
                + Entrada rápida
              </button>
              <div className="text-right">
                <p className="text-xs text-gray-400">Hola,</p>
                <p className="font-bold text-gold2 text-sm leading-tight">{session.display_name}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Progress bar — solo en tabs de álbum */}
        {activeTab !== 'market' && activeTab !== 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <ProgressBar progress={progress} />
          </motion.div>
        )}

        {/* Tab nav */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative px-4 py-2 rounded-lg font-semibold uppercase text-xs transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gold to-gold2 text-dark shadow-md shadow-gold/20'
                  : 'bg-surface2 text-gray-400 hover:bg-surface3 border border-surface3'
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[1.1rem] px-1 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* PORTADA */}
          {activeTab === 'portada' && !loading && (
            <StickerGallery
              stickers={introStickers}
              userStickers={stickers}
              onUpdateSticker={handleUpdateSticker}
              title="Portada e introducción"
            />
          )}

          {/* EQUIPOS */}
          {activeTab === 'equipos' && !loading && (
            <div className="space-y-6">
              {selectedTeam ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
                    >
                      ← Volver
                    </button>
                    <span className="text-gray-600">·</span>
                    <span className="text-sm font-semibold text-white">
                      {TEAMS.find((t) => t.code === selectedTeam)?.flag}{' '}
                      {TEAMS.find((t) => t.code === selectedTeam)?.name}
                    </span>
                  </div>
                  <StickerGallery
                    stickers={selectedTeamStickers}
                    userStickers={stickers}
                    onUpdateSticker={handleUpdateSticker}
                  />
                </div>
              ) : (
                <TeamOverview
                  userStickers={stickers}
                  selectedTeam={selectedTeam}
                  onSelectTeam={setSelectedTeam}
                />
              )}
            </div>
          )}

          {/* TODO */}
          {activeTab === 'todo' && !loading && (
            <StickerGallery
              stickers={allStickers}
              userStickers={stickers}
              onUpdateSticker={handleUpdateSticker}
              title="Todas las figuritas"
            />
          )}

          {/* REPETIDAS */}
          {activeTab === 'repetidas' && !loading && (
            <StickerGallery
              stickers={allStickers}
              userStickers={stickers}
              onUpdateSticker={handleUpdateSticker}
              defaultFilter="repeated"
              title="Mis repetidas"
            />
          )}

          {/* STATS */}
          {activeTab === 'stats' && (
            <StatsPanel progress={progress} stickers={stickers} />
          )}

          {/* MERCADO */}
          {activeTab === 'market' && (
            <MarketplaceView
              sessionId={session.id}
              myStickers={stickers}
              trades={trades}
              othersRepeated={othersRepeated}
              loading={tradesLoading}
              onCreateTrade={createTrade}
              onRespondToTrade={respondToTrade}
              onCancelTrade={cancelTrade}
            />
          )}

          {/* Loading */}
          {loading && activeTab !== 'market' && activeTab !== 'stats' && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-xl font-display">Cargando figuritas...</div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Bulk entry modal */}
      {showBulk && (
        <BulkEntryModal onConfirm={handleBulkMark} onClose={() => setShowBulk(false)} />
      )}
    </div>
  )
}
