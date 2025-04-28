'use client'

import { useEffect, useState } from 'react'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

import { AdminNavbar } from '@/components/admin/templates/Navbar'
import { Toaster } from '@/components/ui/toaster'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    <div className=" flex flex-col bg-gray-50 relative">
      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <AdminNavbar handleNavClick={handleNavClick} />
      </div>

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[900] flex flex-col items-center justify-center">
          <div className="relative h-72 w-72 animate-pulse">
            <Image
              src="/Logo.jpg"
              alt="Logo"
              fill
              className="rounded-md object-cover"
            />
          </div>
          <div className="text-xl text-white">Chargement...</div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">{children}</main>

      <Toaster />
    </div>
  )
}
