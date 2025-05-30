'use client'

import {useEffect, useState} from 'react'
import SidebarMenu from '@/components/template/Sidebar'
import Image from 'next/image'
import {usePathname, useRouter} from 'next/navigation'
import { Home, User, Mail } from 'lucide-react'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function FamilyLayout({children}: ClientLayoutProps) {
  const [isNavigating, setIsNavigating] = useState<boolean>(false)
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: '/family', label: 'Scolarité', Icon: Home },
    { href: '/family/messages', label: 'Messagerie', Icon: Mail },
    { href: '/family/profile', label: 'Profil', Icon: User },
  ]

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

   function handleNavClick (href: string) {
    setIsNavigating(true)
    router.push(href)
  }

  return (
    <div className="flex min-h-screen">

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-[90]">
          <div className="relative h-72 w-72 animate-pulse">
            <Image src="/Logo.jpg" alt="Logo" fill className="rounded-md object-cover" />
          </div>
          <div className="text-xl text-white">Chargement...</div>
        </div>
      )}

      <SidebarMenu handleNavClick={handleNavClick} pathname={pathname} navItems={navItems} />

      {/* Main content */}
      <main className="flex-1 flex flex-col bg-slate-50 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  )
}
