'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useStickers } from '@/hooks/useStickers'
import { useTrades } from '@/hooks/useTrades'
import { usePacks } from '@/hooks/usePacks'
import { AuthModal } from '@/components/AuthModal'
import { ProfileModal } from '@/components/ProfileModal'
import { ResetPasswordModal } from '@/components/ResetPasswordModal'
import { ProgressBar } from '@/components/ProgressBar'
import { StickerGallery } from '@/components/StickerGallery'
import { TeamOverview } from '@/components/TeamOverview'
import { MarketplaceView } from '@/components/MarketplaceView'
import { StatsPanel } from '@/components/StatsPanel'
import { DashboardView } from '@/components/DashboardView'
import { BulkEntryModal } from '@/components/BulkEntryModal'
import { ExportModal } from '@/components/ExportModal'
import { TeamFlag } from '@/components/TeamFlag'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import { StickerSearch } from '@/components/StickerSearch'
// PackOpeningModal is kept but bypassed — infrastructure preserved for future reactivation
// import { PackOpeningModal } from '@/components/PackOpeningModal'
import { TradeReceivedSummary } from '@/components/TradeReceivedSummary'
import type { PackItem } from '@/services/packService'
import type { StickerState } from '@/types'
import {
  getAllStickers,
  getTotalStickers,
} from '@/lib/stickers'
import { INTRO_FWC_STICKERS, FINAL_FWC_STICKERS, COCA_COLA_STICKERS, TEAMS } from '@/stickers'
import type { Sticker } from '@/types'

type Tab = 'intro' | 'equipos' | 'final' | 'cocacola' | 'repetidas' | 'stats' | 'dashboard' | 'market'
type GlobalToast = { id: number; msg: string }

// ── SVG Icons ──────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const BellIcon = ({ dot }: { dot?: boolean }) => (
  <span className="relative inline-flex">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {dot && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-dark" />}
  </span>
)
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const PackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>
  </svg>
)
const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const TAB_ICONS: Record<string, JSX.Element> = {
  intro:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  equipos:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
  final:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  cocacola:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="6"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M8.5 8a3.5 3.5 0 0 0 7 0"/><rect x="5" y="6" width="14" height="4" rx="1"/><path d="M7 18h10"/><path d="M5 10l2 8"/><path d="M19 10l-2 8"/></svg>,
  repetidas: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  stats:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  dashboard: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  market:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
}

