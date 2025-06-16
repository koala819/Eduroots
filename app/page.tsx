import { LoginClient } from '@/client/components/atoms/Login'

import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Eduroots',
  description: 'Educational Platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Eduroots',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/touch-icon-iphone.png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      {
        url: '/icons/touch-icon-ipad-retina.png',
        sizes: '167x167',
        type: 'image/png',
      },
    ],
  },
  manifest: '/manifest.json?v=2',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function HomePage() {
  return <LoginClient />
}
