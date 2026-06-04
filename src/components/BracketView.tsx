'use client'

import { Fragment, useMemo, useState } from 'react'
import { TeamFlag } from '@/components/TeamFlag'
import {
  WC2026_MATCHES,
  PHASE_LABELS,
  PHASE_SHORT,
  type CalMatch,
  type Phase,
} from '@/lib/calendar-data'

// ── Layout constants ──────────────────────────────────────────────
// CARD_H is the design target; SLOT_U = CARD_H + 8px gap between R32 cards.
// TOTAL_H = 16 R32 slots; all other round columns use the same total height
// (multiples of SLOT_U), so match centers align with SVG connector midpoints.
const CARD_W  = 148
const CARD_H  = 70    // px — matches the actual rendered card height
const SLOT_U  = 78    // px — R32 slot unit (CARD_H + 8px gap)
const CON_W   = 22    // px — bracket connector SVG width
const TOTAL_H = 16 * SLOT_U   // 1248px — shared content height for all round columns

// Each R32 slot spans 1 unit. Successive rounds double the slot size.
const MULT: Partial<Record<Phase, number>> = {
  r32: 1, r16: 2, qf: 4, sf: 8, final: 16,
}

const ROUND_COLOR: Partial<Record<Phase, string>> = {
  r32:   '#7DD3FC',
  r16:   '#93C5FD',
  qf:    '#A5B4FC',
  sf:    '#FCD34D',
  '3rd': '#94A3B8',
  final: '#F5C542',
}

// Knockout rounds shown left-to-right in the bracket tree
const BRACKET_ROUNDS: Phase[] = ['r32', 'r16', 'qf', 'sf', 'final']

const MOBILE_TABS: { phase: Phase; label: string }[] = [
  { phase: 'r32',   label: 'Ronda 32' },
  { phase: 'r16',   label: 'Octavos' },
  { phase: 'qf',    label: 'Cuartos' },
  { phase: 'sf',    label: 'Semis' },
  { phase: '3rd',   label: '3er Lugar' },
  { phase: 'final', label: 'Final' },
]

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
}

// ── Desktop bracket team row ──────────────────────────────────────
function BTeamRow({
  code, name, score, show,
}: {
  code: string; name: string; score?: number; show?: boolean
}) {
  const tbd = code === 'TBD'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 17, minHeight: 17 }}>
      {tbd
        ? <span style={{ width: 18, height: 12, background: 'rgba(52,72,110,0.3)', borderRadius: 2, flexShrink: 0, display: 'inline-block' }} />
        : <TeamFlag code={code} className="text-sm" />
      }
      <span style={{
        flex: 1, fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
        color: tbd ? 'rgba(100,120,160,0.4)' : '#E5E7EB',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {tbd ? 'POR DEFINIR' : code}
      </span>
      {show && (
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: score !== undefined ? '#F5C542' : 'rgba(163,181,211,0.3)',
          minWidth: 12, textAlign: 'right', flexShrink: 0,
        }}>
          {score ?? '·'}
        </span>
      )}
    </div>
  )
}

// ── Desktop bracket match card ────────────────────────────────────
function BracketCard({ match, phase }: { match: CalMatch; phase: Phase }) {
  const done = match.status === 'completed'
  const live = match.status === 'live'
  const fin  = phase === 'final'
  const sf   = phase === 'sf'
  const show = done || live

  const borderC = fin
    ? 'rgba(245,197,66,0.52)'
    : live
    ? 'rgba(74,222,128,0.4)'
    : sf
    ? 'rgba(245,197,66,0.22)'
    : 'rgba(52,72,110,0.58)'

  return (
    <div style={{
      width: CARD_W,
      background: fin
        ? 'linear-gradient(155deg,rgba(20,30,52,0.99),rgba(13,21,38,1))'
        : 'linear-gradient(155deg,rgba(14,25,46,0.97),rgba(9,16,33,0.99))',
      border: `1px solid ${borderC}`,
      borderRadius: 8,
      padding: '6px 8px 5px',
      boxSizing: 'border-box' as const,
      boxShadow: fin
        ? '0 4px 22px rgba(245,197,66,0.12),0 2px 8px rgba(0,0,0,0.4)'
        : '0 2px 10px rgba(0,0,0,0.3)',
      flexShrink: 0,
    }}>
      <BTeamRow code={match.home.code} name={match.home.name} score={match.home.score} show={show} />
      <div style={{ height: 1, background: borderC, opacity: 0.45, margin: '3px 0' }} />
      <BTeamRow code={match.away.code} name={match.away.name} score={match.away.score} show={show} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3,
        marginTop: 4, paddingTop: 4,
        borderTop: `1px solid ${borderC}`,
        opacity: 0.7,
      }}>
        {live && (
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', flexShrink: 0, display: 'inline-block' }} />
        )}
        <span style={{ fontSize: 8, color: 'rgba(163,181,211,0.8)', fontWeight: 600, letterSpacing: '0.04em' }}>
          {fmtDate(match.date)}
        </span>
        <span style={{ fontSize: 8, color: 'rgba(163,181,211,0.3)' }}>·</span>
        <span style={{
          fontSize: 8, color: 'rgba(163,181,211,0.65)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 74,
        }}>
          {match.city}
        </span>
      </div>
    </div>
  )
}

