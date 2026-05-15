'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PackItem } from '@/services/packService'
import { displayKey, getStickerName } from '@/lib/stickers'

interface PackOpeningModalProps {
  items: PackItem[]
  onOpen: () => Promise<void>
  onClose: () => void
}

type Phase = 'sealed' | 'shaking' | 'ripping' | 'revealing' | 'done'

// ── Helpers ────────────────────────────────────────────────────────────────

function stickerTeam(key: string): string {
  const parts = key.split('_')
  return parts.length >= 2 ? parts[0] : ''
}

function isSpecial(key: string): boolean {
  return key.startsWith('FWC') || key.startsWith('CC') || key.startsWith('P0')
}

function rarityLabel(key: string): string | null {
  if (key.startsWith('FWC') || key.startsWith('P0')) return '✦ LEYENDA'
  if (key.startsWith('CC')) return '★ ESPECIAL'
  return null
}

function rarityConfig(key: string) {
  if (key.startsWith('FWC') || key.startsWith('P0')) return {
    borderColor: 'rgba(217,70,239,0.85)',
    glowShadow: '0 0 60px rgba(217,70,239,0.6), 0 0 120px rgba(56,189,248,0.25)',
    cardBg: 'linear-gradient(170deg, #2d0545 0%, #18002e 55%, #090018 100%)',
    accent: '#D946EF',
    accentRgb: '217,70,239',
    shimmer: 'linear-gradient(115deg, transparent 20%, rgba(217,70,239,0.4) 38%, rgba(56,189,248,0.35) 52%, rgba(132,204,22,0.25) 64%, transparent 78%)',
    isHolo: true,
  }
  if (key.startsWith('CC')) return {
    borderColor: 'rgba(245,197,66,0.9)',
    glowShadow: '0 0 60px rgba(245,197,66,0.55), 0 0 120px rgba(255,215,0,0.18)',
    cardBg: 'linear-gradient(170deg, #3a2800 0%, #1c1200 55%, #0d0900 100%)',
    accent: '#FFD700',
    accentRgb: '255,215,0',
    shimmer: 'linear-gradient(115deg, transparent 20%, rgba(245,197,66,0.45) 38%, rgba(255,255,255,0.22) 52%, rgba(245,197,66,0.35) 64%, transparent 78%)',
    isHolo: true,
  }
  return {
    borderColor: 'rgba(28,45,72,1)',
    glowShadow: 'none',
    cardBg: 'linear-gradient(170deg, #152030 0%, #0d1c2e 100%)',
    accent: 'rgba(245,197,66,0.75)',
    accentRgb: '245,197,66',
    shimmer: null,
    isHolo: false,
  }
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ── Particle ────────────────────────────────────────────────────────────────

interface ParticleData {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  shape: 'circle' | 'rect' | 'diamond'
  spinDir: 1 | -1
  delay: number
}

function Particle({ p }: { p: ParticleData }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `calc(50% + ${p.x}px)`,
        top: `calc(50% + ${p.y}px)`,
        width: p.size,
        height: p.shape === 'rect' ? p.size * 0.35 : p.size,
        background: p.color,
        borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '0',
        transform: p.shape === 'diamond' ? 'rotate(45deg)' : 'none',
        zIndex: 40,
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={{
        x: p.vx * 180,
        y: p.vy * 180 + 60,
        opacity: [1, 1, 0],
        scale: [1, 1, 0],
        rotate: p.spinDir * 540,
      }}
      transition={{
        duration: 1.3 + p.delay * 0.4,
        delay: p.delay * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { times: [0, 0.6, 1] },
        scale: { times: [0, 0.6, 1] },
      }}
    />
  )
}

// ── Pack visual (sellado) ───────────────────────────────────────────────────

