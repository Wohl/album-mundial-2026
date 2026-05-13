'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useStickers } from '@/hooks/useStickers'
import { useTrades } from '@/hooks/useTrades'
import { AuthModal } from '@/components/AuthModal'
import { ProgressBar } from '@/components/ProgressBar'
import { StickerGallery } from '@/components/StickerGallery'
import { TeamOverview } from '@/components/TeamOverview'
import { MarketplaceView } from '@/components/MarketplaceView'
import { StatsPanel } from '@/components/StatsPanel'
import { BulkEntryModal } from '@/components/BulkEntryModal'
import { TeamFlag } from '@/components/TeamFlag'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import {
  getAllStickers,
  getTotalStickers,
} from '@/lib/stickers'
import { INTRO_FWC_STICKERS, FINAL_FWC_STICKERS, COCA_COLA_STICKERS, TEAMS } from '@/stickers'
import type { Sticker } from '@/types'

type Tab = 'intro' | 'equipos' | 'final' | 'cocacola' | 'repetidas' | 'stats' | 'market'

type GlobalToast = { id: number; msg: string }

export default function Home() {
  const { userId, profile, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('equipos')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [globalToasts, setGlobalToasts] = useState<GlobalToast[]>([])
  const globalToastId = useRef(0)
  const prevPendingRef = useRef(0)
  const prevMatchesRef = useRef(0)

  const totalStickers = getTotalStickers()
  const { stickers, progress, loading, updateSticker, refetch: refetchStickers } = useStickers(userId, totalStickers)
  const {
    trades,
    othersRepeated,
    othersOwned,
    matches,
    loading: tradesLoading,
    pendingIncoming,
    createTrade,
    respondToTrade,
    counterTrade,
    cancelTrade,
  } = useTrades(userId, stickers, refetchStickers)

  const pushGlobalToast = useCallback((msg: string) => {
    const id = ++globalToastId.current
    setGlobalToasts((prev) => [...prev, { id, msg }])
    setTimeout(() => setGlobalToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }, [])

  useEffect(() => {
    if (pendingIncoming > prevPendingRef.current && activeTab !== 'market') {
      pushGlobalToast('Nueva solicitud de intercambio recibida')
    }
    prevPendingRef.current = pendingIncoming
  }, [pendingIncoming, activeTab, pushGlobalToast])

  useEffect(() => {
    if (matches.length > prevMatchesRef.current && prevMatchesRef.current > 0 && activeTab !== 'market') {
      pushGlobalToast('Nuevo match encontrado — hay alguien compatible')
    }
    prevMatchesRef.current = matches.length
  }, [matches.length, activeTab, pushGlobalToast])

  const handleUpdateSticker = useCallback(
    (key: string, status: 'owned' | 'missing' | 'repeated', count: number = 0) => {
      if (userId) updateSticker(key, status, count)
    },
    [userId, updateSticker]
  )

  const handleBulkMark = useCallback(
    (ids: string[]) => {
      ids.forEach((id) => handleUpdateSticker(id, 'owned', 0))
    },
    [handleUpdateSticker]
  )

  const allStickers = useMemo(() => getAllStickers(), [])

  const introFWCStickers = useMemo<Sticker[]>(() =>
    INTRO_FWC_STICKERS.map((s) => ({ id: s.id, name: s.name, type: 'intro', foil: s.foil })),
    []
  )

  const finalFWCStickers = useMemo<Sticker[]>(() =>
    FINAL_FWC_STICKERS.map((s) => ({ id: s.id, name: s.name, type: 'final', foil: s.foil })),
    []
  )

  const cocaColaStickers = useMemo<Sticker[]>(() =>
    COCA_COLA_STICKERS.map((s) => ({ id: s.id, name: s.name, type: 'cocacola', foil: s.foil })),
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold2 text-2xl font-display uppercase">Cargando...</div>
      </div>
    )
  }

  if (!userId || !profile) {
    return <AuthModal onSignIn={signIn} onSignUp={signUp} />
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'intro',     label: 'Intro FWC'  },
    { id: 'equipos',   label: 'Equipos'    },
    { id: 'final',     label: 'Final FWC'  },
    { id: 'cocacola',  label: 'Coca-Cola'  },
    { id: 'repetidas', label: 'Repetidas'  },
    { id: 'stats',     label: 'Stats'      },
    { id: 'market',    label: 'Mercado', badge: pendingIncoming },
  ]

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'equipos') setSelectedTeam(null)
  }

  const selectedTeamData = selectedTeam ? TEAMS.find((t) => t.code === selectedTeam) : null

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
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 rounded-lg bg-surface3 hover:bg-gray-600 text-gray-300 border border-surface3 transition"
                title="Actividad de intercambios"
              >
                🔔
                {pendingIncoming > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center">
                    {pendingIncoming}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Hola,</p>
                  <p className="font-bold text-gold2 text-sm leading-tight">{profile.display_name}</p>
                </div>
                <button
                  onClick={signOut}
                  className="px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-surface3 border border-transparent hover:border-surface3 transition"
                  title="Cerrar sesión"
                >
                  ↩
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Progress bar */}
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
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.1rem] px-1 flex items-center justify-center">
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
          {/* INTRO FWC */}
          {activeTab === 'intro' && !loading && (
            <StickerGallery
              stickers={introFWCStickers}
              userStickers={stickers}
              onUpdateSticker={handleUpdateSticker}
              title="Intro FWC — Portada y presentación"
            />
          )}

          {/* EQUIPOS */}
          {activeTab === 'equipos' && !loading && (
            <div className="space-y-6">
              {selectedTeam && selectedTeamData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
                    >
                      ← Volver
                    </button>
                    <span className="text-gray-600">·</span>
                    <div className="flex items-center gap-2">
                      <TeamFlag code={selectedTeam} className="text-lg" />
                      <span className="text-sm font-semibold text-white">{selectedTeamData.name}</span>
                      <span className="text-xs text-gray-500 bg-surface3 px-2 py-0.5 rounded-full">
                        Grupo {selectedTeamData.group}
                      </span>
                    </div>
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

          {/* FINAL FWC */}
          {activeTab === 'final' && !loading && (
            <StickerGallery
              stickers={finalFWCStickers}
              userStickers={stickers}
              onUpdateSticker={handleUpdateSticker}
              title="Final FWC — Historia del torneo"
            />
          )}

          {/* COCA-COLA */}
          {activeTab === 'cocacola' && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700/30 rounded-xl">
                <span className="text-2xl">🥤</span>
                <div>
                  <div className="text-white font-bold text-sm">Coca-Cola Special Edition</div>
                  <div className="text-gray-400 text-xs">14 stickers premium — CC1 al CC14</div>
                </div>
              </div>
              <StickerGallery
                stickers={cocaColaStickers}
                userStickers={stickers}
                onUpdateSticker={handleUpdateSticker}
              />
            </div>
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
              userId={userId}
              myStickers={stickers}
              trades={trades}
              othersRepeated={othersRepeated}
              othersOwned={othersOwned}
              matches={matches}
              loading={tradesLoading}
              onCreateTrade={createTrade}
              onRespondToTrade={respondToTrade}
              onCounterTrade={counterTrade}
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

      {showBulk && (
        <BulkEntryModal onConfirm={handleBulkMark} onClose={() => setShowBulk(false)} />
      )}

      {/* Global notifications panel — accessible from any tab */}
      <NotificationsPanel
        show={showNotifications}
        trades={trades}
        userId={userId}
        onClose={() => setShowNotifications(false)}
      />

      {/* Global toasts for trade events outside the Market tab */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {globalToasts.map((t) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={() => { setActiveTab('market'); setShowNotifications(false) }}
              className="px-5 py-3 rounded-xl font-bold text-sm shadow-2xl whitespace-nowrap pointer-events-auto bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-2"
            >
              🔔 {t.msg}
              <span className="text-amber-200 font-normal text-xs">→ Ver</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
