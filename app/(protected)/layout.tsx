import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import GlobalServerProvider from '@/server/components/providers/GlobalServerProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const currentYear = new Date().getFullYear()

export const metadata: Metadata = {
  title: `Gestion des cours ${currentYear}`,
  description: 'Plateforme de gestion des cours pour l\'école coranique',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
  ],
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <GlobalServerProvider>
      <div className={`${inter.variable} font-sans min-h-screen bg-background
        text-foreground antialiased`}>
        {children}
      </div>
    </GlobalServerProvider>
  )
}