function PackBody() {
  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(168deg, #1c3358 0%, #0f2140 30%, #071830 65%, #040e1e 100%)',
        border: '2px solid rgba(245,197,66,0.38)',
        boxShadow: '0 28px 80px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07)',
        borderRadius: '1.5rem',
      }}
    >
      {/* Perforated tear strip */}
      <div className="h-8 shrink-0 relative flex items-center justify-center border-b-2 border-dashed border-gold/15 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #162840, #1e3558, #162840)' }} />
        <div className="relative flex items-center gap-1.5">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-gold/25" />
          ))}
        </div>
        <span className="absolute right-3 text-[7px] uppercase tracking-[0.3em] text-gold/20 font-display">Abrir</span>
      </div>

      {/* Diagonal foil stripe (decorative) */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{ background: 'linear-gradient(128deg, transparent 38%, rgba(245,197,66,0.04) 46%, rgba(255,255,255,0.04) 50%, rgba(56,189,248,0.03) 54%, transparent 62%)' }}
      />

      {/* Animated shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut', repeatDelay: 1.2 }}
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.05) 50%, transparent)', width: '55%' }}
      />

      {/* Holo strip on right edge */}
      <div
        className="absolute right-3 top-10 bottom-6 w-1.5 rounded-full"
        style={{ background: 'linear-gradient(to bottom, rgba(217,70,239,0.6), rgba(56,189,248,0.6), rgba(132,204,22,0.5), rgba(245,197,66,0.7))' }}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        {/* Trophy with glow */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 blur-2xl rounded-full"
            animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.9, 1.25, 0.9] }}
            transition={{ repeat: Infinity, duration: 2.6 }}
            style={{ background: 'radial-gradient(circle, rgba(245,197,66,0.55) 0%, transparent 70%)' }}
          />
          <svg
            width="58" height="58" viewBox="0 0 24 24" fill="none"
            className="relative z-10"
            style={{ filter: 'drop-shadow(0 0 10px rgba(245,197,66,0.65)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 22h16" stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="font-display text-[28px] text-gradient-gold uppercase tracking-[0.18em] leading-none">Mundial</p>
          <p className="font-display text-base text-gold/50 tracking-[0.55em] mt-1">2026</p>
        </div>

        {/* Stars row */}
        <div className="flex gap-2 mt-0.5">
          {[0.25, 0.5, 1, 0.5, 0.25].map((o, i) => (
            <span key={i} className="text-gold text-[10px]" style={{ opacity: o }}>★</span>
          ))}
        </div>
      </div>

      {/* Bottom label */}
      <div className="pb-5 flex justify-center">
        <div
          className="px-4 py-1 rounded-full text-[9px] uppercase tracking-[0.35em] font-display"
          style={{ border: '1px solid rgba(245,197,66,0.2)', color: 'rgba(245,197,66,0.4)', background: 'rgba(245,197,66,0.04)' }}
        >
          Intercambio
        </div>
      </div>
    </div>
  )
}

// ── RevealCard (flip 3D) ───────────────────────────────────────────────────

