'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useStickers } from '@/hooks/useStickers'
import { useTrades } from '@/hooks/useTrades'
import { AuthModal } from '@/components/AuthModal'
import { ProfileModal } from '@/components/ProfileModal'
import { ResetPasswordModal } from '@/components/ResetPasswordModal'
import { ProgressBar } from '@/components/ProgressBar'
import { StickerGallery } from '@/components/StickerGallery'
import { TeamOverview } from '@/components/TeamOverview'
import { MarketplaceView } from '@/components/MarketplaceView'
import { StatsPanel } from '@/components/StatsPanel'
import { BulkEntryModal } from '@/components/BulkEntryModal'
import { TeamFlag } from '@/components/TeamFlag'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import { StickerSearch } from '@/components/StickerSearch'
import {
  getAllStickers,
  getTotalStickers,
} from '@/lib/stickers'
import { INTRO_FWC_STICKERS, FINAL_FWC_STICKERS, COCA_COLA_STICKERS, TEAMS } from '@/stickers'
import type { Sticker } from '@/types'

type Tab = 'intro' | 'equipos' | 'final' | 'cocacola' | 'repetidas' | 'stats' | 'market'

type GlobalToast = { id: number; msg: string }

export default function Home() {
  const { userId, profile, loading: authLoading, isRecovery, signIn, signUp, signOut, sendPasswordReset, confirmPasswordReset, changePassword, updateDisplayName } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('equipos')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
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

  // Ctrl+K / Cmd+K opens sticker search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleSearchNavigate = useCallback(
    (tab: 'intro' | 'equipos' | 'final' | 'cocacola', teamCode?: string) => {
      setActiveTab(tab)
      if (tab === 'equipos' && teamCode) setSelectedTeam(teamCode)
    },
    []
  )

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-gold2/30 border-t-gold2 animate-spin" />
          <div className="text-gold2/70 text-sm font-display tracking-widest uppercase">Cargando</div>
        </div>
      </div>
    )
  }

  if (isRecovery) {
    return <ResetPasswordModal onConfirm={confirmPasswordReset} />
  }

  if (!userId || !profile) {
    return <AuthModal onSignIn={signIn} onSignUp={signUp} onSendPasswordReset={sendPasswordReset} />
  }

  const tabs: { id: Tab; label: string; emoji: string; badge?: number }[] = [
    { id: 'intro',     label: 'Intro',     emoji: '🌍' },
    { id: 'equipos',   label: 'Equipos',   emoji: '🏆' },
    { id: 'final',     label: 'Final',     emoji: '🎖️' },
    { id: 'cocacola',  label: 'Coca-Cola', emoji: '🥤' },
    { id: 'repetidas', label: 'Extras',    emoji: '🔁' },
    { id: 'stats',     label: 'Stats',     emoji: '📊' },
    { id: 'market',    label: 'Mercado',   emoji: '🔄', badge: pendingIncoming },
  ]

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'equipos') setSelectedTeam(null)
  }

  const selectedTeamData = selectedTeam ? TEAMS.find((t) => t.code === selectedTeam) : null

  return (
    <div className="min-h-screen">
      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.header
        className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-white/5"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Gold accent line */}
        <div className="header-accent" />

        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex justify-between items-center gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold/25 to-gold2/10 border border-gold/25 flex items-center justify-center shadow-gold-sm">
                <span className="text-gold2 font-display text-lg leading-none">26</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-display text-gold2 uppercase leading-none tracking-wide">Álbum</h1>
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">Mundial 2026</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface2 hover:bg-surface3 text-gray-400 hover:text-gray-200 border border-surface3 hover:border-surface4 transition-all"
                title="Buscar figurita (Ctrl+K)"
              >
                <span className="text-sm">🔍</span>
                <span className="hidden sm:inline">Buscar</span>
                <kbd className="hidden md:flex items-center text-[9px] text-gray-600 border border-surface4 rounded px-1 py-0.5 font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Quick entry */}
              <button
                onClick={() => setShowBulk(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface2 hover:bg-surface3 text-gray-400 hover:text-gray-200 border border-surface3 hover:border-surface4 transition-all"
              >
                <span className="hidden sm:inline">+ Entrada rápida</span>
                <span className="sm:hidden">+</span>
              </button>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 rounded-lg bg-surface2 hover:bg-surface3 text-gray-400 hover:text-gray-200 border border-surface3 hover:border-surface4 transition-all"
                title="Actividad de intercambios"
              >
                <span className="text-base">🔔</span>
                {pendingIncoming > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center shadow-lg animate-pulse-glow">
                    {pendingIncoming}
                  </span>
                )}
              </button>

              {/* User */}
              <div className="flex items-center gap-1.5 pl-1 border-l border-surface3">
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface3 transition-all group"
                  title="Gestionar perfil"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/30 to-gold2/10 border border-gold/30 flex items-center justify-center shrink-0 group-hover:border-gold/60 transition-colors">
                    <span className="text-gold2 text-xs font-display leading-none">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider leading-none mb-0.5">Hola,</p>
                    <p className="font-bold text-gold2 text-sm leading-tight">{profile.display_name}</p>
                  </div>
                </button>
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-300 hover:bg-surface3 transition-all"
                  title="Cerrar sesión"
                >
                  ↩
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">

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

        {/* ── Tab navigation ─────────────────────────────────── */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-display text-sm tracking-wide transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gold to-gold2 text-dark tab-active-glow'
                  : 'bg-surface2 text-gray-500 hover:text-gray-200 hover:bg-surface3 border border-surface3 hover:border-surface4'
              }`}
            >
              <span className={`text-base leading-none ${activeTab === tab.id ? 'opacity-80' : 'opacity-60'}`}>
                {tab.emoji}
              </span>
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.1rem] px-1 flex items-center justify-center leading-none h-[1.1rem]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ─────────────────────────────────────── */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
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
            <div className="space-y-5">
              {selectedTeam && selectedTeamData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold2 transition-colors"
                    >
                      ← Volver
                    </button>
                    <span className="text-surface4">·</span>
                    <div className="flex items-center gap-2">
                      <TeamFlag code={selectedTeam} className="text-lg" />
                      <span className="text-sm font-semibold text-white">{selectedTeamData.name}</span>
                      <span className="text-[10px] text-gray-600 bg-surface3 border border-surface4 px-2 py-0.5 rounded-full uppercase tracking-wider">
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
              <div className="flex items-center gap-4 p-4 rounded-xl border border-red-800/30 bg-gradient-to-r from-red-950/40 to-surface2 relative overflow-hidden diamond-pattern">
                <span className="text-3xl relative z-10">🥤</span>
                <div className="relative z-10">
                  <div className="text-white font-display text-xl tracking-wide uppercase">Coca-Cola Special Edition</div>
                  <div className="text-gray-500 text-xs mt-0.5">14 stickers premium — CC1 al CC14</div>
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

          {/* Loading state */}
          {loading && activeTab !== 'market' && activeTab !== 'stats' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-gold2/20 border-t-gold2/80 animate-spin" />
              <div className="text-gray-600 text-sm font-display tracking-widest uppercase">Cargando figuritas</div>
            </div>
          )}
        </motion.div>
      </main>

      {/* ── Modales y overlays ─────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <StickerSearch
            userStickers={stickers}
            onNavigate={handleSearchNavigate}
            onClose={() => setShowSearch(false)}
          />
        )}
      </AnimatePresence>

      {showBulk && (
        <BulkEntryModal onConfirm={handleBulkMark} onClose={() => setShowBulk(false)} />
      )}

      {showProfile && (
        <ProfileModal
          profile={profile}
          onChangePassword={changePassword}
          onUpdateDisplayName={updateDisplayName}
          onClose={() => setShowProfile(false)}
        />
      )}

      <NotificationsPanel
        show={showNotifications}
        trades={trades}
        userId={userId}
        onClose={() => setShowNotifications(false)}
      />

      {/* ── Global toasts ──────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {globalToasts.map((t) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={() => { setActiveTab('market'); setShowNotifications(false) }}
              className="px-5 py-3 rounded-xl font-bold text-sm shadow-2xl whitespace-nowrap pointer-events-auto bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-2 border border-amber-500/40"
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
