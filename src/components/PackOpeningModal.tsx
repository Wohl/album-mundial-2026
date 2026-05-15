'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PackItem } from '@/services/packService'
import { displayKey } from '@/lib/stickers'

interface PackOpeningModalProps {
  items: PackItem[]
  onOpen: () => Promise<void>
  onClose: () => void
}

type Phase = 'sealed' | 'shaking' | 'ripping' | 'revealing' | 'done'

function stickerTeam(key: string): string {
  const parts = key.split('_')
  if (parts.length >= 2) return parts[0]
  return ''
}

function isSpecial(key: string): boolean {
  return key.startsWith('FWC') || key.startsWith('CC')
}

// Partícula flotante
function Particle({ color, delay, x }: { color: string; delay: number; x: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{ background: color, left: `calc(50% + ${x}px)`, bottom: '40%' }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -150, opacity: 0, scale: 0, x: x * 0.5 }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
    />
  )
}

export const PackOpeningModal = ({ items, onOpen, onClose: _onClose }: PackOpeningModalProps) => {
  const [phase, setPhase] = useState<Phase>('sealed')
  const [revealedIdx, setRevealedIdx] = useState(-1)
  const [particles, setParticles] = useState<{ color: string; x: number; id: number }[]>([])
  const [particleId, setParticleId] = useState(0)

  const total = items.length

  const spawnParticles = () => {
    const colors = ['#F5C542', '#FFD700', '#38BDF8', '#D946EF', '#84CC16', '#fff']
    const batch = Array.from({ length: 18 }, (_, i) => ({
      color: colors[i % colors.length],
      x: (Math.random() - 0.5) * 180,
      id: particleId + i,
    }))
    setParticleId((p) => p + 18)
    setParticles((prev) => [...prev, ...batch])
    setTimeout(() => setParticles((prev) => prev.filter((p) => !batch.find((b) => b.id === p.id))), 1600)
  }

  const handleOpen = async () => {
    // Fase: sacudir
    setPhase('shaking')
    await delay(700)

    // Fase: rasgar
    setPhase('ripping')
    spawnParticles()
    await delay(500)

    // Marcar como abiertos en DB
    await onOpen()

    // Fase: revelar cartas una por una
    setPhase('revealing')
    for (let i = 0; i < total; i++) {
      await delay(i === 0 ? 200 : 500)
      setRevealedIdx(i)
      spawnParticles()
    }

    await delay(600)
    setPhase('done')
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,17,32,0.97)', backdropFilter: 'blur(24px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Fondo — campo con luces */}
      <div className="absolute inset-0 ball-pattern opacity-30 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(56,189,248,0.04) 0%, transparent 70%)' }}
      />

      {/* Partículas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <Particle key={p.id} color={p.color} x={p.x} delay={0} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center gap-6">

        {/* ── FASE: CERRADO / SACUDIENDO ─────────────────────────── */}
        <AnimatePresence mode="wait">
          {(phase === 'sealed' || phase === 'shaking') && (
            <motion.div
              key="sealed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0, y: -60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="flex flex-col items-center gap-8 w-full"
            >
              {/* Header */}
              <div className="text-center">
                <motion.p
                  className="text-[10px] text-surface4 uppercase tracking-[0.4em] mb-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  Intercambio completado
                </motion.p>
                <h2 className="text-4xl font-display text-gradient-gold uppercase tracking-wide">
                  ¡Tenés un sobre!
                </h2>
                <p className="text-surface4 text-sm mt-2">
                  {total} {total === 1 ? 'figurita nueva' : 'figuritas nuevas'} te esperan
                </p>
              </div>

              {/* Sobre sellado */}
              <motion.div
                className="pack-sealed pack-glow w-56 h-80 rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none"
                animate={phase === 'shaking' ? { rotate: [0, -4, 4, -3, 3, -2, 2, 0] } : { rotate: 0 }}
                transition={phase === 'shaking' ? { duration: 0.7, ease: 'easeInOut' } : {}}
                onClick={phase === 'sealed' ? handleOpen : undefined}
                whileHover={phase === 'sealed' ? { scale: 1.04 } : {}}
                whileTap={phase === 'sealed' ? { scale: 0.97 } : {}}
              >
                {/* Logo Copa en el sobre */}
                <div className="mb-6">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(245,197,66,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                  </svg>
                </div>
                <p className="font-display text-2xl text-gradient-gold uppercase tracking-widest">Mundial</p>
                <p className="text-gold/50 text-sm tracking-[0.3em] mt-0.5">2026</p>
                <div className="mt-6 px-4 py-1.5 rounded-full border border-gold/25 text-gold/60 text-[10px] uppercase tracking-widest">
                  {total} figurita{total !== 1 ? 's' : ''}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.button
                onClick={phase === 'sealed' ? handleOpen : undefined}
                disabled={phase === 'shaking'}
                className="px-10 py-4 rounded-2xl font-display text-xl uppercase tracking-widest text-dark font-bold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)', boxShadow: '0 0 30px rgba(255,215,0,0.4)' }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(255,215,0,0.6)' }}
                whileTap={{ scale: 0.96 }}
              >
                {phase === 'shaking' ? 'Abriendo...' : '¡Abrir sobre!'}
              </motion.button>
            </motion.div>
          )}

          {/* ── FASE: REVELANDO ──────────────────────────────────── */}
          {(phase === 'revealing' || phase === 'ripping') && (
            <motion.div
              key="revealing"
              className="w-full flex flex-col items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center">
                <p className="text-[10px] text-surface4 uppercase tracking-[0.4em] mb-1">Tus figuritas nuevas</p>
                <h2 className="text-3xl font-display text-gradient-gold uppercase">
                  {revealedIdx + 1} / {total}
                </h2>
              </div>

              {/* Card revelada */}
              <AnimatePresence mode="wait">
                {revealedIdx >= 0 && items[revealedIdx] && (
                  <RevealCard key={revealedIdx} item={items[revealedIdx]} index={revealedIdx} />
                )}
              </AnimatePresence>

              {/* Miniaturas ya reveladas */}
              {revealedIdx > 0 && (
                <div className="flex gap-2 flex-wrap justify-center max-w-xs">
                  {items.slice(0, revealedIdx).map((item, i) => (
                    <div key={i} className="w-8 h-10 rounded-md border border-gold/30 flex items-center justify-center text-[8px] font-mono text-gold/60 bg-surface2">
                      {displayKey(item.sticker_key)}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── FASE: LISTO ──────────────────────────────────────── */}
          {phase === 'done' && (
            <motion.div
              key="done"
              className="flex flex-col items-center gap-6 w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <div className="text-center">
                <motion.div
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(245,197,66,0.15), rgba(255,215,0,0.05))', border: '2px solid rgba(245,197,66,0.35)' }}
                  animate={{ boxShadow: ['0 0 20px rgba(255,215,0,0.3)', '0 0 50px rgba(255,215,0,0.6)', '0 0 20px rgba(255,215,0,0.3)'] }}
                  transition={{ repeat: 2, duration: 1 }}
                >
                  <span className="text-4xl">🏆</span>
                </motion.div>
                <h2 className="text-4xl font-display text-gradient-gold uppercase mb-2">¡Listo!</h2>
                <p className="text-surface4 text-sm">
                  Agregaste {total} {total === 1 ? 'figurita' : 'figuritas'} a tu álbum
                </p>
              </div>

              {/* Todas las cards en grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full max-w-sm">
                {items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="aspect-[2/3] rounded-xl border flex flex-col items-center justify-center p-1.5 text-center"
                    style={{
                      background: 'linear-gradient(170deg, #132030 0%, #0F172A 100%)',
                      borderColor: isSpecial(item.sticker_key) ? 'rgba(245,197,66,0.4)' : 'rgba(33,50,85,0.8)',
                      boxShadow: isSpecial(item.sticker_key) ? '0 0 12px rgba(245,197,66,0.2)' : 'none',
                    }}
                  >
                    <p className="text-[8px] font-mono font-bold text-gold leading-none mb-0.5">
                      {displayKey(item.sticker_key)}
                    </p>
                    {stickerTeam(item.sticker_key) && (
                      <p className="text-[7px] text-surface4 truncate w-full text-center">
                        {stickerTeam(item.sticker_key)}
                      </p>
                    )}
                    <div className="mt-1 text-green-400 text-[9px]">✓</div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                onClick={() => {
                  // El modal desaparece porque packItems quedó vacío tras openPack()
                }}
                className="px-10 py-3.5 rounded-xl font-display text-lg uppercase tracking-widest text-dark font-bold"
                style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Perfecto
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Componente de carta revelada ───────────────────────────────────
function RevealCard({ item, index }: { item: PackItem; index: number }) {
  const special = isSpecial(item.sticker_key)
  const team = stickerTeam(item.sticker_key)

  const cardStyle = special
    ? { background: 'linear-gradient(170deg, rgba(80,40,0,0.5) 0%, #0F172A 100%)', borderColor: 'rgba(255,215,0,0.6)', boxShadow: '0 0 40px rgba(255,215,0,0.3), 0 20px 60px rgba(0,0,0,0.8)', perspective: '800px' }
    : { background: 'linear-gradient(170deg, rgba(19,32,48,0.9) 0%, #0F172A 100%)', borderColor: 'rgba(33,50,85,0.8)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', perspective: '800px' }

  return (
    <motion.div
      key={index}
      initial={{ rotateY: 90, scale: 0.7, opacity: 0 }}
      animate={{ rotateY: 0, scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={cardStyle}
      className="relative w-44 h-64 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 overflow-hidden"
    >
      {/* Brillo top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${special ? 'bg-gradient-to-r from-gold via-gold2 to-gold' : 'bg-gradient-to-r from-transparent via-surface4/50 to-transparent'}`} />

      {/* Badge rareza */}
      {special && (
        <div className="absolute top-2.5 left-2.5 badge-foil text-dark text-[7px] font-bold px-1.5 py-0.5 rounded-md tracking-widest uppercase">
          ★ ESPECIAL
        </div>
      )}

      {/* Ícono */}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${special ? 'bg-gradient-to-br from-gold/20 to-transparent' : 'bg-surface3/50'}`}>
        {special ? '⭐' : '📋'}
      </div>

      {/* Info */}
      <div className="text-center px-3">
        <p className={`font-mono text-sm font-bold leading-none mb-1 ${special ? 'text-gold' : 'text-gold/70'}`}>
          {displayKey(item.sticker_key)}
        </p>
        {team && (
          <p className="text-surface4 text-[10px] uppercase tracking-wider">{team}</p>
        )}
      </div>

      {/* Texto nuevo */}
      <div className="px-3 py-1 rounded-full border border-green-700/40 bg-green-900/30 text-green-400 text-[10px] font-bold tracking-widest uppercase">
        ¡Nueva!
      </div>

      {/* Overlay shimmer si es especial */}
      {special && (
        <div className="absolute inset-0 foil-active pointer-events-none rounded-[inherit]" />
      )}
    </motion.div>
  )
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}