export default function Home() {
  const { userId, profile, loading: authLoading, isRecovery, signIn, signUp, signOut, sendPasswordReset, confirmPasswordReset, changePassword, updateDisplayName } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('equipos')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [globalToasts, setGlobalToasts] = useState<GlobalToast[]>([])
  const globalToastId = useRef(0)
  const prevPendingRef = useRef(0)
  const prevMatchesRef = useRef(0)

  const totalStickers = getTotalStickers()
  const { stickers, progress, loading, updateSticker, refetch: refetchStickers } = useStickers(userId, totalStickers)
  const { packItems, openPack, refetch: refetchPacks } = usePacks(userId)
  const hasPendingPack = packItems.length > 0
  const {
    trades, othersRepeated, othersOwned, matches,
    loading: tradesLoading, pendingIncoming,
    createTrade, respondToTrade, bulkRespondToTrade, counterTrade, cancelTrade,
  } = useTrades(userId, stickers, refetchStickers, refetchPacks)

  // Snapshot pack items when they arrive for the summary modal.
  // stickersSnapshot is taken at arrival time for accurate new/extra categorization.
  const [showPackModal, setShowPackModal] = useState(false)
  const [packModalItems, setPackModalItems] = useState<PackItem[]>([])
  const [packModalSnapshot, setPackModalSnapshot] = useState<StickerState[]>([])

  useEffect(() => {
    if (packItems.length > 0 && !showPackModal) {
      setPackModalItems([...packItems])
      setPackModalSnapshot([...stickers])
      setShowPackModal(true)
    }
  }, [packItems, showPackModal, stickers])

  const handleClosePackModal = useCallback(() => {
    openPack() // mark items as opened in DB
    setShowPackModal(false)
    setPackModalItems([])
    setPackModalSnapshot([])
  }, [openPack])

  // Ctrl+K / Cmd+K → búsqueda
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
    (key: string, status: 'owned' | 'missing' | 'repeated', count = 0) => {
      if (userId) updateSticker(key, status, count)
    },
    [userId, updateSticker]
  )

  const handleBulkMark = useCallback(
    (ids: string[]) => {
      const counts = new Map<string, number>()
      ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1))
      counts.forEach((addCount, id) => {
        const current = stickers.find((s) => s.sticker_key === id)
        const currentTotal = !current || current.status === 'missing' ? 0
          : current.status === 'owned' ? 1
          : current.repeat_count + 1
        const newTotal = currentTotal + addCount
        if (newTotal <= 1) {
          handleUpdateSticker(id, 'owned', 0)
        } else {
          handleUpdateSticker(id, 'repeated', newTotal - 1)
        }
      })
    },
    [handleUpdateSticker, stickers]
  )

  const allStickers = useMemo(() => getAllStickers(), [])

  const introFWCStickers = useMemo<Sticker[]>(() =>
    INTRO_FWC_STICKERS.map((s) => ({ id: s.id, name: s.name, type: 'intro' as const, foil: s.foil })), [])

  const finalFWCStickers = useMemo<Sticker[]>(() =>
    FINAL_FWC_STICKERS.map((s) => ({ id: s.id, name: s.name, type: 'final' as const, foil: s.foil })), [])

  const cocaColaStickers = useMemo<Sticker[]>(() =>
    COCA_COLA_STICKERS.map((s) => ({ id: s.id, name: s.name, type: 'cocacola' as const, foil: s.foil })), [])

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
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
            <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin" />
            <div className="absolute inset-3 rounded-full border border-gold2/20" />
          </div>
          <div className="text-gold/60 text-sm font-display tracking-[0.4em] uppercase">Cargando</div>
        </div>
      </div>
    )
  }

  if (isRecovery) return <ResetPasswordModal onConfirm={confirmPasswordReset} />
  if (!userId || !profile) return <AuthModal onSignIn={signIn} onSignUp={signUp} onSendPasswordReset={sendPasswordReset} />

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'intro',     label: 'Intro'     },
    { id: 'equipos',   label: 'Equipos'   },
    { id: 'final',     label: 'Final'     },
    { id: 'cocacola',  label: 'Coca-Cola' },
    { id: 'repetidas', label: 'Extras'    },
    { id: 'stats',     label: 'Stats'     },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'market',    label: 'Mercado',  badge: pendingIncoming },
  ]

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'equipos') setSelectedTeam(null)
  }

  const selectedTeamData = selectedTeam ? TEAMS.find((t) => t.code === selectedTeam) : null

  return (
    <div className="min-h-screen">

      {/* ── HEADER — Transmisión oficial premium ─────────────────── */}
      <motion.header
        className="sticky top-0 z-40 header-glow"
        style={{ background: 'rgba(8,17,32,0.92)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Acento dorado superior */}
        <div className="header-accent" />

        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">

            {/* ── Logo / Branding ──────────────────────────────── */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Ícono Copa */}
              <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,197,66,0.18) 0%, rgba(255,215,0,0.06) 100%)',
                  border: '1px solid rgba(245,197,66,0.25)',
                  boxShadow: '0 0 20px rgba(245,197,66,0.12)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                </svg>
              </div>
              {/* Texto */}
              <div className="hidden sm:block">
                <h1 className="text-xl font-display text-gradient-gold uppercase leading-none tracking-wide">Álbum</h1>
                <p className="text-[9px] text-surface4 uppercase tracking-[0.35em] mt-0.5">Mundial 2026</p>
              </div>
            </div>

            {/* ── Acciones ─────────────────────────────────────── */}
            <div className="flex items-center gap-1.5">

              {/* Sobre pendiente */}
              {hasPendingPack && (
                <motion.button
                  onClick={() => {/* el modal se abre solo */}}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-dark transition-all animate-glow-pulse"
                  style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)', boxShadow: '0 0 16px rgba(255,215,0,0.4)' }}
                >
                  <PackIcon />
                  <span className="hidden sm:inline">Abrir sobre</span>
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {packItems.length}
                  </span>
                </motion.button>
              )}

              {/* Búsqueda */}
              <motion.button
                onClick={() => setShowSearch(true)}
                title="Buscar figurita (Ctrl+K)"
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold overflow-hidden"
                style={{
                  background: 'rgba(15,23,42,0.72)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(56,73,105,0.55)',
                  color: 'rgba(163,181,211,0.85)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
                whileHover={{
                  scale: 1.04,
                  borderColor: 'rgba(245,197,66,0.45)',
                  color: '#F3F4F6',
                  boxShadow: '0 0 18px rgba(245,197,66,0.18), 0 2px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.18 }}
              >
                <SearchIcon />
                <span className="hidden sm:inline tracking-wide">Buscar</span>
                <kbd className="hidden md:flex items-center gap-0.5 text-[9px] border rounded-md px-1.5 py-0.5 font-mono opacity-40 ml-0.5"
                  style={{ borderColor: 'rgba(56,73,105,0.7)', background: 'rgba(8,17,32,0.5)' }}>
                  ⌘K
                </kbd>
              </motion.button>

              {/* Entrada rápida */}
              <motion.button
                onClick={() => setShowBulk(true)}
                title="Entrada rápida de figuritas"
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold overflow-hidden"
                style={{
                  background: 'rgba(14,90,54,0.18)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(14,90,54,0.38)',
                  color: 'rgba(163,211,181,0.85)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
                whileHover={{
                  scale: 1.04,
                  background: 'rgba(14,90,54,0.28)',
                  borderColor: 'rgba(14,90,54,0.65)',
                  color: '#E2F5EC',
                  boxShadow: '0 0 18px rgba(14,90,54,0.28), 0 2px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.18 }}
              >
                <PlusIcon />
                <span className="hidden sm:inline tracking-wide">Entrada rápida</span>
              </motion.button>

              {/* Exportar */}
              <motion.button
                onClick={() => setShowExport(true)}
                title="Exportar álbum"
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold overflow-hidden"
                style={{
                  background: 'rgba(245,197,66,0.1)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(245,197,66,0.28)',
                  color: 'rgba(245,197,66,0.85)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
                whileHover={{
                  scale: 1.04,
                  background: 'rgba(245,197,66,0.18)',
                  borderColor: 'rgba(245,197,66,0.55)',
                  color: '#FFD700',
                  boxShadow: '0 0 18px rgba(245,197,66,0.22), 0 2px 14px rgba(0,0,0,0.4)',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.18 }}
              >
                <ExportIcon />
                <span className="hidden sm:inline tracking-wide">Exportar</span>
              </motion.button>

              {/* Notificaciones */}
              <motion.button
                onClick={() => setShowNotifications(true)}
                title="Actividad"
                className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden"
                style={{
                  background: pendingIncoming > 0
                    ? 'rgba(245,197,66,0.12)'
                    : 'rgba(15,23,42,0.72)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: pendingIncoming > 0
                    ? '1px solid rgba(245,197,66,0.38)'
                    : '1px solid rgba(56,73,105,0.55)',
                  color: pendingIncoming > 0 ? '#F5C542' : 'rgba(163,181,211,0.85)',
                  boxShadow: pendingIncoming > 0
                    ? '0 0 14px rgba(245,197,66,0.2), 0 2px 12px rgba(0,0,0,0.35)'
                    : '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
                whileHover={{
                  scale: 1.08,
                  borderColor: 'rgba(245,197,66,0.5)',
                  color: '#F5C542',
                  boxShadow: '0 0 22px rgba(245,197,66,0.28), 0 2px 14px rgba(0,0,0,0.4)',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.18 }}
                animate={pendingIncoming > 0 ? { scale: [1, 1.06, 1] } : {}}
              >
                <BellIcon dot={false} />
                {pendingIncoming > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[9px] font-bold rounded-full min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center"
                    style={{ boxShadow: '0 0 8px rgba(220,38,38,0.6), 0 2px 4px rgba(0,0,0,0.4)' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {pendingIncoming}
                  </motion.span>
                )}
              </motion.button>

              {/* Separador */}
              <div className="w-px h-6 mx-0.5" style={{ background: 'rgba(33,50,85,0.8)' }} />

              {/* Usuario */}
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(26,40,64,0.8)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                title="Mi perfil"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-display text-dark font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)' }}
                >
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[9px] text-surface4 uppercase tracking-wider leading-none mb-0.5">Hola,</p>
                  <p className="font-bold text-gold text-xs leading-tight">{profile.display_name}</p>
                </div>
              </button>

              {/* Logout */}
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg transition-all text-surface4 hover:text-red-400"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.1)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                title="Cerrar sesión"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">

        {/* Progress bar */}
        {activeTab !== 'market' && activeTab !== 'stats' && activeTab !== 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <ProgressBar progress={progress} />
          </motion.div>
        )}

        {/* ── Tab navigation ─────────────────────────────────────── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-display text-sm tracking-wide transition-all whitespace-nowrap shrink-0 border ${
                activeTab === tab.id
                  ? 'text-dark border-gold/40 tab-active-glow'
                  : 'text-surface4 hover:text-humo border-surface3/60 hover:border-surface4'
              }`}
              style={
                activeTab === tab.id
                  ? { background: 'linear-gradient(135deg, #F5C542, #FFD700)' }
                  : { background: 'rgba(19,32,48,0.8)' }
              }
            >
              <span className={`flex items-center leading-none ${activeTab === tab.id ? 'opacity-70' : 'opacity-50'}`}>
                {TAB_ICONS[tab.id]}
              </span>
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[1rem] px-1 flex items-center justify-center leading-none h-4">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────────── */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'intro' && !loading && (
            <StickerGallery stickers={introFWCStickers} userStickers={stickers} onUpdateSticker={handleUpdateSticker} title="Intro FWC — Portada y presentación" />
          )}

          {activeTab === 'equipos' && !loading && (
            <div className="space-y-5">
              {selectedTeam && selectedTeamData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedTeam(null)} className="flex items-center gap-1.5 text-sm text-surface4 hover:text-gold transition-colors">
                      ← Volver
                    </button>
                    <span className="text-surface3">·</span>
                    <div className="flex items-center gap-2">
                      <TeamFlag code={selectedTeam} className="text-lg" />
                      <span className="text-sm font-bold text-humo">{selectedTeamData.name}</span>
                      <span className="text-[9px] text-surface4 border border-surface3 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Grupo {selectedTeamData.group}
                      </span>
                    </div>
                  </div>
                  <StickerGallery stickers={selectedTeamStickers} userStickers={stickers} onUpdateSticker={handleUpdateSticker} />
                </div>
              ) : (
                <TeamOverview userStickers={stickers} selectedTeam={selectedTeam} onSelectTeam={setSelectedTeam} />
              )}
            </div>
          )}

          {activeTab === 'final' && !loading && (
            <StickerGallery stickers={finalFWCStickers} userStickers={stickers} onUpdateSticker={handleUpdateSticker} title="Final FWC — Historia del torneo" />
          )}

          {activeTab === 'cocacola' && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl border overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, rgba(153,0,0,0.25) 0%, rgba(19,32,48,0.9) 100%)', borderColor: 'rgba(153,0,0,0.3)' }}
              >
                <div className="absolute inset-0 diamond-pattern opacity-30 pointer-events-none" />
                <span className="text-3xl relative z-10">🥤</span>
                <div className="relative z-10">
                  <p className="text-white font-display text-xl tracking-wide uppercase">Coca-Cola Special Edition</p>
                  <p className="text-surface4 text-xs mt-0.5">14 stickers premium — CC1 al CC14</p>
                </div>
              </div>
              <StickerGallery stickers={cocaColaStickers} userStickers={stickers} onUpdateSticker={handleUpdateSticker} />
            </div>
          )}

          {activeTab === 'repetidas' && !loading && (
            <StickerGallery stickers={allStickers} userStickers={stickers} onUpdateSticker={handleUpdateSticker} defaultFilter="repeated" title="Mis repetidas" />
          )}

          {activeTab === 'stats' && (
            <StatsPanel progress={progress} stickers={stickers} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              userId={userId}
              myProgress={progress}
              myStickers={stickers}
              myTrades={trades}
            />
          )}

          {activeTab === 'market' && (
            <MarketplaceView
              userId={userId} myStickers={stickers} trades={trades}
              othersRepeated={othersRepeated} othersOwned={othersOwned} matches={matches}
              loading={tradesLoading} onCreateTrade={createTrade} onRespondToTrade={respondToTrade}
              onBulkAccept={bulkRespondToTrade}
              onCounterTrade={counterTrade} onCancelTrade={cancelTrade}
            />
          )}

          {loading && activeTab !== 'market' && activeTab !== 'stats' && activeTab !== 'dashboard' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
                <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin" />
              </div>
              <p className="text-surface4 text-sm font-display tracking-[0.3em] uppercase">Cargando figuritas</p>
            </div>
          )}
        </motion.div>
      </main>

      {/* ── Modales ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <StickerSearch userStickers={stickers} onNavigate={handleSearchNavigate} onClose={() => setShowSearch(false)} />
        )}
      </AnimatePresence>

      {showBulk && <BulkEntryModal onConfirm={handleBulkMark} onClose={() => setShowBulk(false)} />}

      {showExport && <ExportModal stickers={stickers} onClose={() => setShowExport(false)} />}

      {showProfile && (
        <ProfileModal profile={profile} onChangePassword={changePassword} onUpdateDisplayName={updateDisplayName} onClose={() => setShowProfile(false)} />
      )}

      <NotificationsPanel show={showNotifications} trades={trades} userId={userId} onClose={() => setShowNotifications(false)} />

      {/* Trade received summary — replaces cinematic pack opening (PackOpeningModal preserved but inactive) */}
      <AnimatePresence>
        {showPackModal && packModalItems.length > 0 && (
          <TradeReceivedSummary
            receivedKeys={packModalItems.map((i) => i.sticker_key)}
            myStickersSnapshot={packModalSnapshot}
            onClose={handleClosePackModal}
          />
        )}
      </AnimatePresence>

      {/* ── Toasts globales ──────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {globalToasts.map((t) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={() => { setActiveTab('market') }}
              className="px-5 py-3 rounded-xl font-bold text-sm shadow-2xl whitespace-nowrap pointer-events-auto transition-all flex items-center gap-2 border"
              style={{ background: 'linear-gradient(135deg, #92400e, #b45309)', borderColor: 'rgba(245,158,11,0.3)', color: '#fff' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {t.msg}
              <span className="text-amber-300 font-normal text-xs">→ Ver</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
