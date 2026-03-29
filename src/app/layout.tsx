import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trackruit — Kariyer Takip',
  description: 'AI destekli kariyer yönetim platformu',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
