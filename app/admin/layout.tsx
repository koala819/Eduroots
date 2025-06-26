import type { Metadata, Viewport } from 'next'

import { MenuHeader } from '@/client/components/organisms/HeaderMenu'
import { CustomLayout } from '@/client/components/pages/CustomLayout'
import GlobalServerProvider from '@/server/components/providers/GlobalServerProvider'
import { createClient } from '@/server/utils/supabase'

const navItems = [
  {
    href: '/admin',
    label: 'Tableau de bord',
    Icon: 'Home',
    pathPattern: '^/admin$',
  },
  {
    href: '/admin/schedule',
    label: 'Emplois du temps',
    Icon: 'Calendar',
    pathPattern: '^/admin/schedule$',
  },
  {
    href: '/admin/messages/inbox',
    label: 'Messages',
    Icon: 'MessageSquare',
    pathPattern: '^/admin/messages/inbox$',
  },
  {
    href: '/admin/settings',
    label: 'Paramètres',
    Icon: 'Settings',
    pathPattern: '^/admin/settings$',
  },
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

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.user_metadata?.role === 'admin'

  return (
    <GlobalServerProvider>
      <CustomLayout navItems={navItems} isAdmin={isAdmin}>
        <MenuHeader
          selectedSession={undefined}
          courses={[]}
          grades={[]}
          familyStudents={[]}
          isAdmin={isAdmin}
        />
        {children}
      </CustomLayout>
    </GlobalServerProvider>
  )
}