// ── SVG connector between two round columns ───────────────────────
// For each pair of source-round matches, draws:
//   two horizontal input lines → vertical join → horizontal output at midpoint
// The midpoint aligns exactly with the destination match center because
// TOTAL_H = 16 × SLOT_U and each dest slot is 2× the source slot.
function BracketConnector({ sourceCount }: { sourceCount: number }) {
  const pairs = sourceCount / 2
  const slotH = TOTAL_H / sourceCount
  const c     = 'rgba(52,72,110,0.5)'
  const xV    = 12  // x of the vertical join line within the CON_W space

  return (
    <svg
      width={CON_W}
      height={TOTAL_H}
      style={{ flexShrink: 0, overflow: 'visible', display: 'block' }}
      aria-hidden="true"
    >
      {Array.from({ length: pairs }, (_, i) => {
        const y1 = i * 2 * slotH + slotH / 2
        const y2 = (i * 2 + 1) * slotH + slotH / 2
        const ym = (y1 + y2) / 2
        return (
          <g key={i}>
            <line x1={0}   y1={y1} x2={xV}    y2={y1} stroke={c} strokeWidth={1} />
            <line x1={0}   y1={y2} x2={xV}    y2={y2} stroke={c} strokeWidth={1} />
            <line x1={xV}  y1={y1} x2={xV}    y2={y2} stroke={c} strokeWidth={1} />
            <line x1={xV}  y1={ym} x2={CON_W} y2={ym} stroke={c} strokeWidth={1} />
          </g>
        )
      })}
    </svg>
  )
}

// ── Desktop round header pill ─────────────────────────────────────
function RoundHeader({ phase, count }: { phase: Phase; count: number }) {
  const color = ROUND_COLOR[phase] ?? '#7DD3FC'
  const fin   = phase === 'final'

  return (
    <div style={{ width: CARD_W, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        background: fin ? 'rgba(245,197,66,0.08)' : 'rgba(14,24,44,0.7)',
        border: `1px solid ${fin ? 'rgba(245,197,66,0.3)' : 'rgba(42,60,90,0.48)'}`,
        borderRadius: 8,
        padding: '4px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        width: '100%', boxSizing: 'border-box' as const,
      }}>
        {fin && <span style={{ fontSize: 11 }}>🏆</span>}
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.09em',
          textTransform: 'uppercase' as const, color,
        }}>
          {PHASE_SHORT[phase]}
        </span>
        <span style={{
          fontSize: 8, color: 'rgba(163,181,211,0.4)',
          background: 'rgba(42,60,90,0.4)', borderRadius: 4, padding: '1px 4px',
        }}>
          {count}
        </span>
      </div>
    </div>
  )
}

