'use client'

import { useState, useEffect, useCallback } from 'react'

// Opening match: Mexico vs South Africa, 2026-06-11 13:00 CR/MX time (UTC-6) = 19:00 UTC
const WC_START = new Date('2026-06-11T13:00:00-06:00')

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  started: boolean
}

function calcTimeLeft(): TimeLeft {
  const now = new Date()
  const diff = WC_START.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true }
  const days    = Math.floor(diff / 86_400_000)
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000)  / 60_000)
  const seconds = Math.floor((diff % 60_000)      / 1_000)
  return { days, hours, minutes, seconds, started: false }
}

function DigitBlock({ value, label }: { value: number | null; label: string }) {
  const display = value === null ? '--' : String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative flex items-center justify-center rounded-xl font-display tabular-nums leading-none select-none"
        style={{
          width: 'clamp(52px, 9vw, 80px)',
          height: 'clamp(56px, 10vw, 88px)',
          fontSize: 'clamp(26px, 4.5vw, 44px)',
          background: 'rgba(8,17,32,0.85)',
          border: '1px solid rgba(245,197,66,0.22)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,197,66,0.08)',
          color: '#F5C542',
          letterSpacing: '0.04em',
        }}
      >
        {/* Divider line (flip-clock aesthetic) */}
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: '50%',
            height: '1px',
            background: 'rgba(245,197,66,0.12)',
          }}
        />
        {display}
      </div>
      <span
        className="font-display uppercase tracking-[0.28em] leading-none"
        style={{ fontSize: 'clamp(8px, 1.2vw, 11px)', color: 'rgba(163,181,211,0.55)' }}
      >
        {label}
      </span>
    </div>
  )
}

function Separator() {
  return (
    <div
      className="font-display leading-none self-start mt-3"
      style={{
        fontSize: 'clamp(22px, 3.5vw, 36px)',
        color: 'rgba(245,197,66,0.4)',
        lineHeight: 1,
        paddingBottom: '22px',
      }}
    >
      :
    </div>
  )
}

interface CountdownHeroProps {
  onCTAClick?: () => void
}

export function CountdownHero({ onCTAClick }: CountdownHeroProps) {
  // null = SSR/not yet mounted (avoids hydration mismatch)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTimeLeft(calcTimeLeft())
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const started = timeLeft?.started ?? false

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(10,20,42,0.97) 0%, rgba(8,17,32,0.99) 55%, rgba(15,24,42,0.96) 100%)',
        border: '1px solid rgba(245,197,66,0.18)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(245,197,66,0.06) inset',
      }}
    >
      {/* Ambient gold glow top-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-40px',
          right: '-40px',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(245,197,66,0.07) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Subtle diagonal lines texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(245,197,66,1) 0px, rgba(245,197,66,1) 1px, transparent 1px, transparent 12px)',
        }}
        aria-hidden="true"
      />

      <div className="relative px-5 py-6 sm:px-8 sm:py-7">

        {/* Top row: badge + title */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {/* Trophy icon */}
              <span
                className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                style={{ background: 'rgba(245,197,66,0.1)', border: '1px solid rgba(245,197,66,0.22)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                </svg>
              </span>

              <span
                className="font-display uppercase tracking-[0.28em] leading-none"
                style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', color: 'rgba(245,197,66,0.65)' }}
              >
                FIFA World Cup
              </span>
            </div>

            <h3
              className="font-display uppercase leading-none"
              style={{
                fontSize: 'clamp(22px, 4vw, 38px)',
                letterSpacing: '0.06em',
                background: 'linear-gradient(135deg, #F5C542 30%, #FFD700 65%, #FFF5CC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Mundial 2026
            </h3>

            <p
              className="mt-1.5 font-semibold tracking-wider"
              style={{ fontSize: 'clamp(10px, 1.4vw, 13px)', color: 'rgba(185,205,230,0.6)' }}
            >
              11 Jun &ndash; 19 Jul · USA · CAN · MEX
            </p>
          </div>

          {/* Emblem placeholder — unobtrusive */}
          <div
            className="shrink-0 hidden sm:flex items-center justify-center rounded-xl"
            style={{
              width: '56px',
              height: '56px',
              background: 'rgba(245,197,66,0.05)',
              border: '1px solid rgba(245,197,66,0.12)',
            }}
            aria-hidden="true"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(245,197,66,0.35)" strokeWidth="1.4">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              <path d="M2 12h20"/>
            </svg>
          </div>
        </div>

        {/* Countdown digits */}
        {started ? (
          <div
            className="flex items-center justify-center gap-3 py-3 rounded-xl mb-5"
            style={{ background: 'rgba(245,197,66,0.06)', border: '1px solid rgba(245,197,66,0.14)' }}
          >
            <span className="font-display uppercase tracking-widest text-gold" style={{ fontSize: 'clamp(14px, 2.5vw, 22px)' }}>
              ¡El Mundial ha comenzado!
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5">
            <DigitBlock value={timeLeft?.days   ?? null} label="Días" />
            <Separator />
            <DigitBlock value={timeLeft?.hours  ?? null} label="Horas" />
            <Separator />
            <DigitBlock value={timeLeft?.minutes ?? null} label="Min" />
            <Separator />
            <DigitBlock value={timeLeft?.seconds ?? null} label="Seg" />
          </div>
        )}

        {/* CTA */}
        {onCTAClick && (
          <div className="flex justify-center">
            <button
              onClick={onCTAClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display uppercase tracking-widest transition-all"
              style={{
                fontSize: 'clamp(10px, 1.5vw, 13px)',
                background: 'linear-gradient(135deg, #F5C542, #FFD700)',
                color: '#081120',
                boxShadow: '0 3px 18px rgba(245,197,66,0.30), 0 1px 0 rgba(255,255,255,0.18) inset',
                border: 'none',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = '0 4px 24px rgba(245,197,66,0.45), 0 1px 0 rgba(255,255,255,0.22) inset'
                el.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = '0 3px 18px rgba(245,197,66,0.30), 0 1px 0 rgba(255,255,255,0.18) inset'
                el.style.transform = 'translateY(0)'
              }}
            >
              Ver partidos
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
