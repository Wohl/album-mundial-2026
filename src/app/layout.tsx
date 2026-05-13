import type { Metadata } from 'next'
import './globals.css'
import 'flag-icons/css/flag-icons.min.css'

export const metadata: Metadata = {
  title: 'Álbum Mundial 2026',
  description: 'Colecciona figuritas del Mundial 2026',
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
      <body className="bg-dark text-white">{children}</body>
    </html>
  )
}
