'use client'

import type { LiveEvent, LiveEventType } from '@/lib/live-data/types'

function eventIcon(type: LiveEventType): string {
  switch (type) {
    case 'goal':
    case 'penalty':    return '⚽'
    case 'own_goal':   return '⚽'
    case 'yellow_card': return '🟨'
    case 'red_card':
    case 'yellow_red_card': return '🟥'
    case 'substitution': return '🔄'
    case 'missed_penalty': return '❌'
    default: return '•'
  }
}

interface LiveEventsBlockProps {
  /** Full event list — component handles sorting and slicing */
  events: LiveEvent[]
  /**
   * When provided, shows only the last `maxItems` events (most recent, ascending order).
   * When omitted, shows all events in chronological order.
   */
  maxItems?: number
}

/**
 * Renders a chronological timeline of match events.
 * Used in compact form (last 3) and expanded form (full timeline).
 */
export function LiveEventsBlock({ events, maxItems }: LiveEventsBlockProps) {
  if (events.length === 0) return null

  // Always sort ascending (chronological)
  const sorted = [...events].sort(
    (a, b) => a.minute - b.minute || (a.extraTime ?? 0) - (b.extraTime ?? 0)
  )

  // Compact: take last N from sorted (most recent, still in ascending display order)
  const displayed = maxItems !== undefined ? sorted.slice(-maxItems) : sorted

  return (
    <div className="space-y-1.5">
      {displayed.map(ev => (
        <div key={ev.id} className="flex items-center gap-2 min-w-0">
          {/* Event icon */}
          <span className="shrink-0 text-[13px] leading-none w-5 text-center">
            {eventIcon(ev.type)}
          </span>

          {/* Minute */}
          <span
            className="shrink-0 tabular-nums font-bold"
            style={{ color: '#CBD5E1', fontSize: '11px', minWidth: '30px' }}
          >
            {ev.minute}{ev.extraTime ? `+${ev.extraTime}` : ''}&apos;
          </span>

          {/* Player / description */}
          <span
            className="flex-1 min-w-0 truncate"
            style={{ color: 'rgba(185,205,230,0.85)', fontSize: '11px' }}
          >
            {ev.type === 'substitution'
              ? `${ev.playerName} ← ${ev.playerOutName ?? '?'}`
              : ev.playerName}
          </span>

          {/* Team code badge */}
          <span
            className="shrink-0 font-bold uppercase tracking-wide rounded"
            style={{
              fontSize: '9px',
              color: 'rgba(163,181,211,0.55)',
              background: 'rgba(42,60,90,0.4)',
              padding: '1px 5px',
            }}
          >
            {ev.teamCode}
          </span>
        </div>
      ))}
    </div>
  )
}
