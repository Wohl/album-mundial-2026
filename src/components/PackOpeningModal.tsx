'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PackItem } from '@/services/packService'
import { displayKey, getStickerName } from '@/lib/stickers'

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

function rarityColor(key: string): { border: string; glow: string; badge: string } {
  if (key.startsWith('FWC')) return { border: 'rgba(217,70,239,0.7)', glow: '0 0 40px rgba(217,70,239,0.35)', badge: 'bg-holoMagenta/20 text-holoMagenta border-holoMagenta/40' }
  if (key.startsWith('CC'))  return { border: 'rgba(245,197,66,0.7)', glow: '0 0 40px rgba(245,197,66,0.35)', badge: 'bg-gold/20 text-gold border-gold/40' }
  return { border: 'rgba(33,50,85,0.8)', glow: 'none', badge: '' }
}

// ── Particle ─────────────────────────────────────────────────────────
function Particle({ color, delay, x, size }: { color: string; delay: number; x: number; size?: number }) {
  const s = size ?? 6
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ background: color, width: s, height: s, left: `calc(50% + ${x}px)`, bottom: '38%' }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -(120 + Math.random() * 80), opacity: 0, scale: 0, x: x * 0.4 }}
      transition={{ duration: 1.2 + Math.random() * 0.5, delay, ease: 'easeOut' }}
    />
  )
}

// ── Pack SVG — sobre de figuritas ────────────────────────────────────
function PackSVG({ glowing }: { glowing?: boolean }) {
  return (
    <div className="relative w-52 h-80 flex items-center justify-center">
      {/* Glow halo */}
      {glowing && (
        <div className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ boxShadow: '0 0 60px rgba(245,197,66,0.25), 0 0 120px rgba(245,197,66,0.1)' }}
        />
      )}
      {/* Pack body */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #1a2d4a 0%, #0e1e32 40%, #081626 100%)',
          border: '2px solid rgba(245,197,66,0.35)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Top gold stripe */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #F5C542, #FFD700, #F5C542, transparent)' }} />

        {/* Foil shimmer */}
        <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl"
          style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(245,197,66,0.4) 50%, transparent 60%)', backgroundSize: '200% 200%' }}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          {/* Trophy */}
          <div className="relative">
            <div className="absolute inset-0 blur-lg opacity-50" style={{ background: 'radial-gradient(circle, rgba(245,197,66,0.6), transparent)' }} />
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(245,197,66,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl text-gradient-gold uppercase tracking-[0.15em]">Mundial</p>
            <p className="text-gold/40 text-sm tracking-[0.4em] mt-0.5">2026</p>
          </div>
        </div>

        {/* Bottom label */}
        <div className="mb-5 flex justify-center">
          <div className="px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5 text-gold/50 text-[10px] uppercase tracking-[0.3em] font-display">
            Intercambio
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tear overlay — visual de rasgado ─────────────────────────────────
function TearOverlay() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Línea de rasgado horizontal */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ top: '42%', background: 'linear-gradient(90deg, transparent, rgba(245,197,66,0.8), rgba(255,255,255,0.9), rgba(245,197,66,0.8), transparent)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
      {/* Mitad superior sale volando */}
      <motion.div
        className="absolute left-0 right-0 top-0 rounded-t-3xl overflow-hidden"
        style={{ height: '42%', background: 'linear-gradient(160deg, #1a2d4a, #0e1e32)', border: '2px solid rgba(245,197,66,0.35)', transformOrigin: 'top center' }}
        initial={{ y: 0, rotateX: 0, opacity: 1 }}
        animate={{ y: -120, rotateX: -25, opacity: 0 }}
        transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  )
}

