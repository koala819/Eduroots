'use client'

import {Calendar, Home, MessageSquare} from 'lucide-react'
import {signOut, useSession} from 'next-auth/react'
import {useState} from 'react'

import {usePathname} from 'next/navigation'

import {NavbarDesktop} from '@/components/admin/atoms/NavbarDesktop'
import {NavbarMobile} from '@/components/admin/atoms/NavbarMobile'

type AdminNavbarProps = {
  handleNavClick: (href: string) => void
}

export function AdminNavbar({handleNavClick}: AdminNavbarProps) {
  const {data: session} = useSession()
  const pathname = usePathname()

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)

  const items = [
    {
      category: 'Navigation',
      items: [
        {
          href: '/admin',
          icon: Home,
          label: 'Tableau de bord',
          description: "Vue d'ensemble et statistiques",
          shortcut: '⌘ H',
        },
      ],
    },
    {
      category: 'Gestion',
      items: [
        {
          href: '/admin/schedule',
          icon: Calendar,
          label: 'Emplois du temps',
          description: 'Gérer les plannings',
          shortcut: '⌘ E',
        },
        {
          href: '/admin/messages/inbox',
          icon: MessageSquare,
          label: 'Messages',
          description: 'Communications et notifications',
          shortcut: '⌘ M',
        },
      ],
    },
  ]

  const isAdmin = session?.user?.role === 'admin'

  function handleItemClick(href: string) {
    setIsMobileOpen(false)
    handleNavClick(href)
  }

  function logoutHandler() {
    signOut({
      redirect: true,
      callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
    })
  }

  function getButtonClass(variant: 'ghost' | 'secondary') {
    if (!isAdmin) return ''
    return variant === 'ghost'
      ? 'hover:bg-red-600 hover:text-white text-white'
      : 'bg-red-600 hover:bg-red-700 text-white'
  }

  return (
    <nav
      className={`sticky top-0 z-50 border-b ${
        isAdmin ? 'bg-red-500 text-white' : 'bg-background'
      }`}
    >
      <div className="mx-auto px-4">
        <div className="md:hidden">
          <NavbarMobile
            items={items}
            pathname={pathname}
            handleItemClick={handleItemClick}
            logoutHandler={logoutHandler}
            isAdmin={isAdmin}
            session={session}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            getButtonClass={getButtonClass}
          />
        </div>
        <div className="hidden md:block">
          <NavbarDesktop
            items={items}
            pathname={pathname}
            handleItemClick={handleItemClick}
            getButtonClass={getButtonClass}
            isAdmin={isAdmin}
            session={session}
          />
        </div>
      </div>
    </nav>
  )
}
