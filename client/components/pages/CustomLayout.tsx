'use client'

import { usePathname } from 'next/navigation'

import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import MobileNav from '@/client/components/pages/MobileNav'
import SidebarMenu from '@/client/components/pages/Sidebar'
import { useNavigation } from '@/client/hooks/use-navigation'

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
  const pathname = usePathname()
  const { isNavigating, handleNavClick } = useNavigation()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Loading Overlay */}
      {isNavigating && (
        <LoadingScreen />
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
