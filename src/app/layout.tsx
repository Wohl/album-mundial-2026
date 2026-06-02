import type { Metadata } from 'next'
import { Bebas_Neue, Barlow } from 'next/font/google'
import './globals.css'
import 'flag-icons/css/flag-icons.min.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const barlow = Barlow({
  weight: ['400', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Álbum Mundial 2026',
  description: 'Colecciona figuritas del Mundial 2026',
  icons: {
    icon: '/2026_FIFA_World_Cup_emblem.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${barlow.variable}`}>
      <head />
      <body className="bg-dark text-white">
        {/* ── Stadium background texture layers (fixed, behind all content) ── */}
        <div aria-hidden="true" className="stadium-dots-overlay fixed inset-0 pointer-events-none select-none" style={{ zIndex: 0 }} />
        <div aria-hidden="true" className="stadium-lines-overlay fixed inset-0 pointer-events-none select-none" style={{ zIndex: 0 }} />
        {/* ── Content sits above background at z-index: 1 ── */}
        <div className="relative" style={{ zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
