/**
 * Eduroots - Application de Gestion de Classe pour Mosquées
 * Copyright (C) 2024 Xavier
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import 'react-toastify/dist/ReactToastify.css'
import './app.css'

import type { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'
import { ToastContainer } from 'react-toastify'

import { ClearServiceWorkerCache } from '@/client/components/atoms/ClearServiceWorkerCache'
import { SuppressReact19Warning } from '@/client/components/atoms/SuppressReact19Warning'
import { Toaster } from '@/client/components/ui/toaster'
import { cn } from '@/server/utils/helpers'

export const dynamic = 'force-dynamic'
const fontSans = FontSans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  applicationName: 'Eduroots',
  manifest: '/manifest.json',
  title: 'Eduroots - Plateforme éducative',
  description: 'Application de gestion des cours',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Eduroots',
    startupImage: [
      {
        url: '/splash.png',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash.png',
        media:
          '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Eduroots',
    title: 'Bienvenue sur Eduroots',
    description: 'Application éducative et communautaire',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: [
      {
        url: '/touch-icon-iphone.png',
        sizes: '180x180',
        type: 'image/png',
      },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      {
        url: '/touch-icon-ipad-retina.png',
        sizes: '167x167',
        type: 'image/png',
      },
      {
        url: '/touch-icon-ipad.png',
        sizes: '152x152',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1E293B' },
    { media: '(prefers-color-scheme: light)', color: '#60A5FA' },
  ],
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json?v=2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Eduroots" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 320px) and (device-height: 568px)
          and (-webkit-device-pixel-ratio: 2)"
          href="/splash.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 375px) and (device-height: 667px)
          and (-webkit-device-pixel-ratio: 2)"
          href="/splash.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 414px) and (device-height: 736px)
          and (-webkit-device-pixel-ratio: 3)"
          href="/splash.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 375px) and (device-height: 812px)
          and (-webkit-device-pixel-ratio: 3)"
          href="/splash.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 414px) and (device-height: 896px)
          and (-webkit-device-pixel-ratio: 3)"
          href="/splash.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 390px) and (device-height: 844px)
          and (-webkit-device-pixel-ratio: 3)"
          href="/splash.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 428px) and (device-height: 926px)
          and (-webkit-device-pixel-ratio: 3)"
          href="/splash.png"
        />
      </head>
      <body
        className={cn(
          'min-h-screen font-sans antialiased layout',
          fontSans.variable,
        )}
      >
        <ClearServiceWorkerCache />
        <SuppressReact19Warning />
        {children}

        <Toaster />
        <ToastContainer />
      </body>
    </html>
  )
}
