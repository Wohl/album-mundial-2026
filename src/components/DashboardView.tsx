'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StickerState, TradeRequest, UserProgress } from '@/types'
import { getStickerName, displayKey } from '@/lib/stickers'
import { StickerFlag } from '@/components/TeamFlag'
import { TEAMS } from '@/stickers'
import { useDashboard, RankEntry } from '@/hooks/useDashboard'

// ─── Achievement System ───────────────────────────────────────────────────────

type AchRarity = 'bronze' | 'silver' | 'gold' | 'legendary'

interface AchDef {
  id: string
  name: string
  desc: string
  rarity: AchRarity
  icon: string
  check: (d: AchData) => boolean
  progress?: (d: AchData) => { current: number; target: number }
}

interface AchData {
  owned: number
  pct: number
  repeated: number
  trades: number
  teamsCompleted: number
  hasAllCC: boolean
  hasAllIntro: boolean
  hasAllFinal: boolean
}

const RARITY: Record<AchRarity, { border: string; bg: string; text: string; glow: string; label: string }> = {
  bronze:    { border: 'border-orange-700/50', bg: 'bg-orange-900/20', text: 'text-orange-400', glow: 'shadow-[0_0_12px_rgba(194,65,12,0.25)]',   label: 'Bronce'    },
  silver:    { border: 'border-gray-400/40',   bg: 'bg-gray-700/20',   text: 'text-gray-300',  glow: 'shadow-[0_0_12px_rgba(156,163,175,0.20)]', label: 'Plata'     },
  gold:      { border: 'border-gold/50',       bg: 'bg-gold/8',        text: 'text-gold',      glow: 'shadow-[0_0_14px_rgba(245,197,66,0.28)]',  label: 'Oro'       },
  legendary: { border: 'border-purple-400/50', bg: 'bg-purple-900/20', text: 'text-purple-300',glow: 'shadow-[0_0_16px_rgba(192,132,252,0.30)]', label: 'Leyenda'   },
}

const ACHIEVEMENTS: AchDef[] = [
  { id: 'first',      name: 'Primer Cromo',       desc: 'Pegá tu primera figurita',        rarity: 'bronze',    icon: '⭐', check: d => d.owned >= 1 },
  { id: 'ten',        name: 'Arranqué',            desc: '10 figuritas en el álbum',        rarity: 'bronze',    icon: '🎯', check: d => d.owned >= 10,  progress: d => ({ current: Math.min(d.owned, 10), target: 10 }) },
  { id: 'century',    name: 'Centenario',          desc: '100 figuritas coleccionadas',     rarity: 'silver',    icon: '💯', check: d => d.owned >= 100, progress: d => ({ current: Math.min(d.owned, 100), target: 100 }) },
  { id: 'halfway',    name: 'Media Cancha',        desc: '50% del álbum completo',          rarity: 'silver',    icon: '⚡', check: d => d.pct >= 50, progress: d => ({ current: Math.round(d.pct), target: 50 }) },
  { id: 'ninety',     name: 'A Un Paso',           desc: '90% del álbum completo',          rarity: 'gold',      icon: '🔥', check: d => d.pct >= 90, progress: d => ({ current: Math.round(d.pct), target: 90 }) },
  { id: 'champion',   name: 'Álbum Completo',      desc: '¡Completaste el 100%!',           rarity: 'legendary', icon: '🏆', check: d => d.pct >= 100 },
  { id: 'first_team', name: 'Primera Selección',   desc: 'Completá una selección entera',   rarity: 'silver',    icon: '🌍', check: d => d.teamsCompleted >= 1 },
  { id: 'five_teams', name: 'Gira Mundial',        desc: 'Completá 5 selecciones',          rarity: 'gold',      icon: '🗺️', check: d => d.teamsCompleted >= 5, progress: d => ({ current: Math.min(d.teamsCompleted, 5), target: 5 }) },
  { id: 'first_trade',name: 'Primer Trade',        desc: 'Completá tu primer intercambio',  rarity: 'bronze',    icon: '🤝', check: d => d.trades >= 1 },
  { id: 'trader',     name: 'Negociador',          desc: '5 intercambios completados',      rarity: 'silver',    icon: '💼', check: d => d.trades >= 5, progress: d => ({ current: Math.min(d.trades, 5), target: 5 }) },
  { id: 'market',     name: 'Rey del Mercado',     desc: '20 intercambios completados',     rarity: 'gold',      icon: '👑', check: d => d.trades >= 20, progress: d => ({ current: Math.min(d.trades, 20), target: 20 }) },
  { id: 'extras',     name: 'Gran Coleccionista',  desc: '50 figuritas repetidas acumuladas',rarity: 'silver',   icon: '📦', check: d => d.repeated >= 50, progress: d => ({ current: Math.min(d.repeated, 50), target: 50 }) },
  { id: 'cc',         name: 'Colección Coca-Cola', desc: 'Obtenés las 14 figuritas CC',     rarity: 'gold',      icon: '🥤', check: d => d.hasAllCC },
  { id: 'intro',      name: 'La Copa del Mundo',   desc: 'Completás la sección Intro',      rarity: 'silver',    icon: '🌐', check: d => d.hasAllIntro },
  { id: 'final_sec',  name: 'Historia del Mundial',desc: 'Completás la sección Final',      rarity: 'gold',      icon: '📜', check: d => d.hasAllFinal },
]

