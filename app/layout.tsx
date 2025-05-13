/**
 * EduRootS - Application de Gestion de Classe pour Mosquées
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
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import type { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'

import RootProvider from '@/components/utils/RootProvider'

import { ClearServiceWorkerCache } from '@/components/atoms/client/ClearServiceWorkerCache'
import { UpdateNotification } from '@/components/atoms/client/UpdateNotification'
import { Toaster } from '@/components/ui/toaster'

import { cn } from '@/lib/utils'
import '@/styles/globals.css'

export const dynamic = 'force-dynamic'
const fontSans = FontSans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  applicationName: 'EduRootS',
  manifest: '/manifest.json',
  title: 'EduRootS - Plateforme éducative',
  description: 'Application de gestion des cours',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduRootS',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'EduRootS',
    title: 'Bienvenue sur EduRootS',
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
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json?v=2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EduRootS" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
        )}
      >
        <ClearServiceWorkerCache />
        <UpdateNotification />
        <RootProvider>{children}</RootProvider>

        <Toaster />
        <ToastContainer />
      </body>
    </html>
  )
}