// ── Desktop round content — fixed-height slot column ─────────────
// Each match is centered in its slot. Slot height = SLOT_U × MULT[phase],
// so all columns share the same TOTAL_H and matches align with connectors.
function RoundContent({ phase, matches }: { phase: Phase; matches: CalMatch[] }) {
  const slotH = SLOT_U * (MULT[phase] ?? 1)

  return (
    <div style={{ width: CARD_W, flexShrink: 0, height: TOTAL_H }}>
      {matches.map(m => (
        <div
          key={m.id}
          style={{ height: slotH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <BracketCard match={m} phase={phase} />
        </div>
      ))}
    </div>
  )
}

// ── Mobile / tablet team row ──────────────────────────────────────
function MTeamRow({ code, name, score, show }: { code: string; name: string; score?: number; show?: boolean }) {
  const tbd = code === 'TBD'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {tbd
        ? <span style={{ width: 26, height: 18, background: 'rgba(52,72,110,0.3)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
        : <TeamFlag code={code} className="text-xl" />
      }
      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: tbd ? 'rgba(100,120,160,0.38)' : '#E5E7EB' }}>
        {tbd ? 'Por definir' : name}
      </span>
      {show && (
        <span style={{
          fontSize: 22, fontWeight: 800,
          color: score !== undefined ? '#F5C542' : 'rgba(163,181,211,0.28)',
          minWidth: 22, textAlign: 'right' as const,
        }}>
          {score ?? '—'}
        </span>
      )}
    </div>
  )
}

// ── Mobile / tablet full-detail match card ────────────────────────
function MobileMatchCard({ match, phase }: { match: CalMatch; phase: Phase }) {
  const done  = match.status === 'completed'
  const live  = match.status === 'live'
  const fin   = phase === 'final'
  const show  = done || live

  const borderC = fin
    ? 'rgba(245,197,66,0.45)'
    : live
    ? 'rgba(74,222,128,0.38)'
    : 'rgba(52,72,110,0.55)'

  return (
    <div style={{
      background: fin
        ? 'linear-gradient(155deg,rgba(22,32,54,0.99),rgba(14,22,38,1))'
        : 'linear-gradient(155deg,rgba(15,27,49,0.97),rgba(10,17,35,0.99))',
      border: `1px solid ${borderC}`,
      borderRadius: 10,
      padding: '10px 12px 9px',
      boxShadow: fin
        ? '0 4px 20px rgba(245,197,66,0.1),0 2px 8px rgba(0,0,0,0.3)'
        : '0 2px 10px rgba(0,0,0,0.3)',
    }}>
      {/* Match ID + live badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
          color: 'rgba(163,181,211,0.4)', background: 'rgba(42,60,90,0.3)', borderRadius: 4, padding: '2px 5px',
        }}>
          {match.id}
        </span>
        {live && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 9, fontWeight: 700, color: '#4ade80',
            background: 'rgba(34,197,94,0.1)', borderRadius: 10,
            padding: '2px 7px', border: '1px solid rgba(74,222,128,0.25)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            EN VIVO
          </span>
        )}
      </div>

      <MTeamRow code={match.home.code} name={match.home.name} score={match.home.score} show={show} />
      <div style={{ height: 1, background: borderC, opacity: 0.4, margin: '7px 0' }} />
      <MTeamRow code={match.away.code} name={match.away.name} score={match.away.score} show={show} />

      {/* Venue */}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: 10, color: 'rgba(163,181,211,0.6)', fontWeight: 600 }}>
          {fmtDate(match.date)}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(163,181,211,0.25)' }}>·</span>
        <span style={{ fontSize: 10, color: 'rgba(163,181,211,0.5)' }}>
          {match.time} {match.timezone}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(163,181,211,0.25)' }}>·</span>
        <span style={{ fontSize: 10, color: 'rgba(163,181,211,0.5)' }}>
          {match.stadium}
        </span>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────
export function BracketView() {
  const [mobileRound, setMobileRound] = useState<Phase>('r32')

  // Group all knockout matches by phase, preserving calendar-data order
  const byPhase = useMemo(() => {
    const map = new Map<Phase, CalMatch[]>()
    for (const m of WC2026_MATCHES) {
      if (m.phase === 'group') continue
      const arr = map.get(m.phase) ?? []
      map.set(m.phase, [...arr, m])
    }
    return map
  }, [])

  const p3 = byPhase.get('3rd') ?? []

  // Header pill area height — kept fixed so connector SVG aligns with match slots
  const HEADER_H   = 36  // px — round header pill height
  const HEADER_GAP = 10  // px — gap below header before content

  return (
    <div className="space-y-4">

      {/* ── Title ────────────────────────────────────────────────── */}
      <div>
        <h2
          className="font-display tracking-widest uppercase leading-none"
          style={{
            fontSize: 'clamp(22px, 3.5vw, 30px)',
            background: 'linear-gradient(135deg, #F5C542, #FFD700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Bracket Mundial 2026
        </h2>
        <p className="text-sm mt-1 tracking-wide" style={{ color: 'rgba(185,205,230,0.8)' }}>
          Fase eliminatoria ·{' '}
          <span style={{ color: 'rgba(245,197,66,0.9)', fontWeight: 700 }}>32 partidos</span>
          {' '}· 28 jun – 19 jul 2026
        </p>
      </div>

      {/* ── TBD notice ───────────────────────────────────────────── */}
      <div
        className="rounded-xl border p-3 flex items-start gap-2.5"
        style={{ background: 'rgba(56,189,248,0.03)', borderColor: 'rgba(56,189,248,0.14)' }}
      >
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="rgba(125,211,252,0.55)" strokeWidth="2"
          className="shrink-0 mt-0.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ fontSize: 11, color: 'rgba(163,181,211,0.58)', lineHeight: '1.5' }}>
          Los 32 clasificados se confirmarán tras la Fase de Grupos
          (último partido grupal:{' '}
          <strong style={{ color: 'rgba(163,181,211,0.75)', fontWeight: 600 }}>
            27 jun 2026
          </strong>). Sedes y fechas son oficiales FIFA.
        </p>
      </div>

      {/* ── MOBILE / TABLET: round picker + card list ────────────── */}
      <div className="lg:hidden space-y-4">

        {/* Round tab pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {MOBILE_TABS.map(({ phase, label }) => {
            const matches = byPhase.get(phase) ?? []
            const active  = mobileRound === phase
            const color   = ROUND_COLOR[phase] ?? '#7DD3FC'
            return (
              <button
                key={phase}
                onClick={() => setMobileRound(phase)}
                className="whitespace-nowrap shrink-0 transition-all"
                style={{
                  background: active ? color : 'rgba(14,24,44,0.7)',
                  color:      active ? '#0B1624' : 'rgba(163,181,211,0.7)',
                  border:    `1px solid ${active ? 'transparent' : 'rgba(42,60,90,0.45)'}`,
                  borderRadius: 10,
                  padding: '5px 11px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                  cursor: 'pointer',
                }}
              >
                {label}{' '}
                <span style={{ opacity: 0.6, fontWeight: 500 }}>({matches.length})</span>
              </button>
            )
          })}
        </div>

        {/* Match cards for the active round */}
        <div className="flex flex-col gap-3">
          {(byPhase.get(mobileRound) ?? []).map(m => (
            <MobileMatchCard key={m.id} match={m} phase={mobileRound} />
          ))}
          {(byPhase.get(mobileRound) ?? []).length === 0 && (
            <p className="py-10 text-center text-sm" style={{ color: 'rgba(163,181,211,0.35)' }}>
              Sin partidos en esta ronda
            </p>
          )}
        </div>
      </div>

      {/* ── DESKTOP: full bracket tree ───────────────────────────── */}
      <div className="hidden lg:block">
        <div
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: '80vh',
            paddingBottom: 8,
          }}
        >
          <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: 'max-content' }}>

            {/* Header row — round label pills + spacers for connectors */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: HEADER_H,
                marginBottom: HEADER_GAP,
              }}
            >
              {BRACKET_ROUNDS.map((phase, i) => {
                const matches = byPhase.get(phase) ?? []
                return (
                  <Fragment key={phase}>
                    <RoundHeader phase={phase} count={matches.length} />
                    {i < BRACKET_ROUNDS.length - 1 && (
                      <div style={{ width: CON_W, flexShrink: 0 }} />
                    )}
                  </Fragment>
                )
              })}
            </div>

            {/* Content row — match slot columns + SVG connectors between them */}
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {BRACKET_ROUNDS.map((phase, i) => {
                const matches = byPhase.get(phase) ?? []
                const prevLen = i > 0 ? (byPhase.get(BRACKET_ROUNDS[i - 1]) ?? []).length : 0
                return (
                  <Fragment key={phase}>
                    {i > 0 && <BracketConnector sourceCount={prevLen} />}
                    <RoundContent phase={phase} matches={matches} />
                  </Fragment>
                )
              })}
            </div>

            {/* 3rd Place match — below the main bracket, centered */}
            {p3.length > 0 && (
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 56, height: 1, background: 'rgba(148,163,184,0.18)' }} />
                  <div style={{
                    background: 'rgba(148,163,184,0.06)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 8, padding: '3px 10px',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const, color: '#94A3B8',
                    }}>
                      {PHASE_LABELS['3rd']}
                    </span>
                    <span style={{
                      fontSize: 8, color: 'rgba(163,181,211,0.38)',
                      background: 'rgba(42,60,90,0.35)', borderRadius: 4, padding: '1px 4px',
                    }}>
                      {fmtDate(p3[0].date)} · {p3[0].city}
                    </span>
                  </div>
                  <div style={{ width: 56, height: 1, background: 'rgba(148,163,184,0.18)' }} />
                </div>
                <BracketCard match={p3[0]} phase="3rd" />
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-5 mt-3 flex-wrap"
          style={{ fontSize: 10, color: 'rgba(163,181,211,0.4)' }}
        >
          <span className="flex items-center gap-2">
            <span style={{ width: 16, height: 1, background: 'rgba(52,72,110,0.5)', display: 'inline-block' }} />
            Árbol bracket
          </span>
          <span className="flex items-center gap-2">
            <span style={{ width: 12, height: 9, background: 'rgba(52,72,110,0.3)', borderRadius: 2, display: 'inline-block' }} />
            Por definir
          </span>
          <span className="flex items-center gap-2">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            En vivo
          </span>
        </div>
      </div>
    </div>
  )
}