// ─── Counter animation ────────────────────────────────────────────────────────

function useCountUp(target: number, ms = 900): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    let cur = 0
    const steps = 36
    const inc = target / steps
    const delay = ms / steps
    const t = setInterval(() => {
      cur += inc
      if (cur >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(cur))
    }, delay)
    return () => clearInterval(t)
  }, [target, ms])
  return val
}

// ─── Time ago ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent = false }: { icon: string; label: string; value: number; accent?: boolean }) {
  const display = useCountUp(value)
  return (
    <div className={`flex-1 min-w-0 rounded-xl p-3 flex flex-col items-center gap-1 text-center border ${
      accent ? 'bg-gold/8 border-gold/25' : 'bg-surface2/70 border-surface3/80'
    }`}>
      <span className="text-lg leading-none">{icon}</span>
      <span className={`font-display text-2xl leading-none ${accent ? 'text-gold2' : 'text-white'}`}>
        {display.toLocaleString('es')}
      </span>
      <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold leading-tight">{label}</span>
    </div>
  )
}

function RankMedal({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-lg leading-none">🥇</span>
  if (pos === 2) return <span className="text-lg leading-none">🥈</span>
  if (pos === 3) return <span className="text-lg leading-none">🥉</span>
  return <span className="text-[11px] font-bold text-gray-600 w-5 text-center tabular-nums">#{pos}</span>
}

function RankRow({ entry, pos, isMe }: { entry: RankEntry; pos: number; isMe: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(pos * 0.04, 0.4) }}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${
        isMe
          ? 'bg-gold/10 border border-gold/30 shadow-[0_0_12px_rgba(245,197,66,0.12)]'
          : 'bg-surface3/30 border border-surface3/40'
      }`}
    >
      <div className="w-5 shrink-0 flex items-center justify-center">
        <RankMedal pos={pos} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-bold truncate leading-tight ${isMe ? 'text-gold2' : 'text-white'}`}>
          {entry.displayName}
          {isMe && <span className="ml-1 text-[8px] text-gold/50 font-normal">(vos)</span>}
        </div>
        <div className="mt-1 h-1 bg-surface3 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: isMe ? 'linear-gradient(90deg, #F5C542, #FFD700)' : 'linear-gradient(90deg, #4B5563, #6B7280)' }}
            initial={{ width: 0 }}
            animate={{ width: `${entry.pct}%` }}
            transition={{ duration: 0.8, delay: Math.min(pos * 0.04, 0.4) + 0.1, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-[11px] font-bold leading-none ${isMe ? 'text-gold2' : 'text-gray-300'}`}>{entry.pct}%</div>
        <div className="text-[9px] text-gray-600 mt-0.5">{entry.ownedCount.toLocaleString('es')}</div>
      </div>
    </motion.div>
  )
}

function AchBadge({ def, unlocked, data }: { def: AchDef; unlocked: boolean; data: AchData }) {
  const s = RARITY[def.rarity]
  const prog = def.progress?.(data)
  const pct = prog ? Math.min(100, Math.round((prog.current / prog.target) * 100)) : 0

  return (
    <div className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
      unlocked ? `${s.bg} ${s.border} ${s.glow}` : 'bg-surface2/30 border-surface3/30 opacity-45'
    }`}>
      <span className={`text-2xl leading-none ${unlocked ? '' : 'grayscale opacity-60'}`}>{def.icon}</span>
      <div className="text-center space-y-0.5">
        <div className={`text-[9px] font-bold leading-tight ${unlocked ? s.text : 'text-gray-600'}`}>{def.name}</div>
        <div className="text-[7.5px] text-gray-600 leading-tight">{def.desc}</div>
      </div>
      {!unlocked && prog && (
        <div className="w-full space-y-0.5">
          <div className="h-px bg-surface3 rounded-full overflow-hidden">
            <div className="h-full bg-gold/30 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[7px] text-gray-600 text-center">{prog.current}/{prog.target}</div>
        </div>
      )}
      {unlocked && (
        <div className={`text-[7px] font-bold uppercase tracking-wide ${s.text} opacity-60`}>{s.label}</div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DashboardViewProps {
  userId: string
  myProgress: UserProgress
  myStickers: StickerState[]
  myTrades: TradeRequest[]
}

export function DashboardView({ userId, myProgress, myStickers, myTrades }: DashboardViewProps) {
  const { loading, ranking, globalStats, mostWanted, mostAvailable, feed, myRank } = useDashboard(userId)

  // ── Achievement data computation
  const achData = useMemo((): AchData => {
    const ownedSet = new Set(
      myStickers
        .filter(s => s.status === 'owned' || s.status === 'repeated')
        .map(s => s.sticker_key)
    )
    const tradesCompleted = myTrades.filter(t => t.status === 'accepted').length
    const totalRepeated = myStickers
      .filter(s => s.status === 'repeated')
      .reduce((sum, s) => sum + (s.repeat_count ?? 0), 0)

    const teamsCompleted = TEAMS.filter(team =>
      Array.from({ length: 20 }, (_, i) => `${team.code}_${i}`).every(k => ownedSet.has(k))
    ).length

    const ccKeys = Array.from({ length: 14 }, (_, i) => `CC${i + 1}`)
    const introKeys = ['P00', ...Array.from({ length: 8 }, (_, i) => `FWC${i + 1}`)]
    const finalKeys = Array.from({ length: 11 }, (_, i) => `FWC${i + 9}`)

    return {
      owned: ownedSet.size,
      pct: myProgress.percentComplete,
      repeated: totalRepeated,
      trades: tradesCompleted,
      teamsCompleted,
      hasAllCC: ccKeys.every(k => ownedSet.has(k)),
      hasAllIntro: introKeys.every(k => ownedSet.has(k)),
      hasAllFinal: finalKeys.every(k => ownedSet.has(k)),
    }
  }, [myStickers, myTrades, myProgress])

  const { unlocked, locked } = useMemo(() => ({
    unlocked: ACHIEVEMENTS.filter(a => a.check(achData)),
    locked:   ACHIEVEMENTS.filter(a => !a.check(achData)).slice(0, 9),
  }), [achData])

  // ── Circular progress ring values
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (myProgress.percentComplete / 100) * circumference

  // ── My entry in ranking
  const myEntry = ranking.find(r => r.userId === userId)

  // ── Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
          <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin" />
        </div>
        <p className="text-sm text-gray-500 font-display tracking-widest uppercase">Cargando estadísticas</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">

      {/* ── Header ────────────────────────────────────────────────── */}
      <motion.div
        className="text-center pt-1"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-4xl text-gradient-gold tracking-wide uppercase leading-none">
          Dashboard Mundial
        </h2>
        <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">
          Estadísticas globales · Álbum 2026
        </p>
      </motion.div>

      {/* ── Global Stats Bar ───────────────────────────────────────── */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <StatCard icon="👤" label="Coleccionistas" value={globalStats.totalUsers} accent />
        <StatCard icon="🖼️" label="Figuritas" value={globalStats.totalOwned} />
        <StatCard icon="🤝" label="Intercambios" value={globalStats.totalTrades} />
        <StatCard icon="📦" label="Sobres" value={globalStats.totalPacks} />
      </motion.div>

      {/* ── My Stats + Ranking ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* My Stats */}
        <motion.div
          className="bg-surface2/70 border border-surface3 rounded-xl p-4 flex flex-col items-center gap-3"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Mi Colección</div>

          {/* Progress ring */}
          <div className="relative">
            <svg width="108" height="108" viewBox="0 0 108 108" className="-rotate-90">
              <circle cx="54" cy="54" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
              <motion.circle
                cx="54" cy="54" r={radius}
                fill="none"
                stroke="url(#dashGold)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              />
              <defs>
                <linearGradient id="dashGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F5C542" />
                  <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl text-gold2 leading-none">{myProgress.percentComplete}%</span>
              <span className="text-[9px] text-gray-600 mt-0.5">completo</span>
            </div>
          </div>

          {/* Key numbers */}
          <div className="w-full grid grid-cols-2 gap-1.5">
            {[
              { label: 'Obtenidas', value: myProgress.owned, color: 'text-white' },
              { label: 'Faltan',    value: myProgress.missing,  color: 'text-red-400' },
              { label: 'Repetidas', value: myProgress.repeated, color: 'text-amber-400' },
              { label: 'Selecciones', value: achData.teamsCompleted, color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface3/40 rounded-lg px-2.5 py-2 text-center">
                <div className={`text-sm font-bold ${color}`}>{value.toLocaleString('es')}</div>
                <div className="text-[9px] text-gray-600">{label}</div>
              </div>
            ))}
          </div>

          {/* My rank badge */}
          {myRank && (
            <div className="w-full bg-gold/8 border border-gold/20 rounded-lg py-2 text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Posición Global</div>
              <div className="font-display text-3xl text-gold2 leading-none mt-0.5">
                #{myRank}
                <span className="text-sm text-gray-500 font-barlow ml-1">de {ranking.length}</span>
              </div>
            </div>
          )}

          {/* My trade & pack stats */}
          {myEntry && (
            <div className="w-full flex gap-2">
              <div className="flex-1 bg-surface3/30 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-blue-400">{myEntry.tradesCount}</div>
                <div className="text-[8px] text-gray-600">Trades</div>
              </div>
              <div className="flex-1 bg-surface3/30 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-purple-400">{myEntry.packsCount}</div>
                <div className="text-[8px] text-gray-600">Sobres</div>
              </div>
              <div className="flex-1 bg-surface3/30 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-amber-400">{myEntry.extraCount}</div>
                <div className="text-[8px] text-gray-600">Extras</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Global Ranking */}
        <motion.div
          className="bg-surface2/70 border border-surface3 rounded-xl p-4 flex flex-col gap-2"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">🏆</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Ranking Global</span>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-none max-h-72">
            {ranking.length === 0 ? (
              <p className="text-[10px] text-gray-600 text-center py-8">Sin datos aún</p>
            ) : (
              ranking.slice(0, 10).map((entry, i) => (
                <RankRow key={entry.userId} entry={entry} pos={i + 1} isMe={entry.userId === userId} />
              ))
            )}
          </div>

          {myRank && myRank > 10 && (
            <div className="pt-1 border-t border-surface3/50">
              <div className="text-[9px] text-gray-600 text-center mb-1">···</div>
              {myEntry && <RankRow entry={myEntry} pos={myRank} isMe />}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Achievements ──────────────────────────────────────────── */}
      <motion.div
        className="bg-surface2/70 border border-surface3 rounded-xl p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎖️</span>
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold flex-1">Logros</span>
          <span className="text-[9px] text-gold/70 font-bold">{unlocked.length}/{ACHIEVEMENTS.length}</span>
        </div>

        {unlocked.length > 0 && (
          <div className="mb-4">
            <div className="text-[8px] text-green-500/60 uppercase tracking-widest mb-2">Desbloqueados</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {unlocked.map((def, i) => (
                <motion.div
                  key={def.id}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 220, damping: 14 }}
                >
                  <AchBadge def={def} unlocked data={achData} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {locked.length > 0 && (
          <div>
            <div className="text-[8px] text-gray-600 uppercase tracking-widest mb-2">Próximos logros</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {locked.map(def => (
                <AchBadge key={def.id} def={def} unlocked={false} data={achData} />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Intelligence + Feed ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Sticker heat maps */}
        <motion.div
          className="bg-surface2/70 border border-surface3 rounded-xl p-4 space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Most wanted */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">🔍</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Más Buscadas</span>
            </div>
            {mostWanted.length === 0 ? (
              <p className="text-[9px] text-gray-600 py-2 text-center">Sin datos</p>
            ) : (
              <div className="space-y-1.5">
                {mostWanted.map((item, i) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-700 tabular-nums w-3 shrink-0">#{i + 1}</span>
                    <StickerFlag stickerKey={item.key} className="text-sm leading-none shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-gold2 font-mono leading-none">{displayKey(item.key)}</div>
                      <div className="text-[8px] text-gray-500 truncate leading-tight">{getStickerName(item.key)}</div>
                    </div>
                    <span className="text-[9px] text-amber-400 font-bold shrink-0">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most available */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">♻️</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Más Disponibles</span>
            </div>
            {mostAvailable.length === 0 ? (
              <p className="text-[9px] text-gray-600 py-2 text-center">Sin datos</p>
            ) : (
              <div className="space-y-1.5">
                {mostAvailable.map((item, i) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-700 tabular-nums w-3 shrink-0">#{i + 1}</span>
                    <StickerFlag stickerKey={item.key} className="text-sm leading-none shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-gold2 font-mono leading-none">{displayKey(item.key)}</div>
                      <div className="text-[8px] text-gray-500 truncate leading-tight">{getStickerName(item.key)}</div>
                    </div>
                    <span className="text-[9px] text-green-400 font-bold shrink-0">×{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity feed */}
        <motion.div
          className="bg-surface2/70 border border-surface3 rounded-xl p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-sm">📡</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Actividad Reciente</span>
          </div>

          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-2xl opacity-30">🤝</span>
              <p className="text-[10px] text-gray-600">Sin intercambios registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feed.map((item, i) => (
                <motion.div
                  key={item.id}
                  className="flex gap-2.5"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + i * 0.05 }}
                >
                  <div className="shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center text-[9px]">🤝</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] leading-tight">
                      <span className="font-bold text-gold/90">{item.requesterName}</span>
                      <span className="text-gray-600 mx-1">↔</span>
                      <span className="font-bold text-blue-400/90">{item.ownerName}</span>
                    </div>
                    {item.stickerKeys.length > 0 && (
                      <div className="text-[8px] text-gray-600 mt-0.5 truncate">
                        {item.stickerKeys.slice(0, 4).map(k => displayKey(k)).join(' · ')}
                        {item.stickerKeys.length > 4 && ` +${item.stickerKeys.length - 4}`}
                      </div>
                    )}
                    <div className="text-[8px] text-gray-700 mt-0.5">{timeAgo(item.at)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
