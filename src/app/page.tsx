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
import { CalendarView } from '@/components/CalendarView'
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

// ── Navigation types ───────────────────────────────────────────
type MainTab = 'album' | 'calendario' | 'quiniela' | 'mercado' | 'dashboard'
type AlbumTab = 'intro' | 'equipos' | 'final' | 'cocacola' | 'repetidas' | 'stats'

type GlobalToast = { id: number; msg: string }

// ── Icons ──────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
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

// Main nav icons
const AlbumIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const QuinielaIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7z"/><path d="M22 19H2"/>
  </svg>
)
const MercadoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)
const DashboardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

// Album sub-tab icons
const ALBUM_TAB_ICONS: Record<AlbumTab, JSX.Element> = {
  intro:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  equipos:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
  final:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  cocacola:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="6"/><path d="M5 10a7 7 0 0 0 14 0"/><rect x="5" y="6" width="14" height="4" rx="1"/><path d="M7 18h10"/><path d="M5 10l2 8"/><path d="M19 10l-2 8"/></svg>,
  repetidas: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  stats:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
}

export default function Home() {
  const { userId, profile, loading: authLoading, isRecovery, signIn, signUp, signOut, sendPasswordReset, confirmPasswordReset, changePassword, updateDisplayName } = useAuth()

  const [activeMain, setActiveMain] = useState<MainTab>('album')
  const [activeAlbum, setActiveAlbum] = useState<AlbumTab>('equipos')
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
    openPack()
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
      setActiveMain('album')
      setActiveAlbum(tab)
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
    if (pendingIncoming > prevPendingRef.current && activeMain !== 'mercado') {
      pushGlobalToast('Nueva solicitud de intercambio recibida')
    }
    prevPendingRef.current = pendingIncoming
  }, [pendingIncoming, activeMain, pushGlobalToast])

  useEffect(() => {
    if (matches.length > prevMatchesRef.current && prevMatchesRef.current > 0 && activeMain !== 'mercado') {
      pushGlobalToast('Nuevo match encontrado — hay alguien compatible')
    }
    prevMatchesRef.current = matches.length
  }, [matches.length, activeMain, pushGlobalToast])

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

  const handleMainTabChange = (tab: MainTab) => {
    if (tab === 'quiniela') return // disabled
    setActiveMain(tab)
    if (tab !== 'album') setSelectedTeam(null)
  }

  const handleAlbumTabChange = (tab: AlbumTab) => {
    setActiveAlbum(tab)
    if (tab !== 'equipos') setSelectedTeam(null)
  }

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

  const selectedTeamData = selectedTeam ? TEAMS.find((t) => t.code === selectedTeam) : null

  // ── Main nav definition ────────────────────────────────────
  const mainTabs: {
    id: MainTab
    label: string
    icon: JSX.Element
    badge?: number
    disabled?: boolean
    soon?: boolean
  }[] = [
    { id: 'album',      label: 'Álbum',      icon: <AlbumIcon /> },
    { id: 'calendario', label: 'Calendario',  icon: <CalendarIcon /> },
    { id: 'quiniela',   label: 'Quiniela',    icon: <QuinielaIcon />, disabled: true, soon: true },
    { id: 'mercado',    label: 'Mercado',     icon: <MercadoIcon />, badge: pendingIncoming },
    { id: 'dashboard',  label: 'Dashboard',   icon: <DashboardIcon /> },
  ]

  // ── Album sub-nav definition ───────────────────────────────
  const albumTabs: { id: AlbumTab; label: string }[] = [
    { id: 'intro',     label: 'Intro'     },
    { id: 'equipos',   label: 'Equipos'   },
    { id: 'final',     label: 'Final'     },
    { id: 'cocacola',  label: 'Coca-Cola' },
    { id: 'repetidas', label: 'Extras'    },
    { id: 'stats',     label: 'Stats'     },
  ]

  return (
    <div className="min-h-screen">

      {/* ── HEADER ────────────────────────────────────────────── */}
      <motion.header
        className="sticky top-0 z-40 header-glow"
        style={{
          background: 'linear-gradient(180deg, rgba(13,24,46,0.98) 0%, rgba(8,17,32,0.93) 100%)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderBottom: '1px solid rgba(56,73,105,0.22)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Gold accent line */}
        <div className="header-accent" />

        <div className="max-w-7xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between gap-4">

            {/* ── Logo / Branding ──────────────────────────── */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,197,66,0.20) 0%, rgba(255,215,0,0.08) 100%)',
                  border: '1px solid rgba(245,197,66,0.28)',
                  boxShadow: '0 0 24px rgba(245,197,66,0.14), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-display text-gradient-gold uppercase leading-none tracking-wide">Álbum</h1>
                <p className="text-[9px] tracking-[0.38em] mt-0.5 uppercase" style={{ color: 'rgba(163,181,211,0.5)' }}>Mundial 2026</p>
              </div>
            </div>

            {/* ── Actions ──────────────────────────────────── */}
            <div className="flex items-center gap-1.5 ml-auto">

              {/* Pending pack */}
              {hasPendingPack && (
                <motion.button
                  onClick={() => {}}
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

              {/* Search */}
              <motion.button
                onClick={() => setShowSearch(true)}
                title="Buscar figurita (Ctrl+K)"
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: 'rgba(16,28,48,0.7)',
                  border: '1px solid rgba(56,73,105,0.45)',
                  color: 'rgba(163,181,211,0.8)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
                whileHover={{ scale: 1.04, borderColor: 'rgba(245,197,66,0.4)', color: '#F3F4F6' } as any}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <SearchIcon />
                <span className="hidden sm:inline tracking-wide">Buscar</span>
                <kbd className="hidden md:flex items-center gap-0.5 text-[9px] border rounded-md px-1.5 py-0.5 font-mono opacity-35 ml-0.5"
                  style={{ borderColor: 'rgba(56,73,105,0.6)', background: 'rgba(8,17,32,0.5)' }}>⌘K</kbd>
              </motion.button>

              {/* Quick entry */}
              <motion.button
                onClick={() => setShowBulk(true)}
                title="Entrada rápida de figuritas"
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: 'rgba(14,90,54,0.15)',
                  border: '1px solid rgba(14,90,54,0.32)',
                  color: 'rgba(163,211,181,0.8)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
                whileHover={{ scale: 1.04, background: 'rgba(14,90,54,0.25)', borderColor: 'rgba(14,90,54,0.55)', color: '#E2F5EC' } as any}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <PlusIcon />
                <span className="hidden sm:inline tracking-wide">Entrada rápida</span>
              </motion.button>

              {/* Export */}
              <motion.button
                onClick={() => setShowExport(true)}
                title="Exportar álbum"
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: 'rgba(245,197,66,0.08)',
                  border: '1px solid rgba(245,197,66,0.22)',
                  color: 'rgba(245,197,66,0.8)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
                whileHover={{ scale: 1.04, background: 'rgba(245,197,66,0.16)', borderColor: 'rgba(245,197,66,0.5)', color: '#FFD700' } as any}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <ExportIcon />
                <span className="hidden sm:inline tracking-wide">Exportar</span>
              </motion.button>

              {/* Notifications */}
              <motion.button
                onClick={() => setShowNotifications(true)}
                title="Actividad"
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                style={{
                  background: pendingIncoming > 0 ? 'rgba(245,197,66,0.1)' : 'rgba(16,28,48,0.7)',
                  border: pendingIncoming > 0 ? '1px solid rgba(245,197,66,0.32)' : '1px solid rgba(56,73,105,0.45)',
                  color: pendingIncoming > 0 ? '#F5C542' : 'rgba(163,181,211,0.8)',
                }}
                whileHover={{ scale: 1.08, borderColor: 'rgba(245,197,66,0.45)', color: '#F5C542' } as any}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.15 }}
                animate={pendingIncoming > 0 ? { scale: [1, 1.06, 1] } : {}}
              >
                <BellIcon />
                {pendingIncoming > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[9px] font-bold rounded-full min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center"
                    style={{ boxShadow: '0 0 8px rgba(220,38,38,0.5)' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {pendingIncoming}
                  </motion.span>
                )}
              </motion.button>

              {/* Divider */}
              <div className="w-px h-6 mx-0.5" style={{ background: 'rgba(42,60,90,0.7)' }} />

              {/* User */}
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(20,36,58,0.8)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                title="Mi perfil"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-display text-dark font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)' }}
                >
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[9px] uppercase tracking-wider leading-none mb-0.5" style={{ color: 'rgba(163,181,211,0.5)' }}>Hola,</p>
                  <p className="font-bold text-gold text-xs leading-tight">{profile.display_name}</p>
                </div>
              </button>

              {/* Logout */}
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: 'rgba(163,181,211,0.4)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(163,181,211,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                title="Cerrar sesión"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── MAIN ──────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-5 space-y-4">

        {/* ── MAIN NAV (5 secciones) ──────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {mainTabs.map((tab) => {
            const isQuiniela = tab.id === 'quiniela'
            return (
              <button
                key={tab.id}
                onClick={() => handleMainTabChange(tab.id)}
                disabled={tab.disabled}
                className="relative flex items-center gap-2 px-5 py-2 rounded-xl font-display text-sm tracking-widest uppercase transition-all whitespace-nowrap shrink-0 border"
                style={
                  isQuiniela
                    ? {
                        background: 'rgba(249,115,22,0.04)',
                        borderColor: 'rgba(249,115,22,0.18)',
                        color: 'rgba(251,146,60,0.4)',
                        cursor: 'not-allowed',
                        borderStyle: 'dashed',
                      }
                    : tab.disabled
                    ? {
                        background: 'rgba(14,24,44,0.5)',
                        borderColor: 'rgba(42,60,90,0.3)',
                        color: 'rgba(163,181,211,0.25)',
                        cursor: 'not-allowed',
                      }
                    : activeMain === tab.id
                    ? {
                        background: 'linear-gradient(135deg, #F5C542, #FFD700)',
                        borderColor: 'rgba(245,197,66,0.5)',
                        color: '#0B1624',
                        boxShadow: '0 3px 16px rgba(245,197,66,0.28), 0 1px 0 rgba(255,255,255,0.2) inset',
                      }
                    : {
                        background: 'rgba(14,24,44,0.65)',
                        borderColor: 'rgba(42,60,90,0.45)',
                        color: 'rgba(163,181,211,0.75)',
                      }
                }
                onMouseEnter={e => {
                  if (!tab.disabled && activeMain !== tab.id) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,197,66,0.35)'
                    ;(e.currentTarget as HTMLElement).style.color = '#E5E7EB'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(18,30,52,0.85)'
                  }
                }}
                onMouseLeave={e => {
                  if (!tab.disabled && activeMain !== tab.id) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(42,60,90,0.45)'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(163,181,211,0.75)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(14,24,44,0.65)'
                  }
                }}
              >
                <span className={activeMain === tab.id ? 'opacity-70' : isQuiniela ? 'opacity-40' : 'opacity-60'}>
                  {tab.icon}
                </span>
                {tab.label}

                {/* Badge (Mercado trade count) */}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[1rem] px-1 flex items-center justify-center leading-none h-4"
                    style={{ boxShadow: '0 0 8px rgba(220,38,38,0.5)' }}>
                    {tab.badge}
                  </span>
                )}

                {/* Quiniela — "Próximamente" badge mejorado */}
                {isQuiniela && (
                  <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(249,115,22,0.12)',
                      color: 'rgba(251,146,60,0.75)',
                      border: '1px solid rgba(249,115,22,0.28)',
                    }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Pronto
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── ALBUM SUB-NAV (shown only when album is active) ─── */}
        <AnimatePresence>
          {activeMain === 'album' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
            >
              <span className="text-[9px] uppercase tracking-[0.32em] shrink-0 pr-1 font-semibold"
                style={{ color: 'rgba(163,181,211,0.35)' }}>
                Sección
              </span>
              <div className="w-px h-4 shrink-0" style={{ background: 'rgba(42,60,90,0.5)' }} />
              {albumTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleAlbumTabChange(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap shrink-0 border"
                  style={
                    activeAlbum === tab.id
                      ? {
                          background: 'rgba(245,197,66,0.10)',
                          borderColor: 'rgba(245,197,66,0.32)',
                          color: '#F5C542',
                          boxShadow: '0 1px 10px rgba(245,197,66,0.15)',
                        }
                      : {
                          background: 'rgba(12,20,38,0.55)',
                          borderColor: 'rgba(42,60,90,0.38)',
                          color: 'rgba(163,181,211,0.6)',
                        }
                  }
                  onMouseEnter={e => {
                    if (activeAlbum !== tab.id) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,197,66,0.22)'
                      ;(e.currentTarget as HTMLElement).style.color = 'rgba(229,231,235,0.9)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeAlbum !== tab.id) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(42,60,90,0.38)'
                      ;(e.currentTarget as HTMLElement).style.color = 'rgba(163,181,211,0.6)'
                    }
                  }}
                >
                  <span className="opacity-70">{ALBUM_TAB_ICONS[tab.id]}</span>
                  {tab.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Progress bar (only in album, not in stats) ─────── */}
        {activeMain === 'album' && activeAlbum !== 'stats' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <ProgressBar progress={progress} />
          </motion.div>
        )}

        {/* ── Content ──────────────────────────────────────────── */}
        <motion.div
          key={`${activeMain}-${activeMain === 'album' ? activeAlbum : ''}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* ── ÁLBUM ───────────────────────────────────────── */}
          {activeMain === 'album' && (
            <>
              {activeAlbum === 'intro' && !loading && (
                <StickerGallery stickers={introFWCStickers} userStickers={stickers} onUpdateSticker={handleUpdateSticker} title="Intro FWC — Portada y presentación" />
              )}

              {activeAlbum === 'equipos' && !loading && (
                <div className="space-y-5">
                  {selectedTeam && selectedTeamData ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedTeam(null)} className="flex items-center gap-1.5 text-sm transition-colors"
                          style={{ color: 'rgba(163,181,211,0.6)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F5C542'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(163,181,211,0.6)'}>
                          ← Volver
                        </button>
                        <span style={{ color: 'rgba(163,181,211,0.3)' }}>·</span>
                        <div className="flex items-center gap-2">
                          <TeamFlag code={selectedTeam} className="text-lg" />
                          <span className="text-sm font-bold text-humo">{selectedTeamData.name}</span>
                          <span className="text-[9px] border px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ color: 'rgba(163,181,211,0.5)', borderColor: 'rgba(42,60,90,0.5)' }}>
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

              {activeAlbum === 'final' && !loading && (
                <StickerGallery stickers={finalFWCStickers} userStickers={stickers} onUpdateSticker={handleUpdateSticker} title="Final FWC — Historia del torneo" />
              )}

              {activeAlbum === 'cocacola' && !loading && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl border overflow-hidden relative"
                    style={{ background: 'linear-gradient(135deg, rgba(153,0,0,0.25) 0%, rgba(19,32,48,0.9) 100%)', borderColor: 'rgba(153,0,0,0.3)' }}
                  >
                    <div className="absolute inset-0 diamond-pattern opacity-30 pointer-events-none" />
                    <span className="text-3xl relative z-10">🥤</span>
                    <div className="relative z-10">
                      <p className="text-white font-display text-xl tracking-wide uppercase">Coca-Cola Special Edition</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(163,181,211,0.5)' }}>14 stickers premium — CC1 al CC14</p>
                    </div>
                  </div>
                  <StickerGallery stickers={cocaColaStickers} userStickers={stickers} onUpdateSticker={handleUpdateSticker} />
                </div>
              )}

              {activeAlbum === 'repetidas' && !loading && (
                <StickerGallery stickers={allStickers} userStickers={stickers} onUpdateSticker={handleUpdateSticker} defaultFilter="repeated" title="Mis repetidas" />
              )}

              {activeAlbum === 'stats' && (
                <StatsPanel progress={progress} stickers={stickers} />
              )}

              {loading && activeAlbum !== 'stats' && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin" />
                  </div>
                  <p className="text-xs font-display tracking-[0.3em] uppercase" style={{ color: 'rgba(163,181,211,0.4)' }}>
                    Cargando figuritas
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── CALENDARIO ──────────────────────────────────── */}
          {activeMain === 'calendario' && (
            <CalendarView />
          )}

          {/* ── QUINIELA (disabled) ─────────────────────────── */}
          {activeMain === 'quiniela' && (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)' }}>
                <QuinielaIcon />
              </div>
              <div>
                <h2 className="text-2xl font-display tracking-widest uppercase" style={{ color: 'rgba(249,115,22,0.7)' }}>
                  Quiniela
                </h2>
                <p className="text-sm mt-2" style={{ color: 'rgba(163,181,211,0.5)' }}>Próximamente disponible</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(163,181,211,0.3)' }}>
                  Predice los resultados del Mundial y compite con amigos
                </p>
              </div>
            </div>
          )}

          {/* ── MERCADO ─────────────────────────────────────── */}
          {activeMain === 'mercado' && (
            <MarketplaceView
              userId={userId} myStickers={stickers} trades={trades}
              othersRepeated={othersRepeated} othersOwned={othersOwned} matches={matches}
              loading={tradesLoading} onCreateTrade={createTrade} onRespondToTrade={respondToTrade}
              onBulkAccept={bulkRespondToTrade}
              onCounterTrade={counterTrade} onCancelTrade={cancelTrade}
            />
          )}

          {/* ── DASHBOARD ───────────────────────────────────── */}
          {activeMain === 'dashboard' && (
            <DashboardView
              userId={userId}
              myProgress={progress}
              myStickers={stickers}
              myTrades={trades}
            />
          )}
        </motion.div>
      </main>

      {/* ── Modales ───────────────────────────────────────────── */}
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

      <AnimatePresence>
        {showPackModal && packModalItems.length > 0 && (
          <TradeReceivedSummary
            receivedKeys={packModalItems.map((i) => i.sticker_key)}
            myStickersSnapshot={packModalSnapshot}
            onClose={handleClosePackModal}
          />
        )}
      </AnimatePresence>

      {/* ── Global Toasts ─────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {globalToasts.map((t) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={() => setActiveMain('mercado')}
              className="px-5 py-3 rounded-xl font-bold text-sm shadow-2xl whitespace-nowrap pointer-events-auto flex items-center gap-2 border"
              style={{ background: 'linear-gradient(135deg, #92400e, #b45309)', borderColor: 'rgba(245,158,11,0.3)', color: '#fff' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {t.msg}
              <span className="text-amber-300 font-normal text-xs">→ Ver</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
