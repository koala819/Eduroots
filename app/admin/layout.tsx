import type { Metadata, Viewport } from 'next'

import AdminLayout from '@/components/admin/templates/AdminLayout'
import GlobalServerProvider from '@/components/providers/server/GlobalServerProvider'

const currentYear = new Date().getFullYear()

export const metadata: Metadata = {
  title: `Administration des cours ${currentYear}`,
  description: 'Plateforme d\'administration des cours pour l\'école coranique',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: 'white',
}

export default function Layout({ children }: {children: React.ReactNode}) {
  return (
    <GlobalServerProvider>
      <AdminLayout>{children}</AdminLayout>
    </GlobalServerProvider>
  )
}
