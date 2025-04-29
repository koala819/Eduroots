'use client'

import {useEffect, useState} from 'react'

import Image from 'next/image'
import {usePathname, useRouter} from 'next/navigation'

import FooterTeacher from '@/components/atoms/FooterTeacher'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({children}: ClientLayoutProps) {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  const handleNavClick = (href: string) => {
    setIsNavigating(true)
    router.push(href)
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-[90]">
          <div className="relative h-72 w-72 animate-pulse">
            <Image src="/Logo.jpg" alt="Logo" fill className="rounded-md object-cover" />
          </div>
          <div className="text-xl text-white">Chargement...</div>
        </div>
      )}

      {/* Main content */}
      <main className="w-full flex-grow pb-24 bg-gray-50">{children}</main>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white">
        <FooterTeacher handleNavClick={handleNavClick} currentRoute={pathname} />
      </div>
    </div>
  )
}
