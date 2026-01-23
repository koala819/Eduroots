import type { Metadata, Viewport } from 'next'

import LoadingRoute from '@/client/components/atoms/LoadingRoute'
import { MenuHeader } from '@/client/components/organisms/HeaderMenu'
import { CustomLayout } from '@/client/components/pages/CustomLayout'
import GlobalServerProvider from '@/server/components/providers/GlobalServerProvider'
import { createClient } from '@/server/utils/supabase'

const navItems = [
  {
    href: '/admin',
    label: 'Accueil',
    Icon: 'Home',
    pathPattern: '^/admin$',
  },
  {
    href: '/admin/members',
    label: 'Membres',
    Icon: 'Users',
    pathPattern: '^/admin/members',
  },
  {
    href: '/admin/payments',
    label: 'Paiements',
    Icon: 'CreditCard',
    pathPattern: '^/admin/payments',
  },
  {
    href: '/admin/schedule',
    label: 'Planning',
    Icon: 'Calendar',
    pathPattern: '^/admin/(schedule|holidays)',
  },
  {
    href: '/admin/messages',
    label: 'Messages',
    Icon: 'MessageSquare',
    pathPattern: '^/admin/messages$',
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

  // Filtrer les navItems selon le rôle admin
  const filteredNavItems = navItems.filter((item) => {
    // Si c'est l'élément "Paramètres", ne l'afficher que pour les admins
    if (item.href === '/admin/settings') {
      return isAdmin
    }
    // Afficher tous les autres éléments
    return true
  })

  return (
    <GlobalServerProvider>
      <CustomLayout navItems={filteredNavItems} isAdmin={isAdmin}>
        <MenuHeader
          selectedSession={undefined}
          courses={[]}
          grades={[]}
          familyStudents={[]}
          isAdmin={isAdmin}
        />
        <LoadingRoute />
        {children}
      </CustomLayout>
    </GlobalServerProvider>
  )
}
