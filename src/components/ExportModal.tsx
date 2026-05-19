'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { displayKey } from '@/lib/stickers'
import { INTRO_FWC_STICKERS, FINAL_FWC_STICKERS, COCA_COLA_STICKERS, TEAMS } from '@/stickers'
import type { StickerState } from '@/types'

type ExportType = 'missing' | 'full' | 'trade'
type RGB = [number, number, number]
type TradeView = 'dar' | 'pedir' | null

interface ExportModalProps {
  stickers: StickerState[]
  onClose: () => void
}

// ── Static data helpers ────────────────────────────────────────────────

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

// ── PDF generation ─────────────────────────────────────────────────────

async function generateAndDownloadPDF(mode: ExportType, stickers: StickerState[]) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const sm = buildMap(stickers)

  // Layout constants
  const PW = 210, PH = 297, ML = 14
  const CW = PW - ML * 2   // 182 mm
  const NCOLS = 4
  const CX = CW / NCOLS    // ≈45.5 mm per column
  const RH = 14             // sticker row height
  const FH = 10             // footer height

  // Color palette
  const C = {
    navyDk:  [8,  18,  38]  as RGB,
    navyMd:  [20, 45,  82]  as RGB,
    navyLt:  [38, 72,  118] as RGB,
    gold:    [245, 197, 66] as RGB,
    goldLt:  [255, 249, 219] as RGB,
    white:   [255, 255, 255] as RGB,
    grnCell: [212, 240, 220] as RGB,
    redCell: [255, 222, 222] as RGB,
    greyCl:  [236, 240, 243] as RGB,
    border:  [178, 196, 216] as RGB,
    txDk:    [22,  26,  32]  as RGB,
    txMd:    [88,  100, 116] as RGB,
    txLt:    [162, 172, 186] as RGB,
    txRed:   [165, 28,  28]  as RGB,
    txGld:   [136, 86,  0]   as RGB,
    txGrn:   [22,  96,  46]  as RGB,
  }

  const fc = (c: RGB) => doc.setFillColor(c[0], c[1], c[2])
  const tc = (c: RGB) => doc.setTextColor(c[0], c[1], c[2])
  const dc = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2])

  let y = ML

  function ensure(h: number) {
    if (y + h > PH - FH - 3) { doc.addPage(); y = ML }
  }

  function trunc(s: string, max = 21): string {
    return s.length > max ? s.slice(0, max - 1) + '.' : s
  }

  // ── Status helpers ─────────────────────────────────────────────────

  function stickerSt(key: string): 'owned' | 'missing' | 'repeated' {
    const s = sm.get(key)
    if (!s || s.status === 'missing') return 'missing'
    return s.status as 'owned' | 'repeated'
  }

  function cellBg(key: string, tv: TradeView): RGB {
    const st = stickerSt(key)
    if (tv === 'dar')   return st === 'repeated' ? C.goldLt : C.greyCl
    if (tv === 'pedir') return st === 'missing'  ? C.redCell : C.greyCl
    if (mode === 'missing') return st === 'missing' ? C.redCell : C.greyCl
    if (st === 'missing')  return C.redCell
    if (st === 'repeated') return C.goldLt
    if (mode === 'trade')  return C.greyCl   // owned in trade = not relevant
    return C.grnCell
  }

  function idClr(key: string, tv: TradeView): RGB {
    const st = stickerSt(key)
    if (tv === 'dar')   return st === 'repeated' ? C.txGld : C.txLt
    if (tv === 'pedir') return st === 'missing'  ? C.txRed : C.txLt
    if (mode === 'missing') return st === 'missing' ? C.txRed : C.txLt
    if (st === 'missing')  return C.txRed
    if (st === 'repeated') return C.txGld
    if (mode === 'trade')  return C.txLt
    return C.txGrn
  }

  function accentColor(key: string, tv: TradeView): RGB {
    const st = stickerSt(key)
    const isMuted =
      (tv === 'dar'   && st !== 'repeated') ||
      (tv === 'pedir' && st !== 'missing')  ||
      (!tv && mode === 'missing' && st !== 'missing') ||
      (!tv && mode === 'trade'   && st === 'owned')
    if (isMuted)           return [205, 215, 228] as RGB
    if (st === 'missing')  return [210, 68,  68]  as RGB
    if (st === 'repeated') return C.gold
    return [48, 148, 72] as RGB
  }

  function nameClr(key: string, tv: TradeView): RGB {
    const st = stickerSt(key)
    const muted =
      (tv === 'dar'   && st !== 'repeated') ||
      (tv === 'pedir' && st !== 'missing')  ||
      (!tv && mode === 'missing' && st !== 'missing') ||
      (!tv && mode === 'trade'   && st === 'owned')
    return muted ? C.txLt : C.txDk
  }

  function statusLabel(key: string, tv: TradeView): { text: string; color: RGB } {
    const st = stickerSt(key)
    const rc = sm.get(key)?.repeat_count ?? 1
    const isMuted =
      (tv === 'dar'   && st !== 'repeated') ||
      (tv === 'pedir' && st !== 'missing')  ||
      (!tv && mode === 'missing' && st !== 'missing') ||
      (!tv && mode === 'trade'   && st === 'owned')
    if (isMuted) {
      if (st === 'missing')  return { text: 'No encontrada', color: C.txLt }
      if (st === 'repeated') return { text: `Repetida x${rc}`, color: C.txLt }
      return { text: 'Encontrada', color: C.txLt }
    }
    if (st === 'missing')  return { text: 'No encontrada', color: C.txRed }
    if (st === 'repeated') return { text: `Repetida x${rc}`, color: C.txGld }
    return { text: 'Encontrada', color: C.txGrn }
  }

  // ── Draw one sticker cell ──────────────────────────────────────────

  function drawCell(
    cx: number, cy: number,
    key: string, dispId: string, playerName: string,
    tv: TradeView,
  ) {
    const accentW = 1.8

    // Cell background
    fc(cellBg(key, tv)); doc.rect(cx, cy, CX, RH, 'F')

    // Left accent strip (status color indicator)
    fc(accentColor(key, tv)); doc.rect(cx, cy, accentW, RH, 'F')

    // Border
    dc(C.border); doc.setLineWidth(0.35); doc.rect(cx, cy, CX, RH, 'S')

    // Sticker ID
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    tc(idClr(key, tv))
    doc.text(dispId, cx + accentW + 1.5, cy + 4.5)

    // Player name
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.8)
    tc(nameClr(key, tv))
    doc.text(trunc(playerName), cx + accentW + 1.5, cy + 8.5)

    // Status label
    const sl = statusLabel(key, tv)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.3)
    tc(sl.color)
    doc.text(sl.text, cx + accentW + 1.5, cy + 12.2)
  }

  // ── Section header ─────────────────────────────────────────────────

  function secHdr(title: string) {
    ensure(12)
    fc(C.navyMd); doc.rect(ML, y, CW, 7.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5)
    tc(C.gold); doc.text(title, ML + 4, y + 5.2)
    y += 9.5
  }

  // ── Group header ───────────────────────────────────────────────────

  function grpHdr(g: string) {
    ensure(8)
    fc(C.navyLt); doc.rect(ML, y, CW, 6, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5)
    tc(C.white); doc.text(`GRUPO  ${g}`, ML + 4, y + 4.2)
    y += 7.5
  }

  // ── Team name bar ──────────────────────────────────────────────────

  function teamBar(name: string) {
    fc(C.navyMd); doc.rect(ML, y, CW, 6, 'F')
    fc(C.gold);   doc.rect(ML, y, 2.5, 6, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    tc(C.white); doc.text(name.toUpperCase(), ML + 5.5, y + 4.2)
    y += 6
  }

  // ── 4×5 team grid ─────────────────────────────────────────────────

  function teamGrid(team: typeof TEAMS[number], tv: TradeView) {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        const i = row * 4 + col
        const key = `${team.code}_${i}`
        drawCell(ML + col * CX, y + row * RH, key, displayKey(key), team.players[i] ?? '', tv)
      }
    }
    y += 5 * RH + 3
  }

  function teamHas(team: typeof TEAMS[number], sts: string[]): boolean {
    for (let i = 0; i < 20; i++) {
      if (sts.includes(stickerSt(`${team.code}_${i}`))) return true
    }
    return false
  }

  function drawTeam(team: typeof TEAMS[number], tv: TradeView) {
    if (tv === 'dar'   && !teamHas(team, ['repeated'])) return
    if (tv === 'pedir' && !teamHas(team, ['missing']))  return
    if (!tv && mode === 'missing' && !teamHas(team, ['missing'])) {
      ensure(7)
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7)
      tc(C.txMd)
      doc.text(`    ${team.name}: coleccion completa`, ML + 4, y + 4)
      y += 6.5
      return
    }
    if (!tv && mode === 'trade' && !teamHas(team, ['missing', 'repeated'])) return
    ensure(6 + 5 * RH + 3)
    teamBar(team.name)
    teamGrid(team, tv)
  }

  // ── Special sticker grid (FWC / CC) ───────────────────────────────

  type GridItem = { id: string; name: string }

  function specialGrid(items: GridItem[], tv: TradeView) {
    const rows = Math.ceil(items.length / NCOLS)
    ensure(rows * RH + 3)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < NCOLS; c++) {
        const i = r * NCOLS + c
        if (i >= items.length) break
        drawCell(ML + c * CX, y + r * RH, items[i].id, items[i].id, items[i].name, tv)
      }
    }
    y += rows * RH + 3
  }

  // ── Build all document sections ────────────────────────────────────

  const introItems: GridItem[] = INTRO_FWC_STICKERS.map((s) => ({ id: s.id, name: s.name }))
  const finalItems: GridItem[] = FINAL_FWC_STICKERS.map((s) => ({ id: s.id, name: s.name }))
  const ccItems:    GridItem[] = COCA_COLA_STICKERS.map((s) => ({ id: s.id, name: s.player }))

  function buildSections(tv: TradeView) {
    secHdr(`FWC INICIAL  (${introItems.length} figuritas)`)
    specialGrid(introItems, tv)

    for (const g of GROUP_ORDER) {
      const teams = GROUPED[g] ?? []
      if (!teams.length) continue
      if (tv === 'dar'   && !teams.some((t) => teamHas(t, ['repeated']))) continue
      if (tv === 'pedir' && !teams.some((t) => teamHas(t, ['missing'])))  continue
      if (!tv && mode === 'trade' && !teams.some((t) => teamHas(t, ['missing', 'repeated']))) continue
      grpHdr(g)
      for (const t of teams) drawTeam(t, tv)
    }

    secHdr(`FWC FINAL  (${finalItems.length} figuritas)`)
    specialGrid(finalItems, tv)

    secHdr(`COCA-COLA SPECIAL EDITION  (${ccItems.length} figuritas)`)
    specialGrid(ccItems, tv)
  }

  // ── Document stats ─────────────────────────────────────────────────

  const owned = stickers.filter((s) => s.status === 'owned').length
  const rep   = stickers.filter((s) => s.status === 'repeated').length
  const miss  = 994 - owned - rep
  const pct   = ((owned + rep) / 994 * 100).toFixed(1)
  const date  = todayStr()

  // ── Cover ──────────────────────────────────────────────────────────

  fc(C.navyDk); doc.rect(0, 0, PW, 44, 'F')
  fc(C.gold);   doc.rect(0, 44, PW, 1.5, 'F')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(15)
  tc(C.gold)
  doc.text('ALBUM FIFA WORLD CUP 2026', PW / 2, 15, { align: 'center' })

  const titles: Record<ExportType, string> = {
    missing: 'FIGURITAS FALTANTES',
    full:    'PROGRESO COMPLETO DE COLECCION',
    trade:   'LISTA PARA INTERCAMBIOS',
  }
  doc.setFontSize(11); tc(C.white)
  doc.text(titles[mode], PW / 2, 26, { align: 'center' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  tc([170, 190, 225] as RGB)
  doc.text(`Generado: ${date}`, ML, 37)
  doc.text(
    `${owned + rep} / 994  (${pct}%)   Obtenidas: ${owned}   Repetidas: ${rep}   Faltantes: ${miss}`,
    PW - ML, 37, { align: 'right' },
  )

  y = 52

  // ── Legend ─────────────────────────────────────────────────────────

  const legend: { bg: RGB; label: string }[] =
    mode === 'full' ? [
      { bg: C.grnCell, label: 'Obtenida' },
      { bg: C.goldLt,  label: 'Repetida' },
      { bg: C.redCell, label: 'Faltante' },
    ] : mode === 'missing' ? [
      { bg: C.redCell, label: 'Necesito conseguirla' },
      { bg: C.greyCl,  label: 'Ya la tengo' },
    ] : [
      { bg: C.goldLt,  label: 'Para dar (repetida)' },
      { bg: C.redCell, label: 'Necesito (faltante)' },
      { bg: C.greyCl,  label: 'Ya la tengo' },
    ]

  let lx = ML
  for (const item of legend) {
    fc(item.bg); doc.rect(lx, y, 5, 4, 'F')
    dc(C.border); doc.setLineWidth(0.2); doc.rect(lx, y, 5, 4, 'S')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
    tc(C.txMd); doc.text(item.label, lx + 6.5, y + 2.9)
    lx += 44
  }
  y += 8

  // ── Main content ───────────────────────────────────────────────────

  buildSections(null)

  // ── Footers on all pages ───────────────────────────────────────────

  const totalPg = doc.getNumberOfPages()
  for (let pg = 1; pg <= totalPg; pg++) {
    doc.setPage(pg)
    fc(C.navyDk); doc.rect(0, PH - FH, PW, FH, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
    tc([150, 170, 205] as RGB)
    doc.text('Album FIFA World Cup 2026  —  panini.com', ML, PH - 3.5)
    doc.text(`Pagina ${pg} de ${totalPg}`, PW - ML, PH - 3.5, { align: 'right' })
  }

  // ── Save ───────────────────────────────────────────────────────────

  const names: Record<ExportType, string> = {
    missing: 'faltantes',
    full:    'progreso',
    trade:   'intercambios',
  }
  doc.save(`album-2026-${names[mode]}-${date.replace(/\//g, '-')}.pdf`)
}

// ── Icons ──────────────────────────────────────────────────────────────

const PdfIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const SpinnerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
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

// ── Component ──────────────────────────────────────────────────────────

export function ExportModal({ stickers, onClose }: ExportModalProps) {
  const [selected, setSelected]   = useState<ExportType>('missing')
  const [generating, setGenerating] = useState(false)
  const [exported, setExported]   = useState(false)

  const stats = useMemo(() => {
    const owned    = stickers.filter((s) => s.status === 'owned').length
    const repeated = stickers.filter((s) => s.status === 'repeated').length
    const missing  = 994 - owned - repeated
    const pct      = Math.round(((owned + repeated) / 994) * 100)
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
      desc: 'PDF con las figuritas que te faltan por sección. Ideal para pedirlas o comprarlas.',
      icon: <MissingIcon />,
      count: `${stats.missing} faltantes`,
      accentBg: 'rgba(239,68,68,0.13)',
    },
    {
      id: 'full',
      label: 'Progreso Completo',
      desc: 'PDF con las 994 figuritas y su estado: obtenida, repetida o faltante.',
      icon: <FullIcon />,
      count: `${stats.pct}% completado`,
      accentBg: 'rgba(34,197,94,0.1)',
    },
    {
      id: 'trade',
      label: 'Para Intercambios',
      desc: 'PDF dividido en "Tengo para dar" (repetidas) y "Necesito" (faltantes).',
      icon: <TradeIcon />,
      count: `${stats.repeated} para dar · ${stats.missing} necesito`,
      accentBg: 'rgba(245,197,66,0.1)',
    },
  ]

  const handleExport = async () => {
    setGenerating(true)
    try {
      await generateAndDownloadPDF(selected, stickers)
      setExported(true)
      setTimeout(() => setExported(false), 2800)
    } finally {
      setGenerating(false)
    }
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
                  background: 'linear-gradient(135deg, rgba(245,197,66,0.22) 0%, rgba(255,215,0,0.07) 100%)',
                  border: '1px solid rgba(245,197,66,0.3)',
                  boxShadow: '0 0 20px rgba(245,197,66,0.12)',
                  color: '#F5C542',
                }}
              >
                <PdfIcon />
              </div>
              <div>
                <h2 className="text-base font-display text-gold2 uppercase tracking-wider leading-none">
                  Exportar PDF
                </h2>
                <p className="text-[11px] text-surface4 mt-1">Seleccioná el tipo de reporte</p>
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
                        background: active ? 'rgba(245,197,66,0.14)' : 'rgba(255,255,255,0.04)',
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
              disabled={generating}
              whileHover={generating ? {} : { scale: 1.015 }}
              whileTap={generating ? {} : { scale: 0.975 }}
              className="w-full py-3 rounded-xl font-display font-bold text-dark uppercase tracking-wider text-sm flex items-center justify-center gap-2.5 transition-all duration-300"
              style={{
                background: exported
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : generating
                  ? 'linear-gradient(135deg, #b8943c 0%, #c9a84c 100%)'
                  : 'linear-gradient(135deg, #F5C542 0%, #FFD700 60%, #F5C542 100%)',
                boxShadow: exported
                  ? '0 0 28px rgba(34,197,94,0.35), 0 4px 16px rgba(0,0,0,0.4)'
                  : '0 0 28px rgba(245,197,66,0.22), 0 4px 16px rgba(0,0,0,0.4)',
                opacity: generating ? 0.85 : 1,
                cursor: generating ? 'wait' : 'pointer',
              }}
            >
              {exported ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  ¡PDF descargado!
                </>
              ) : generating ? (
                <>
                  <SpinnerIcon />
                  Generando PDF...
                </>
              ) : (
                <>
                  <PdfIcon />
                  Descargar PDF
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