export const PackOpeningModal = ({ items, onOpen, onClose }: PackOpeningModalProps) => {
  const [phase, setPhase] = useState<Phase>('sealed')
  const [revealedIdx, setRevealedIdx] = useState(-1)
  const [particles, setParticles] = useState<{ color: string; x: number; size: number; id: number }[]>([])
  const [particleId, setParticleId] = useState(0)
  const [showTear, setShowTear] = useState(false)

  const total = items.length

  const spawnParticles = (count = 20) => {
    const colors = ['#F5C542', '#FFD700', '#FFF5CC', '#38BDF8', '#D946EF', '#84CC16', '#fff']
    const batch = Array.from({ length: count }, (_, i) => ({
      color: colors[i % colors.length],
      x: (Math.random() - 0.5) * 220,
      size: 4 + Math.random() * 6,
      id: particleId + i,
    }))
    setParticleId((p) => p + count)
    setParticles((prev) => [...prev, ...batch])
    setTimeout(() => setParticles((prev) => prev.filter((p) => !batch.find((b) => b.id === p.id))), 1800)
  }

  const handleOpen = async () => {
    setPhase('shaking')
    await delay(700)

    setPhase('ripping')
    setShowTear(true)
    spawnParticles(28)
    await delay(300)

    await onOpen()
    await delay(450)

    setShowTear(false)
    setPhase('revealing')
    for (let i = 0; i < total; i++) {
      await delay(i === 0 ? 100 : 480)
      setRevealedIdx(i)
      if (i < 3) spawnParticles(12)
    }

    await delay(700)
    setPhase('done')
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(6,12,22,0.97)', backdropFilter: 'blur(24px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Fondo geométrico */}
      <div className="absolute inset-0 ball-pattern opacity-25 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(245,197,66,0.04) 0%, transparent 70%)' }}
      />

      {/* Partículas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <Particle key={p.id} color={p.color} x={p.x} size={p.size} delay={0} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center gap-6">

        {/* ── FASE: CERRADO / SACUDIENDO ─────────────────── */}
        <AnimatePresence mode="wait">
          {(phase === 'sealed' || phase === 'shaking') && (
            <motion.div
              key="sealed"
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="flex flex-col items-center gap-7 w-full"
            >
              <div className="text-center">
                <motion.p
                  className="text-[10px] text-surface4 uppercase tracking-[0.45em] mb-2"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                >
                  Intercambio completado
                </motion.p>
                <h2 className="text-4xl font-display text-gradient-gold uppercase tracking-wide">
                  ¡Tenés un sobre!
                </h2>
                <p className="text-surface4 text-sm mt-1.5">
                  {total} {total === 1 ? 'figurita nueva' : 'figuritas nuevas'} te esperan
                </p>
              </div>

              {/* Sobre */}
              <div className="relative">
                <motion.div
                  animate={phase === 'shaking' ? {
                    rotate: [0, -5, 5, -4, 4, -3, 3, -2, 2, 0],
                    y: [0, -6, 0, -4, 0, -2, 0],
                  } : { rotate: 0 }}
                  transition={phase === 'shaking' ? { duration: 0.7, ease: 'easeInOut' } : {}}
                  onClick={phase === 'sealed' ? handleOpen : undefined}
                  whileHover={phase === 'sealed' ? { scale: 1.04, y: -4 } : {}}
                  whileTap={phase === 'sealed' ? { scale: 0.97 } : {}}
                  className={phase === 'sealed' ? 'cursor-pointer' : 'cursor-default'}
                >
                  <PackSVG glowing={phase === 'sealed'} />
                </motion.div>
              </div>

              <motion.button
                onClick={phase === 'sealed' ? handleOpen : undefined}
                disabled={phase === 'shaking'}
                className="px-10 py-4 rounded-2xl font-display text-xl uppercase tracking-[0.15em] text-dark font-bold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)', boxShadow: '0 0 32px rgba(255,215,0,0.45)' }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 56px rgba(255,215,0,0.65)' }}
                whileTap={{ scale: 0.96 }}
              >
                {phase === 'shaking' ? 'Abriendo...' : '¡Abrir sobre!'}
              </motion.button>
            </motion.div>
          )}

          {/* ── FASE: RASGANDO ─────────────────────────── */}
          {phase === 'ripping' && (
            <motion.div
              key="ripping"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative">
                <PackSVG />
                <AnimatePresence>{showTear && <TearOverlay />}</AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── FASE: REVELANDO ────────────────────────── */}
          {phase === 'revealing' && (
            <motion.div
              key="revealing"
              className="w-full flex flex-col items-center gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center">
                <p className="text-[10px] text-surface4 uppercase tracking-[0.4em] mb-1">Tus figuritas nuevas</p>
                <h2 className="text-3xl font-display text-gradient-gold uppercase">
                  {revealedIdx >= 0 ? revealedIdx + 1 : '…'} <span className="text-surface4 text-xl">/ {total}</span>
                </h2>
              </div>

              <AnimatePresence mode="wait">
                {revealedIdx >= 0 && items[revealedIdx] && (
                  <RevealCard key={revealedIdx} item={items[revealedIdx]} />
                )}
              </AnimatePresence>

              {revealedIdx > 0 && (
                <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
                  {items.slice(0, revealedIdx).map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-9 h-12 rounded-lg border flex flex-col items-center justify-center text-[8px] font-mono font-bold"
                      style={{
                        background: 'linear-gradient(160deg, #132030, #0F172A)',
                        borderColor: isSpecial(item.sticker_key) ? 'rgba(245,197,66,0.5)' : 'rgba(33,50,85,0.8)',
                        color: isSpecial(item.sticker_key) ? '#F5C542' : 'rgba(245,197,66,0.5)',
                      }}
                    >
                      {displayKey(item.sticker_key)}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── FASE: LISTO ─────────────────────────────── */}
          {phase === 'done' && (
            <motion.div
              key="done"
              className="flex flex-col items-center gap-5 w-full"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(245,197,66,0.18), rgba(255,215,0,0.06))', border: '1.5px solid rgba(245,197,66,0.35)' }}
                  animate={{ boxShadow: ['0 0 20px rgba(255,215,0,0.3)', '0 0 50px rgba(255,215,0,0.6)', '0 0 20px rgba(255,215,0,0.3)'] }}
                  transition={{ repeat: 2, duration: 1 }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                  </svg>
                </motion.div>
                <h2 className="text-3xl font-display text-gradient-gold uppercase mb-1">¡Listo!</h2>
                <p className="text-surface4 text-sm">
                  {total} {total === 1 ? 'figurita agregada' : 'figuritas agregadas'} a tu álbum
                </p>
              </div>

              {/* Grid de todas las cards */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full max-w-sm">
                {items.map((item, i) => {
                  const special = isSpecial(item.sticker_key)
                  const { border, glow } = rarityColor(item.sticker_key)
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 24 }}
                      className="aspect-[2/3] rounded-xl border flex flex-col items-center justify-center p-1.5 text-center gap-0.5"
                      style={{
                        background: 'linear-gradient(170deg, #132030 0%, #0F172A 100%)',
                        borderColor: border,
                        boxShadow: special ? glow : 'none',
                      }}
                    >
                      <p className="text-[8px] font-mono font-bold text-gold leading-none">
                        {displayKey(item.sticker_key)}
                      </p>
                      {stickerTeam(item.sticker_key) && (
                        <p className="text-[7px] text-surface4 truncate w-full text-center">
                          {stickerTeam(item.sticker_key)}
                        </p>
                      )}
                      <div className="mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <motion.button
                onClick={onClose}
                className="px-10 py-3.5 rounded-xl font-display text-lg uppercase tracking-[0.12em] text-dark font-bold"
                style={{ background: 'linear-gradient(135deg, #F5C542, #FFD700)', boxShadow: '0 0 28px rgba(255,215,0,0.35)' }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 44px rgba(255,215,0,0.55)' }}
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

// ── Carta revelada ────────────────────────────────────────────────────
function RevealCard({ item }: { item: PackItem }) {
  const special = isSpecial(item.sticker_key)
  const team = stickerTeam(item.sticker_key)
  const name = getStickerName(item.sticker_key)
  const { border, glow, badge } = rarityColor(item.sticker_key)

  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.65, opacity: 0 }}
      animate={{ rotateY: 0, scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0, rotateY: -30 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{
        perspective: '900px',
        background: special
          ? 'linear-gradient(160deg, rgba(60,30,90,0.7) 0%, #0F172A 60%)'
          : 'linear-gradient(160deg, rgba(19,32,48,0.95) 0%, #0F172A 100%)',
        borderColor: border,
        boxShadow: special
          ? `${glow}, 0 24px 64px rgba(0,0,0,0.85)`
          : '0 24px 64px rgba(0,0,0,0.85)',
      }}
      className="relative w-44 h-64 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 overflow-hidden"
    >
      {/* Acento superior */}
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: special ? `linear-gradient(90deg, transparent, ${border}, transparent)` : 'linear-gradient(90deg, transparent, rgba(33,50,85,0.6), transparent)' }}
      />

      {/* Badge rareza */}
      {special && (
        <div className={`absolute top-2.5 left-2.5 text-[7px] font-bold px-1.5 py-0.5 rounded-md tracking-widest uppercase border ${badge}`}>
          {item.sticker_key.startsWith('FWC') ? '✦ LEYENDA' : '★ ESPECIAL'}
        </div>
      )}

      {/* Shimmer holográfico */}
      {special && (
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] opacity-25"
          style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(217,70,239,0.4) 50%, rgba(56,189,248,0.4) 65%, transparent 80%)' }}
        />
      )}

      {/* Ícono */}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
        special ? 'bg-gradient-to-br from-holoMagenta/15 to-holoCyan/10' : 'bg-surface3/40'
      }`}>
        {item.sticker_key.startsWith('FWC') ? '✦' : item.sticker_key.startsWith('CC') ? '🥤' : '🃏'}
      </div>

      {/* Info */}
      <div className="text-center px-3 space-y-0.5">
        <p className={`font-display text-sm font-bold leading-tight line-clamp-2 ${special ? 'text-gold' : 'text-white/90'}`}>
          {name}
        </p>
        {team && (
          <p className="text-surface4 text-[10px] uppercase tracking-wider">{team}</p>
        )}
        <p className={`font-mono text-[10px] ${special ? 'text-gold/60' : 'text-gold/40'}`}>
          {displayKey(item.sticker_key)}
        </p>
      </div>

      {/* Badge nueva */}
      <div className="px-3 py-1 rounded-full border border-green-600/40 bg-green-900/30 text-green-400 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        ¡Nueva!
      </div>
    </motion.div>
  )
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}
