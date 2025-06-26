'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LoadingContent } from '@/client/components/atoms/StatusContent'
import MobileNav from '@/client/components/pages/MobileNav'
import SidebarMenu from '@/client/components/pages/Sidebar'

interface ClientLayoutProps {
  children: React.ReactNode
  navItems: {
    href: string
    label: string
    Icon: string
    pathPattern: string
  }[]
  isAdmin?: boolean
  teacher?: {
    firstname: string
    lastname: string
    email: string
  }
}

export function CustomLayout({
  children,
  navItems,
  isAdmin = false,
  teacher,
}: Readonly<ClientLayoutProps>) {
  const [isNavigating, setIsNavigating] = useState<boolean>(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  function handleNavClick(href: string) {
    setIsNavigating(true)
    router.push(href)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Loading Overlay */}
      {isNavigating && (
        <LoadingContent  />
      )}

      <div className="hidden md:block sticky top-0 h-screen">
        <SidebarMenu
          handleNavClick={handleNavClick}
          pathname={pathname}
          navItems={navItems}
          isAdmin={isAdmin}
          teacher={teacher}
        />
      </div>

      <div className="md:hidden">
        <MobileNav
          handleNavClick={handleNavClick}
          pathname={pathname}
          navItems={navItems}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col bg-background pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
