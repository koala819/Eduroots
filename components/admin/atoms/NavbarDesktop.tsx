import { LucideIcon, Settings } from 'lucide-react'

import { Session } from 'next-auth'
import Image from 'next/image'

import { Button } from '@/components/ui/button'

type NavItem = {
  href: string
  icon: LucideIcon
  label: string
  description?: string
  shortcut?: string
}

type ItemsGroup = {
  category: string
  items: NavItem[]
}

type NavbarDesktopProps = {
  items: ItemsGroup[]
  pathname: string | null
  handleItemClick: (href: string) => void
  getButtonClass: (variant: 'ghost' | 'secondary') => string
  isAdmin: boolean
  session: Session | null
}

export const NavbarDesktop = ({
  items,
  pathname,
  handleItemClick,
  getButtonClass,
  isAdmin,
  session,
}: NavbarDesktopProps) => {
  return (
    <nav className="flex justify-between items-center">
      <aside>
        <button
          onClick={() => pathname !== '/admin' && handleItemClick('/admin')}
          className={`flex items-center gap-x-2 ${isAdmin ? 'text-white' : ''} ${pathname === '/admin' ? 'cursor-auto' : ''}`}
        >
          <div className="relative h-12 w-16 shrink-0">
            <Image
              src="/Logo.jpg"
              alt="Logo"
              fill
              className="object-cover rounded-md"
            />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-semibold">Administration</span>
            <span
              className={`text-xs ${isAdmin ? 'text-red-100' : 'text-muted-foreground'}`}
            >
              {session?.user?.firstname} {session?.user?.lastname}
            </span>
          </div>
        </button>
      </aside>
      {/* Center Menu */}
      <aside>
        {items.slice(0, 2).flatMap((group) =>
          group.items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                key={item.href}
                variant={isActive ? 'secondary' : 'ghost'}
                disabled={isActive}
                aria-current={isActive ? 'page' : undefined}
                className={`h-8 gap-x-2 ${getButtonClass(
                  pathname === item.href ? 'secondary' : 'ghost',
                )}`}
                // className="h-8 gap-x-2"
                onClick={() => !isActive && handleItemClick(item.href)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          }),
        )}
      </aside>
      {/* Right Action */}
      <aside>
        <Button
          variant="ghost"
          size="icon"
          className={getButtonClass('ghost')}
          onClick={() => handleItemClick('/admin/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </aside>
    </nav>
  )
}
