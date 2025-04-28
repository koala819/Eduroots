import type { Metadata, Viewport } from 'next'

import { LoginClient } from '@/components/molecules/client/Login'
import { LoginMobileClient } from '@/components/molecules/client/LoginMobile'

export const metadata: Metadata = {
  title: 'EduRootS',
  description: 'Educational Platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduRootS',
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
  return (
    <div className="min-h-screen flex justify-center items-center">
      {/* Desktop version */}
      <div className="hidden md:block w-full">
        <LoginClient />
      </div>

      {/* Mobile version */}
      <div className="md:hidden w-full">
        <LoginMobileClient />
      </div>
    </div>
  )
}
