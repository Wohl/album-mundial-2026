'use client'

import { useState, useCallback, useMemo, type MouseEvent } from 'react'
import { motion } from 'framer-motion'
import { useSession } from '@/hooks/useSession'
import { useStickers } from '@/hooks/useStickers'
import { useTrades } from '@/hooks/useTrades'
import { WelcomeModal } from '@/components/WelcomeModal'
import { ProgressBar } from '@/components/ProgressBar'
import { StickerGallery } from '@/components/StickerGallery'
import { StickerContextMenu } from '@/components/StickerContextMenu'
import { MarketplaceView } from '@/components/MarketplaceView'
import { getAllStickers, getTotalStickers } from '@/lib/stickers'
import { INTRO_STICKERS, TEAMS } from '@/stickers'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  stickerKey: string
}

export default function Home() {
  const { session, loading: sessionLoading, createSession } = useSession()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    stickerKey: '',
  })
  const [activeTab, setActiveTab] = useState<'intro' | 'teams' | 'all' | 'market'>('intro')

  const totalStickers = getTotalStickers()
  const { stickers, progress, loading, updateSticker } = useStickers(session?.id || null, totalStickers)
  const { trades, othersRepeated, loading: tradesLoading, pendingIncoming, createTrade, respondToTrade, cancelTrade } =
    useTrades(session?.id || null, stickers)

  const handleCreateSession = useCallback(
    async (name: string) => {
      try {
        await createSession(name)
      } catch (error) {
        console.error('Error creating session:', error)
      }
    },
    [createSession]
  )

  const allStickers = useMemo(() => getAllStickers(), [])

  const displayStickers = useMemo(() => {
    switch (activeTab) {
      case 'intro':
        return INTRO_STICKERS.map((s) => ({
          id: s.id,
          name: s.name,
          type: 'intro' as const,
          foil: s.foil,
        }))
      case 'teams':
        return TEAMS.flatMap((team) =>
          Array.from({ length: 20 }, (_, i) => ({
            id: `${team.code}_${i}`,
            name: `${team.name} - ${team.players[i]}`,
            team: team.name,
            type: 'regular' as const,
            foil: i === 0,
          }))
        )
      case 'all':
        return allStickers
      default:
        return []
    }
  }, [activeTab, allStickers])

  const handleStickerClick = useCallback(
    (e: MouseEvent<HTMLElement>, stickerKey: string) => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        stickerKey,
      })
    },
    []
  )

  const handleUpdateSticker = useCallback(
    (status: 'missing' | 'owned' | 'repeated') => {
      if (session?.id) {
        const current = stickers.find((s) => s.sticker_key === contextMenu.stickerKey)
        const repeatCount = status === 'repeated' ? (current?.repeat_count ?? 0) + 1 : 0
        updateSticker(contextMenu.stickerKey, status, repeatCount)
      }
      setContextMenu({ ...contextMenu, visible: false })
    },
    [contextMenu, session?.id, stickers, updateSticker]
  )

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold2 text-2xl font-display uppercase">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return <WelcomeModal onSubmit={handleCreateSession} />
  }

  const tabs = [
    { id: 'intro',  label: 'Introducción' },
    { id: 'teams',  label: 'Equipos' },
    { id: 'all',    label: 'Todo' },
    { id: 'market', label: 'Mercado', badge: pendingIncoming },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark via-surface to-dark">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 bg-surface2/95 backdrop-blur border-b border-gold2/20 py-4 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display text-gold2 uppercase">Álbum</h1>
              <p className="text-gray-400 text-sm">Mundial 2026</p>
            </div>
            <div className="text-right">
              <p className="text-gray-300">Bienvenido/a</p>
              <p className="font-bold text-gold2">{session.display_name}</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress section */}
        {activeTab !== 'market' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <ProgressBar progress={progress} />
          </motion.div>
        )}

        {/* Tab navigation */}
        <motion.div
          className="flex gap-2 mb-8 overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-2 rounded-lg font-semibold uppercase text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gold to-gold2 text-dark shadow-lg shadow-gold/30'
                  : 'bg-surface2 text-gray-300 hover:bg-surface3 border border-surface3'
              }`}
            >
              {tab.label}
              {'badge' in tab && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'market' ? (
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
          ) : loading ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-xl font-display">Cargando figuritas...</div>
            </div>
          ) : (
            <div
              onClick={() => setContextMenu({ ...contextMenu, visible: false })}
              onContextMenu={(e) => {
                if (e.target === e.currentTarget) {
                  e.preventDefault()
                }
              }}
            >
              <StickerGallery
                stickers={displayStickers}
                userStickers={stickers}
                onStickerClick={handleStickerClick}
              />
            </div>
          )}
        </motion.div>

        {/* Instructions */}
        {activeTab !== 'market' && (
          <motion.div
            className="mt-16 text-center text-gray-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p>Haz clic en las figuritas para marcar tu progreso</p>
            <p className="text-xs mt-2 text-gray-500">✓ = No repetida | × = Repetida | ○ = Faltante</p>
          </motion.div>
        )}
      </main>

      {/* Context menu */}
      {contextMenu.visible && (
        <StickerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onOwned={() => handleUpdateSticker('owned')}
          onRepeated={() => handleUpdateSticker('repeated')}
          onMissing={() => handleUpdateSticker('missing')}
          onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        />
      )}
    </div>
  )
}
