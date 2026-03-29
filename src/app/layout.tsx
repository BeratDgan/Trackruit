import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trackruit — Kariyer Takip',
  description: 'AI destekli kariyer yönetim platformu',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
