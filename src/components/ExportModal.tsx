'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { displayKey } from '@/lib/stickers'
import { INTRO_FWC_STICKERS, FINAL_FWC_STICKERS, COCA_COLA_STICKERS, TEAMS } from '@/stickers'
import type { StickerState } from '@/types'

type ExportType = 'missing' | 'full' | 'trade'

interface ExportModalProps {
  stickers: StickerState[]
  onClose: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────

const GROUP_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const

const GROUPED: Record<string, typeof TEAMS> = {}
for (const t of TEAMS) {
  if (!GROUPED[t.group]) GROUPED[t.group] = []
  GROUPED[t.group].push(t)
}

function buildMap(stickers: StickerState[]) {
  return new Map(stickers.map((s) => [s.sticker_key, s]))
}

function todayStr() {
  return new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const W = 56
const SEP = '═'.repeat(W)
const bLine = (content: string) => `║ ${content.padEnd(W - 2)} ║`

function boxHeader(title: string, subtitle: string): string[] {
  return [
    `╔${SEP}╗`,
    bLine(title),
    bLine(subtitle),
    `╚${SEP}╝`,
    '',
  ]
}

// ── Export generators ─────────────────────────────────────────────────

function generateMissing(stickers: StickerState[]): string {
  const m = buildMap(stickers)
  const isMissing = (k: string) => { const s = m.get(k); return !s || s.status === 'missing' }

  const L: string[] = [
    ...boxHeader(
      'ÁLBUM FIFA WORLD CUP 2026 — FIGURITAS FALTANTES',
      `Generado: ${todayStr()}`
    ),
  ]

  let total = 0
  const body: string[] = []

  // FWC Inicial
  const mi = INTRO_FWC_STICKERS.filter((s) => isMissing(s.id))
  total += mi.length
  body.push(`▸ FWC INICIAL ─── ${mi.length} faltante${mi.length !== 1 ? 's' : ''} de 9`)
  if (mi.length === 0) body.push('  (sección completa ✓)')
  else mi.forEach((s) => body.push(`  ${s.id.padEnd(9)} ${s.name}`))
  body.push('')

  // Teams by group
  for (const g of GROUP_ORDER) {
    const teams = GROUPED[g] ?? []
    if (!teams.length) continue
    body.push(`▸ GRUPO ${g} ─── ${teams.map((t) => t.name).join(' · ')}`)
    for (const team of teams) {
      const rows: string[] = []
      for (let i = 0; i < 20; i++) {
        const k = `${team.code}_${i}`
        if (isMissing(k)) { rows.push(`    ${displayKey(k).padEnd(10)} ${team.players[i]}`); total++ }
      }
      if (rows.length === 0) body.push(`  [${team.name} — completa ✓]`)
      else {
        body.push(`  [${team.name} — ${rows.length} faltante${rows.length !== 1 ? 's' : ''}]`)
        body.push(...rows)
      }
    }
    body.push('')
  }

  // FWC Final
  const mf = FINAL_FWC_STICKERS.filter((s) => isMissing(s.id))
  total += mf.length
  body.push(`▸ FWC FINAL ─── ${mf.length} faltante${mf.length !== 1 ? 's' : ''} de 11`)
  if (mf.length === 0) body.push('  (sección completa ✓)')
  else mf.forEach((s) => body.push(`  ${s.id.padEnd(9)} ${s.name}`))
  body.push('')

  // Coca-Cola
  const mc = COCA_COLA_STICKERS.filter((s) => isMissing(s.id))
  total += mc.length
  body.push(`▸ COCA-COLA SPECIAL EDITION ─── ${mc.length} faltante${mc.length !== 1 ? 's' : ''} de 14`)
  if (mc.length === 0) body.push('  (sección completa ✓)')
  else mc.forEach((s) => body.push(`  ${s.id.padEnd(9)} ${s.name}`))

  L.push(`Total faltantes: ${total} de 994`, '', ...body)
  return L.join('\n')
}

function generateFull(stickers: StickerState[]): string {
  const m = buildMap(stickers)
  const icon = (k: string) => {
    const s = m.get(k)
    if (!s || s.status === 'missing') return '✗  '
    if (s.status === 'repeated') return `×${s.repeat_count + 1} `
    return '✓  '
  }

  const owned = stickers.filter((s) => s.status === 'owned').length
  const rep = stickers.filter((s) => s.status === 'repeated').length
  const miss = 994 - owned - rep
  const pct = (((owned + rep) / 994) * 100).toFixed(1)

  const L: string[] = [
    ...boxHeader(
      'ÁLBUM FIFA WORLD CUP 2026 — PROGRESO COMPLETO',
      `Generado: ${todayStr()}`
    ),
    `Progreso: ${owned + rep}/994 (${pct}%)`,
    `✓ ${owned} obtenidas   ×N ${rep} repetidas   ✗ ${miss} faltantes`,
    '',
  ]

  // Intro
  const oi = INTRO_FWC_STICKERS.filter((s) => { const st = m.get(s.id); return st && st.status !== 'missing' }).length
  L.push(`▸ FWC INICIAL ─── ${oi}/9 obtenidas`)
  INTRO_FWC_STICKERS.forEach((s) => L.push(`  ${icon(s.id).padEnd(5)} ${s.id.padEnd(8)} ${s.name}`))
  L.push('')

  // Teams
  for (const g of GROUP_ORDER) {
    const teams = GROUPED[g] ?? []
    if (!teams.length) continue
    L.push(`▸ GRUPO ${g}`)
    for (const team of teams) {
      const keys = Array.from({ length: 20 }, (_, i) => `${team.code}_${i}`)
      const oc = keys.filter((k) => { const s = m.get(k); return s && s.status !== 'missing' }).length
      L.push(`  ── ${team.name} (${oc}/20) ──`)
      for (let i = 0; i < 20; i++) {
        const k = `${team.code}_${i}`
        L.push(`    ${icon(k).padEnd(5)} ${displayKey(k).padEnd(9)} ${team.players[i]}`)
      }
    }
    L.push('')
  }

  // Final
  const of2 = FINAL_FWC_STICKERS.filter((s) => { const st = m.get(s.id); return st && st.status !== 'missing' }).length
  L.push(`▸ FWC FINAL ─── ${of2}/11 obtenidas`)
  FINAL_FWC_STICKERS.forEach((s) => L.push(`  ${icon(s.id).padEnd(5)} ${s.id.padEnd(8)} ${s.name}`))
  L.push('')

  // Coca-Cola
  const occ = COCA_COLA_STICKERS.filter((s) => { const st = m.get(s.id); return st && st.status !== 'missing' }).length
  L.push(`▸ COCA-COLA SPECIAL EDITION ─── ${occ}/14 obtenidas`)
  COCA_COLA_STICKERS.forEach((s) => L.push(`  ${icon(s.id).padEnd(5)} ${s.id.padEnd(8)} ${s.name}`))

  return L.join('\n')
}

function generateTrade(stickers: StickerState[]): string {
  const m = buildMap(stickers)
  const isRep = (k: string) => m.get(k)?.status === 'repeated'
  const isMiss = (k: string) => { const s = m.get(k); return !s || s.status === 'missing' }
  const rc = (k: string) => (m.get(k)?.repeat_count ?? 0) + 1

  const totalRep = stickers.filter((s) => s.status === 'repeated').length
  const totalMiss = 994 - stickers.filter((s) => s.status !== 'missing').length

  const L: string[] = [
    ...boxHeader(
      'ÁLBUM FIFA WORLD CUP 2026 — PARA INTERCAMBIOS',
      `Generado: ${todayStr()}`
    ),
  ]

  // ── TENGO PARA DAR ────────────────────────────────────────────────
  L.push(`✦ TENGO PARA DAR — ${totalRep} figurita${totalRep !== 1 ? 's' : ''} repetida${totalRep !== 1 ? 's' : ''}`)
  L.push('─'.repeat(W + 2), '')

  if (totalRep === 0) {
    L.push('  (Sin figuritas repetidas)', '')
  } else {
    const ri = INTRO_FWC_STICKERS.filter((s) => isRep(s.id))
    if (ri.length) {
      L.push('▸ FWC INICIAL')
      L.push('  ' + ri.map((s) => `${s.id} ×${rc(s.id)}`).join('   '))
      L.push('')
    }

    for (const g of GROUP_ORDER) {
      const teams = GROUPED[g] ?? []
      const hasRep = teams.some((t) =>
        Array.from({ length: 20 }, (_, i) => `${t.code}_${i}`).some(isRep)
      )
      if (!hasRep) continue
      L.push(`▸ GRUPO ${g}`)
      for (const team of teams) {
        const rk = Array.from({ length: 20 }, (_, i) => `${team.code}_${i}`).filter(isRep)
        if (!rk.length) continue
        L.push(`  [${team.name}]  ` + rk.map((k) => `${displayKey(k)} ×${rc(k)}`).join('   '))
      }
      L.push('')
    }

    const rf = FINAL_FWC_STICKERS.filter((s) => isRep(s.id))
    if (rf.length) {
      L.push('▸ FWC FINAL')
      L.push('  ' + rf.map((s) => `${s.id} ×${rc(s.id)}`).join('   '))
      L.push('')
    }

    const rcc = COCA_COLA_STICKERS.filter((s) => isRep(s.id))
    if (rcc.length) {
      L.push('▸ COCA-COLA SPECIAL EDITION')
      L.push('  ' + rcc.map((s) => `${s.id} ×${rc(s.id)}`).join('   '))
      L.push('')
    }
  }

  L.push('', '─'.repeat(W + 2), '')

  // ── NECESITO ──────────────────────────────────────────────────────
  L.push(`✦ NECESITO — ${totalMiss} figurita${totalMiss !== 1 ? 's' : ''} faltante${totalMiss !== 1 ? 's' : ''}`)
  L.push('─'.repeat(W + 2), '')

  if (totalMiss === 0) {
    L.push('  (¡Álbum completo! 🏆)', '')
  } else {
    const mi = INTRO_FWC_STICKERS.filter((s) => isMiss(s.id))
    if (mi.length) {
      L.push('▸ FWC INICIAL')
      L.push('  ' + mi.map((s) => s.id).join(', '))
      L.push('')
    }

    for (const g of GROUP_ORDER) {
      const teams = GROUPED[g] ?? []
      const hasMiss = teams.some((t) =>
        Array.from({ length: 20 }, (_, i) => `${t.code}_${i}`).some(isMiss)
      )
      if (!hasMiss) continue
      L.push(`▸ GRUPO ${g}`)
      for (const team of teams) {
        const mk = Array.from({ length: 20 }, (_, i) => `${team.code}_${i}`)
          .filter(isMiss)
          .map(displayKey)
        if (!mk.length) continue
        L.push(`  [${team.name}]  ` + mk.join(', '))
      }
      L.push('')
    }

    const mf = FINAL_FWC_STICKERS.filter((s) => isMiss(s.id))
    if (mf.length) {
      L.push('▸ FWC FINAL')
      L.push('  ' + mf.map((s) => s.id).join(', '))
      L.push('')
    }

    const mcc = COCA_COLA_STICKERS.filter((s) => isMiss(s.id))
    if (mcc.length) {
      L.push('▸ COCA-COLA SPECIAL EDITION')
      L.push('  ' + mcc.map((s) => s.id).join(', '))
      L.push('')
    }
  }

  return L.join('\n')
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Icons ─────────────────────────────────────────────────────────────

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const MissingIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const FullIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M9 12l2 2 4-4"/>
    <line x1="3" y1="8" x2="21" y2="8"/>
  </svg>
)

const TradeIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── Component ─────────────────────────────────────────────────────────

export function ExportModal({ stickers, onClose }: ExportModalProps) {
  const [selected, setSelected] = useState<ExportType>('missing')
  const [exported, setExported] = useState(false)

  const stats = useMemo(() => {
    const owned = stickers.filter((s) => s.status === 'owned').length
    const repeated = stickers.filter((s) => s.status === 'repeated').length
    const missing = 994 - owned - repeated
    const pct = Math.round(((owned + repeated) / 994) * 100)
    return { owned, repeated, missing, pct }
  }, [stickers])

  const options: {
    id: ExportType
    label: string
    desc: string
    icon: JSX.Element
    count: string
    accentBg: string
  }[] = [
    {
      id: 'missing',
      label: 'Figuritas Faltantes',
      desc: 'Solo las que te faltan, separadas por sección. Ideal para pedirlas.',
      icon: <MissingIcon />,
      count: `${stats.missing} faltantes`,
      accentBg: 'rgba(239,68,68,0.13)',
    },
    {
      id: 'full',
      label: 'Progreso Completo',
      desc: 'Todas las figuritas con su estado: obtenida, faltante o repetida.',
      icon: <FullIcon />,
      count: `${stats.pct}% completado`,
      accentBg: 'rgba(34,197,94,0.1)',
    },
    {
      id: 'trade',
      label: 'Para Intercambios',
      desc: 'Primero las que tenés para dar, luego las que necesitás recibir.',
      icon: <TradeIcon />,
      count: `${stats.repeated} para dar · ${stats.missing} necesito`,
      accentBg: 'rgba(245,197,66,0.1)',
    },
  ]

  const handleExport = () => {
    const date = todayStr().replace(/\//g, '-')
    let content: string
    let filename: string

    if (selected === 'missing') {
      content = generateMissing(stickers)
      filename = `album-2026-faltantes-${date}.txt`
    } else if (selected === 'full') {
      content = generateFull(stickers)
      filename = `album-2026-progreso-${date}.txt`
    } else {
      content = generateTrade(stickers)
      filename = `album-2026-intercambios-${date}.txt`
    }

    downloadText(content, filename)
    setExported(true)
    setTimeout(() => setExported(false), 2800)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(4,9,18,0.88)', backdropFilter: 'blur(14px)' }}
          onClick={onClose}
        />

        {/* Modal card */}
        <motion.div
          className="relative w-full max-w-lg overflow-hidden"
          initial={{ y: 64, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 32, opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            background: 'linear-gradient(160deg, rgba(12,22,42,0.99) 0%, rgba(8,17,32,0.99) 100%)',
            border: '1px solid rgba(245,197,66,0.18)',
            borderRadius: '20px',
            boxShadow:
              '0 0 0 1px rgba(0,0,0,0.5), 0 40px 80px rgba(0,0,0,0.65), 0 0 60px rgba(245,197,66,0.05)',
          }}
        >
          {/* Holographic top accent */}
          <div
            className="absolute top-0 left-8 right-8 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(245,197,66,0.6) 40%, rgba(255,255,255,0.3) 50%, rgba(245,197,66,0.6) 60%, transparent 100%)',
            }}
          />

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(245,197,66,0.22) 0%, rgba(255,215,0,0.07) 100%)',
                  border: '1px solid rgba(245,197,66,0.3)',
                  boxShadow: '0 0 20px rgba(245,197,66,0.12)',
                  color: '#F5C542',
                }}
              >
                <DownloadIcon />
              </div>
              <div>
                <h2 className="text-base font-display text-gold2 uppercase tracking-wider leading-none">
                  Exportar Álbum
                </h2>
                <p className="text-[11px] text-surface4 mt-1">Seleccioná el tipo de archivo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors text-surface4 hover:text-white hover:bg-white/5"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px" style={{ background: 'rgba(33,50,85,0.6)' }} />

          {/* Options */}
          <div className="px-6 py-4 space-y-2.5">
            {options.map((opt, idx) => {
              const active = selected === opt.id
              return (
                <motion.button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07, duration: 0.22 }}
                  className="w-full text-left rounded-xl p-4 transition-all relative overflow-hidden"
                  style={{
                    background: active ? opt.accentBg : 'rgba(19,32,48,0.55)',
                    border: active
                      ? '1px solid rgba(245,197,66,0.38)'
                      : '1px solid rgba(33,50,85,0.75)',
                    boxShadow: active ? '0 0 24px rgba(245,197,66,0.07)' : 'none',
                    transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon bubble */}
                    <div
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{
                        color: active ? '#F5C542' : 'rgba(163,181,211,0.55)',
                        background: active
                          ? 'rgba(245,197,66,0.14)'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(245,197,66,0.28)' : 'rgba(33,50,85,0.65)'}`,
                      }}
                    >
                      {opt.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="text-sm font-bold leading-tight transition-colors duration-150"
                          style={{ color: active ? '#F3F4F6' : '#A3B5D3' }}
                        >
                          {opt.label}
                        </p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 transition-all duration-150"
                          style={{
                            background: active ? 'rgba(245,197,66,0.18)' : 'rgba(33,50,85,0.9)',
                            color: active ? '#F5C542' : 'rgba(163,181,211,0.65)',
                          }}
                        >
                          {opt.count}
                        </span>
                      </div>
                      <p
                        className="text-[11px] mt-1 leading-relaxed transition-colors duration-150"
                        style={{ color: active ? 'rgba(209,213,219,0.85)' : 'rgba(101,116,148,0.9)' }}
                      >
                        {opt.desc}
                      </p>
                    </div>

                    {/* Check */}
                    {active ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{
                          background: 'rgba(245,197,66,0.2)',
                          border: '1px solid rgba(245,197,66,0.5)',
                        }}
                      >
                        <CheckIcon />
                      </motion.div>
                    ) : (
                      <div
                        className="shrink-0 w-5 h-5 rounded-full"
                        style={{ border: '1px solid rgba(33,50,85,0.9)' }}
                      />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="mx-6 h-px" style={{ background: 'rgba(33,50,85,0.6)' }} />

          {/* Footer */}
          <div className="px-6 py-4">
            <motion.button
              onClick={handleExport}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.975 }}
              className="w-full py-3 rounded-xl font-display font-bold text-dark uppercase tracking-wider text-sm flex items-center justify-center gap-2.5 transition-all duration-300"
              style={{
                background: exported
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #F5C542 0%, #FFD700 60%, #F5C542 100%)',
                boxShadow: exported
                  ? '0 0 28px rgba(34,197,94,0.35), 0 4px 16px rgba(0,0,0,0.4)'
                  : '0 0 28px rgba(245,197,66,0.22), 0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              {exported ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  ¡Archivo descargado!
                </>
              ) : (
                <>
                  <DownloadIcon />
                  Descargar archivo
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
