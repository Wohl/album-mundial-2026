import type { Metadata } from 'next'
import './globals.css'
import 'flag-icons/css/flag-icons.min.css'

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
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
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