function RevealCard({ item }: { item: PackItem }) {
  const [imgError, setImgError] = useState(false)
  const special = isSpecial(item.sticker_key)
  const cfg = rarityConfig(item.sticker_key)
  const label = rarityLabel(item.sticker_key)
  const name = getStickerName(item.sticker_key)
  const team = stickerTeam(item.sticker_key)
  const dk = displayKey(item.sticker_key)
  const imgSrc = team ? `/players/${team}/${dk}.png` : null

  return (
    <motion.div
      key={item.sticker_key}
      style={{ perspective: '1100px', width: 168, height: 248 }}
      className="shrink-0"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      {/* Holo border pulsing ring */}
      {cfg.isHolo && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ zIndex: -1, margin: -3 }}
          animate={{ boxShadow: [cfg.glowShadow, cfg.glowShadow.replace('0.6', '0.9').replace('0.25', '0.4'), cfg.glowShadow] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        />
      )}

      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        initial={{ rotateY: 180 }}
        animate={{ rotateY: 0 }}
        transition={{ duration: 0.72, ease: [0.34, 1.04, 0.64, 1], delay: 0.06 }}
      >
        {/* ─ Card back ─ */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(165deg, #1a2d4a 0%, #0e1e32 100%)',
            border: '2px solid rgba(245,197,66,0.25)',
          }}
        >
          <div className="card-back-pattern absolute inset-0 opacity-80 rounded-2xl" />
          <div className="ball-pattern absolute inset-0 opacity-30 rounded-2xl" />
          <div className="relative flex flex-col items-center gap-2 opacity-30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
            </svg>
            <span className="font-display text-xs text-gold tracking-widest">PANINI</span>
          </div>
        </div>

        {/* ─ Card front ─ */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            background: cfg.cardBg,
            border: `2px solid ${cfg.borderColor}`,
            boxShadow: cfg.glowShadow !== 'none' ? `${cfg.glowShadow}, 0 32px 80px rgba(0,0,0,0.9)` : '0 32px 80px rgba(0,0,0,0.9)',
          }}
        >
          {/* Top accent line */}
          <div className="h-0.5 w-full shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${cfg.borderColor}, transparent)` }} />

          {/* Holo shimmer overlay */}
          {cfg.shimmer && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-10 rounded-[inherit]"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
              style={{ background: cfg.shimmer, backgroundSize: '250% 100%', opacity: 0.8, mixBlendMode: 'screen' }}
            />
          )}

          {/* Rarity badge */}
          {label && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 380 }}
              className="absolute top-2.5 left-2.5 z-20 text-[7px] font-bold px-1.5 py-0.5 rounded tracking-[0.15em] uppercase"
              style={{ color: cfg.accent, border: `1px solid ${cfg.borderColor}`, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            >
              {label}
            </motion.div>
          )}

          {/* Player image or fallback icon */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            {imgSrc && !imgError ? (
              <img
                src={imgSrc}
                alt={name}
                className="w-full h-full object-cover object-top"
                style={{ filter: 'contrast(1.05) saturate(1.1)' }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="text-5xl opacity-40">
                {item.sticker_key.startsWith('FWC') ? '✦' : item.sticker_key.startsWith('CC') ? '🥤' : '🃏'}
              </div>
            )}
            {/* Bottom fade */}
            <div
              className="absolute inset-x-0 bottom-0 h-20 pointer-events-none z-10"
              style={{ background: `linear-gradient(to top, ${special ? 'rgba(10,0,25,0.95)' : 'rgba(10,18,30,0.95)'}, transparent)` }}
            />
          </div>

          {/* Info panel */}
          <div className="relative z-20 px-3 pb-2.5 text-center">
            <p
              className="font-display text-sm leading-tight line-clamp-2 mt-1"
              style={{ color: special ? cfg.accent : '#F3F4F6' }}
            >
              {name}
            </p>
            {team && (
              <p className="text-[8px] uppercase tracking-[0.2em] mt-0.5" style={{ color: 'rgba(163,180,210,0.6)' }}>
                {team}
              </p>
            )}
            <p className="font-mono text-[8px] mt-0.5" style={{ color: `${cfg.accent}70` }}>{dk}</p>
          </div>

          {/* Nueva badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 420 }}
            className="absolute bottom-2 right-2 z-20 px-1.5 py-0.5 rounded-full text-[7px] font-bold tracking-widest uppercase flex items-center gap-0.5"
            style={{ background: 'rgba(22,163,74,0.18)', border: '1px solid rgba(34,197,94,0.45)', color: '#4ade80' }}
          >
            ✓ Nueva
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Mini card thumbnail (strip de previas) ─────────────────────────────────

function MiniCard({ item, index }: { item: PackItem; index: number }) {
  const cfg = rarityConfig(item.sticker_key)
  const dk = displayKey(item.sticker_key)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 320, damping: 22 }}
      className="w-8 h-12 rounded-md shrink-0 flex flex-col items-center justify-center"
      style={{
        background: cfg.cardBg,
        border: `1.5px solid ${cfg.borderColor}`,
        boxShadow: cfg.isHolo ? `0 0 8px rgba(${cfg.accentRgb},0.4)` : 'none',
      }}
    >
      <p className="text-[6px] font-mono font-bold leading-none" style={{ color: cfg.accent }}>{dk}</p>
    </motion.div>
  )
}

// ── Done grid card ─────────────────────────────────────────────────────────

function DoneCard({ item, index }: { item: PackItem; index: number }) {
  const [imgError, setImgError] = useState(false)
  const cfg = rarityConfig(item.sticker_key)
  const dk = displayKey(item.sticker_key)
  const team = stickerTeam(item.sticker_key)
  const name = getStickerName(item.sticker_key)
  const imgSrc = team ? `/players/${team}/${dk}.png` : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.82 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.045, type: 'spring', stiffness: 300, damping: 24 }}
      className="aspect-[2/3] rounded-xl overflow-hidden flex flex-col relative"
      style={{
        background: cfg.cardBg,
        border: `1.5px solid ${cfg.borderColor}`,
        boxShadow: cfg.isHolo ? `0 0 14px rgba(${cfg.accentRgb},0.4)` : '0 4px 12px rgba(0,0,0,0.6)',
      }}
    >
      {/* Image */}
      <div className="flex-1 relative overflow-hidden">
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={name}
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <span className="text-2xl">{item.sticker_key.startsWith('FWC') ? '✦' : item.sticker_key.startsWith('CC') ? '🥤' : '🃏'}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: `linear-gradient(to top, ${isSpecial(item.sticker_key) ? 'rgba(10,0,20,1)' : 'rgba(8,18,30,1)'}, transparent)` }} />
      </div>
      {/* Label */}
      <div className="px-1.5 pb-1.5 shrink-0 text-center">
        <p className="text-[7px] font-mono font-bold" style={{ color: cfg.accent }}>{dk}</p>
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export const PackOpeningModal = ({ items, onOpen, onClose }: PackOpeningModalProps) => {
  const [phase, setPhase] = useState<Phase>('sealed')
  const [revealedIdx, setRevealedIdx] = useState(-1)
  const [particles, setParticles] = useState<ParticleData[]>([])
  const [showFlash, setShowFlash] = useState(false)
  const [showTear, setShowTear] = useState(false)
  const particleIdRef = useRef(0)
  const total = items.length

  const spawnParticles = (count: number, intensity: number = 1) => {
    const colors = ['#F5C542', '#FFD700', '#FFF5CC', '#D946EF', '#38BDF8', '#84CC16', '#ffffff', '#F5C542', '#FFD700']
    const shapes: ParticleData['shape'][] = ['circle', 'rect', 'diamond', 'circle', 'circle']
    const batch: ParticleData[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
      const speed = (0.4 + Math.random() * 0.8) * intensity
      return {
        id: particleIdRef.current + i,
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.3,
        color: colors[i % colors.length],
        size: 4 + Math.random() * 7,
        shape: shapes[i % shapes.length],
        spinDir: Math.random() > 0.5 ? 1 : -1,
        delay: Math.random() * 4,
      }
    })
    particleIdRef.current += count
    setParticles((prev) => [...prev, ...batch])
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !batch.find((b) => b.id === p.id)))
    }, 2200)
  }

  const handleOpen = async () => {
    // Shake
    setPhase('shaking')
    await delay(750)

    // Flash + tear
    setShowFlash(true)
    await delay(80)
    setShowFlash(false)
    setPhase('ripping')
    setShowTear(true)
    spawnParticles(36, 1.1)
    await delay(260)

    // Call backend
    await onOpen()
    await delay(480)

    // Reveal phase
    setShowTear(false)
    setPhase('revealing')

    for (let i = 0; i < total; i++) {
      await delay(i === 0 ? 90 : isSpecial(items[i]?.sticker_key ?? '') ? 1300 : 560)
      setRevealedIdx(i)
      if (i < 4) spawnParticles(isSpecial(items[i]?.sticker_key ?? '') ? 22 : 10, isSpecial(items[i]?.sticker_key ?? '') ? 1.3 : 0.7)
    }

    await delay(800)
    setPhase('done')
    spawnParticles(28, 0.9)
  }

  const ambientStars = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 3,
  }))

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'rgba(4,8,18,0.98)', backdropFilter: 'blur(28px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 ball-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 65% 45% at 50% 50%, rgba(245,197,66,0.05) 0%, transparent 65%)' }}
      />

      {/* Ambient floating stars */}
      {ambientStars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.5 + s.delay, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* ── Screen flash ── */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.28 }}
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,240,180,0.95), rgba(245,197,66,0.6) 40%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      {/* ── Particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        {particles.map((p) => <Particle key={p.id} p={p} />)}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center gap-6">

        <AnimatePresence mode="wait">

          {/* ════════ FASE: SELLADO ════════ */}
          {(phase === 'sealed' || phase === 'shaking') && (
            <motion.div
              key="sealed"
              className="flex flex-col items-center gap-7 w-full"
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.78, opacity: 0, y: -60, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              {/* Header text */}
              <div className="text-center">
                <motion.p
                  className="text-[9px] uppercase tracking-[0.5em] mb-2"
                  style={{ color: 'rgba(163,180,210,0.55)' }}
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2.4 }}
                >
                  Intercambio completado
                </motion.p>
                <h2 className="text-4xl font-display text-gradient-gold uppercase tracking-wide">
                  ¡Tenés un sobre!
                </h2>
                <p className="mt-1.5 text-sm" style={{ color: 'rgba(163,180,210,0.6)' }}>
                  {total} {total === 1 ? 'figurita nueva' : 'figuritas nuevas'} te esperan
                </p>
              </div>

              {/* Pack */}
              <div className="relative" style={{ width: 200, height: 300 }}>
                {/* Outer glow (pulsing) */}
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(245,197,66,0.15), 0 0 60px rgba(245,197,66,0.05)',
                      '0 0 70px rgba(245,197,66,0.35), 0 0 130px rgba(245,197,66,0.12)',
                      '0 0 30px rgba(245,197,66,0.15), 0 0 60px rgba(245,197,66,0.05)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2.3 }}
                />

                <motion.div
                  className="w-full h-full rounded-3xl"
                  animate={phase === 'shaking' ? {
                    x: [0, -7, 8, -7, 6, -4, 5, -3, 2, 0],
                    y: [0, -4, 0, -5, 1, -3, 0, -2, 0, 0],
                    rotate: [0, -3, 3, -2.5, 2, -1.5, 1.5, -1, 0.5, 0],
                  } : {
                    y: [0, -6, 0],
                  }}
                  transition={phase === 'shaking' ? {
                    duration: 0.72, ease: 'easeInOut',
                  } : {
                    repeat: Infinity, duration: 3.2, ease: 'easeInOut',
                  }}
                  whileHover={phase === 'sealed' ? { scale: 1.035, y: -5 } : {}}
                  whileTap={phase === 'sealed' ? { scale: 0.97 } : {}}
                  onClick={phase === 'sealed' ? handleOpen : undefined}
                  style={{ cursor: phase === 'sealed' ? 'pointer' : 'default' }}
                >
                  <PackBody />
                </motion.div>
              </div>

              {/* CTA button */}
              <motion.button
                onClick={phase === 'sealed' ? handleOpen : undefined}
                disabled={phase === 'shaking'}
                className="relative px-12 py-4 rounded-2xl font-display text-xl uppercase tracking-[0.18em] text-dark font-bold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #F5C542 0%, #FFD700 50%, #F5C542 100%)',
                  boxShadow: '0 0 36px rgba(255,215,0,0.5), 0 6px 20px rgba(0,0,0,0.5)',
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(255,215,0,0.7), 0 8px 24px rgba(0,0,0,0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', repeatDelay: 1.5 }}
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.35), transparent)', width: '50%' }}
                />
                <span className="relative">{phase === 'shaking' ? 'Abriendo…' : '¡Abrir sobre!'}</span>
              </motion.button>
            </motion.div>
          )}

          {/* ════════ FASE: RASGANDO ════════ */}
          {phase === 'ripping' && (
            <motion.div
              key="ripping"
              className="flex flex-col items-center"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative" style={{ width: 200, height: 300 }}>
                <AnimatePresence>
                  {showTear && (
                    <>
                      {/* Top half flies away */}
                      <motion.div
                        className="absolute left-0 right-0 top-0 rounded-t-3xl overflow-hidden"
                        style={{
                          height: '44%',
                          background: 'linear-gradient(168deg, #1c3358 0%, #0f2140 100%)',
                          border: '2px solid rgba(245,197,66,0.35)',
                          transformOrigin: '50% 0%',
                        }}
                        initial={{ y: 0, rotateX: 0, rotateZ: 0, opacity: 1 }}
                        animate={{ y: -220, rotateX: -50, rotateZ: -12, opacity: 0 }}
                        transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      />
                      {/* Bottom half drops */}
                      <motion.div
                        className="absolute left-0 right-0 bottom-0 rounded-b-3xl overflow-hidden"
                        style={{
                          height: '56%',
                          background: 'linear-gradient(168deg, #0f2140 0%, #040e1e 100%)',
                          border: '2px solid rgba(245,197,66,0.25)',
                          transformOrigin: '50% 100%',
                        }}
                        initial={{ y: 0, rotateX: 0, rotateZ: 0, opacity: 1 }}
                        animate={{ y: 140, rotateX: 20, rotateZ: 6, opacity: 0 }}
                        transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      />
                      {/* Tear flash line */}
                      <motion.div
                        className="absolute left-0 right-0 h-1"
                        style={{ top: '43%', background: 'linear-gradient(90deg, transparent, #fff 20%, #FFD700 50%, #fff 80%, transparent)', filter: 'blur(1px)' }}
                        initial={{ scaleX: 0, opacity: 1 }}
                        animate={{ scaleX: [0, 1.1, 1], opacity: [1, 1, 0] }}
                        transition={{ duration: 0.5 }}
                      />
                      {/* Burst halo */}
                      <motion.div
                        className="absolute pointer-events-none"
                        style={{ top: '35%', left: '15%', right: '15%', height: '20%' }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.8, 2.5] }}
                        transition={{ duration: 0.6 }}
                      >
                        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,240,180,0.55), transparent 70%)' }} />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ════════ FASE: REVELANDO ════════ */}
          {phase === 'revealing' && (
            <motion.div
              key="revealing"
              className="w-full flex flex-col items-center gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Counter */}
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-[0.45em] mb-1.5" style={{ color: 'rgba(163,180,210,0.55)' }}>
                  Tus figuritas nuevas
                </p>
                <motion.h2
                  key={revealedIdx}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="text-3xl font-display text-gradient-gold uppercase"
                >
                  {revealedIdx >= 0 ? revealedIdx + 1 : '…'}
                  <span className="text-lg ml-1" style={{ color: 'rgba(163,180,210,0.45)' }}>/ {total}</span>
                </motion.h2>
              </div>

              {/* Progress dots */}
              <div className="flex gap-1.5">
                {items.map((_, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    style={{ width: 6, height: 6 }}
                    animate={{
                      background: i <= revealedIdx
                        ? (isSpecial(items[i].sticker_key) ? '#D946EF' : '#F5C542')
                        : 'rgba(33,50,85,0.8)',
                      scale: i === revealedIdx ? 1.5 : 1,
                    }}
                    transition={{ duration: 0.25 }}
                  />
                ))}
              </div>

              {/* Revealed card — full 3D flip */}
              <AnimatePresence mode="wait">
                {revealedIdx >= 0 && items[revealedIdx] && (
                  <RevealCard key={revealedIdx} item={items[revealedIdx]} />
                )}
              </AnimatePresence>

              {/* Previous cards strip */}
              {revealedIdx > 0 && (
                <div className="flex gap-1.5 flex-wrap justify-center max-w-[260px]">
                  {items.slice(0, revealedIdx).map((item, i) => (
                    <MiniCard key={i} item={item} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════════ FASE: LISTO ════════ */}
          {phase === 'done' && (
            <motion.div
              key="done"
              className="flex flex-col items-center gap-5 w-full"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              {/* ── Trophy header ── */}
              <div className="relative flex flex-col items-center text-center">
                {/* Blur glow behind trophy */}
                <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(245,197,66,0.22) 0%, transparent 70%)', filter: 'blur(20px)' }}
                  animate={{ scale: [0.85, 1.2, 0.85], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                />

                {/* Trophy circle with ripple rings */}
                <motion.div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,197,66,0.22) 0%, rgba(255,215,0,0.06) 100%)',
                    border: '2px solid rgba(245,197,66,0.55)',
                  }}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{
                    scale: 1,
                    rotate: 0,
                    boxShadow: [
                      '0 0 22px rgba(255,215,0,0.32)',
                      '0 0 65px rgba(255,215,0,0.7), 0 0 110px rgba(255,215,0,0.22)',
                      '0 0 22px rgba(255,215,0,0.32)',
                    ],
                  }}
                  transition={{
                    scale: { type: 'spring', stiffness: 220, damping: 16 },
                    rotate: { duration: 0.5 },
                    boxShadow: { repeat: Infinity, duration: 1.9, delay: 0.5 },
                  }}
                >
                  {/* Expanding ripple rings */}
                  {[0, 0.45, 0.9].map((d, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border border-gold/30"
                      animate={{ scale: [1, 2.4 + i * 0.3], opacity: [0.55, 0] }}
                      transition={{ repeat: Infinity, duration: 1.9, delay: d, ease: 'easeOut' }}
                    />
                  ))}
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/>
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                  </svg>
                </motion.div>

                {/* Floating ✦ sparkles around trophy */}
                {[
                  { x: -52, y:  6, delay: 0.30 },
                  { x:  52, y:  6, delay: 0.42 },
                  { x: -34, y: -20, delay: 0.52 },
                  { x:  34, y: -20, delay: 0.38 },
                  { x:   0, y: -30, delay: 0.48 },
                ].map((s, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-[10px] text-gold pointer-events-none select-none"
                    style={{ left: `calc(50% + ${s.x}px)`, top: `calc(40px + ${s.y}px)` }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.3, 1, 0] }}
                    transition={{ delay: s.delay, duration: 0.75, repeat: Infinity, repeatDelay: 2.6 + i * 0.12 }}
                  >
                    ✦
                  </motion.span>
                ))}

                {/* Title */}
                <motion.h2
                  className="text-4xl font-display text-gradient-gold uppercase tracking-wide"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, type: 'spring', stiffness: 280, damping: 22 }}
                >
                  ¡Todo listo!
                </motion.h2>

                {/* Animated gold separator */}
                <motion.div
                  className="h-px my-2.5"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(245,197,66,0.6), transparent)' }}
                  initial={{ width: 0 }}
                  animate={{ width: 170 }}
                  transition={{ delay: 0.3, duration: 0.55, ease: 'easeOut' }}
                />

                <motion.p
                  className="text-sm"
                  style={{ color: 'rgba(163,180,210,0.65)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.38 }}
                >
                  {total} {total === 1 ? 'figurita nueva en tu álbum' : 'figuritas nuevas en tu álbum'}
                </motion.p>
              </div>

              {/* ── Cards grid — adaptive by count ── */}
              <div className={`grid gap-2.5 w-full ${
                total === 1 ? 'grid-cols-1 max-w-[148px] mx-auto'
                : total === 2 ? 'grid-cols-2 max-w-[200px] mx-auto'
                : total <= 4 ? 'grid-cols-2 max-w-xs mx-auto'
                : 'grid-cols-4 max-w-xs mx-auto'
              }`}>
                {items.map((item, i) => (
                  <DoneCard key={i} item={item} index={i} />
                ))}
              </div>

              {/* ── Close button ── */}
              <motion.button
                onClick={onClose}
                className="relative px-12 py-4 rounded-2xl font-display text-xl uppercase tracking-[0.18em] text-dark font-bold overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #F5C542 0%, #FFD700 50%, #F5C542 100%)',
                  boxShadow: '0 0 42px rgba(255,215,0,0.48), 0 8px 22px rgba(0,0,0,0.55)',
                }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52, type: 'spring', stiffness: 280 }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 68px rgba(255,215,0,0.72), 0 8px 24px rgba(0,0,0,0.5)' }}
                whileTap={{ scale: 0.96 }}
              >
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', repeatDelay: 1.5 }}
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.35), transparent)', width: '50%' }}
                />
                <span className="relative">¡Perfecto!</span>
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}
