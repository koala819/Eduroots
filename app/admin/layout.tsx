import type { Metadata, Viewport } from 'next'
import GlobalServerProvider from '@/components/providers/server/GlobalServerProvider'
import { createClient } from '@/utils/supabase/server'
import { CustomLayout } from '@/components/template/CustomLayout'

const navItems = [
  { href: '/admin', label: 'Tableau de bord', Icon: 'Home' },
  { href: '/admin/schedule', label: 'Emplois du temps', Icon: 'Calendar' },
  { href: '/admin/messages/inbox', label: 'Messages', Icon: 'MessageSquare' },
  { href: '/admin/settings', label: 'Paramètres', Icon: 'Settings' },
]

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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.user_metadata?.role === 'admin'

  return (
    <GlobalServerProvider>
      <CustomLayout navItems={navItems} isAdmin={isAdmin}>
        {children}
      </CustomLayout>
    </GlobalServerProvider>
  )
}
