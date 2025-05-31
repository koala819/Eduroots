'use client'

import { Inbox, Menu, PenTool, Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

const MailboxLayout = ({
  children,
  basePath,
}: Readonly<{
  children: React.ReactNode
  basePath: string
}>) => {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAtTop, setIsAtTop] = useState(true)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  // Gestion du scroll pour cacher/montrer le header
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY
      setIsAtTop(currentScroll <= 0)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermeture automatique sur mobile lors d'un changement de route
  useEffect(() => {
    closeSidebar()
  }, [pathname])

  const sidebarItems = [
    { name: 'Boîte de réception', icon: Inbox, path: '/inbox' },
    { name: 'Messages envoyés', icon: Send, path: '/sent' },
  ]

  const currentItem = sidebarItems.find(
    (item) => pathname?.endsWith(item.path) ?? false,
  )

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-full sm:w-80'+
          'bg-white transform transition-transform duration-300 ease-in-out',
          'lg:relative lg:transform-none',
          isSidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header du sidebar */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={closeSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Bouton nouveau message */}
        <div className="p-4">
          <Link href={`${basePath}/write`}>
            <Button className="w-full gap-2">
              <PenTool className="w-4 h-4" />
              Nouveau message
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-2">
          {sidebarItems.map((item) => (
            <Link href={`${basePath}${item.path}`} key={item.name}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  'hover:bg-gray-100',
                  pathname?.endsWith(item.path) ?? false
                    ? 'bg-gray-100 text-primary'
                    : 'text-gray-600',
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header mobile */}
        <header
          className={cn(
            'sticky top-0 z-30 bg-white border-b lg:hidden',
            'transition-transform duration-300',
            !isAtTop && '-translate-y-full',
          )}
        >
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 flex items-center gap-2 text-sm font-medium">
              {currentItem && (
                <>
                  <currentItem.icon className="w-4 h-4" />
                  {currentItem.name}
                </>
              )}
            </div>

            <Link href={`${basePath}/write`}>
              <Button size="sm" className="gap-2">
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau message</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Zone de contenu */}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  )
}

export default MailboxLayout
