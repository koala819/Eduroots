import { LogOut, LucideIcon, Menu, Plus, Settings } from 'lucide-react'

import { Session } from 'next-auth'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

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

type NavbarMobileProps = {
  items: ItemsGroup[]
  pathname: string | null
  handleItemClick: (href: string) => void
  logoutHandler: () => void
  isAdmin: boolean
  session: Session | null
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  getButtonClass: (variant: 'ghost' | 'secondary') => string
}

export const NavbarMobile = ({
  items,
  pathname,
  handleItemClick,
  logoutHandler,
  isAdmin,
  session,
  isMobileOpen,
  setIsMobileOpen,
  getButtonClass,
}: NavbarMobileProps) => {
  return (
    <div className="flex items-center  w-full h-16 justify-between ">
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden ${getButtonClass('ghost')}`}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className={`w-80 p-0 ${isAdmin ? 'bg-red-500 text-white' : ''}`}
        >
          <SheetHeader className="border-b p-4">
            <div className="flex items-center gap-x-2">
              <div className="relative h-12 w-16 shrink-0">
                <Image
                  src="/Logo.jpg"
                  alt="Logo"
                  fill
                  className="rounded-md object-cover"
                />
              </div>
              <div className="flex flex-col">
                <SheetTitle className="text-left">
                  {session?.user?.firstname} {session?.user?.lastname}
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-4 space-y-4">
              {/* Navigation Principale */}
              <div className="space-y-2">
                {items.slice(0, 2).flatMap((group) =>
                  group.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Button
                        key={item.href}
                        variant={isActive ? 'secondary' : 'ghost'}
                        disabled={isActive}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full justify-start ${
                          isActive ? 'font-semibold cursor-default' : ''
                        }`}
                        onClick={() => !isActive && handleItemClick(item.href)}
                      >
                        <item.icon
                          className={`h-4 w-4 mr-2 ${isActive ? 'text-white' : ''}`}
                          strokeWidth={isActive ? 2 : 1}
                        />
                        {item.label}
                      </Button>
                    )
                  }),
                )}
              </div>

              {/* Actions Rapides */}
              {isAdmin && (
                <div className="space-y-2 pt-2 border-t">
                  <h3 className="text-xs font-medium text-muted-foreground px-2">
                    Actions Rapides
                  </h3>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleItemClick('/admin/root/student/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel élève
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleItemClick('/admin/root/teacher/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau professeur
                  </Button>
                </div>
              )}

              {/* Organisation */}
              <div className="space-y-2 pt-2 border-t">
                <h3 className="text-xs font-medium text-muted-foreground px-2">
                  Organisation
                </h3>
                {items
                  .filter((group) => group.category === 'Gestion')
                  .flatMap((group) =>
                    group.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Button
                          key={item.href}
                          variant={isActive ? 'secondary' : 'ghost'}
                          disabled={isActive}
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full justify-start ${isActive ? 'font-semibold cursor-default' : ''}`}
                          onClick={() =>
                            !isActive && handleItemClick(item.href)
                          }
                        >
                          <item.icon
                            className={`h-4 w-4 mr-2 ${isActive ? 'text-white' : ''}`}
                            strokeWidth={isActive ? 2 : 1}
                          />
                          {item.label}
                        </Button>
                      )
                    }),
                  )}
              </div>
              {/* Paramètres et Déconnexion */}
              <div className="space-y-2 pt-2 border-t">
                {(() => {
                  const isActive = pathname === '/admin/settings'
                  return (
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      disabled={isActive}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full justify-start ${
                        isActive ? 'font-semibold cursor-default' : ''
                      }`}
                      onClick={() =>
                        !isActive && handleItemClick('/admin/settings')
                      }
                    >
                      <Settings
                        className={`h-4 w-4 mr-2 ${isActive ? 'text-white' : ''}`}
                        strokeWidth={isActive ? 2 : 1}
                      />
                      Paramètres
                    </Button>
                  )
                })()}
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={logoutHandler}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <button
        onClick={() => pathname !== '/admin' && handleItemClick('/admin')}
        className={`flex items-center gap-x-2 ${isAdmin ? 'text-white' : ''} ${pathname === '/admin' ? 'cursor-auto' : ''}`}
      >
        <div className="relative h-12 w-16 shrink-0">
          <Image
            src="/Logo.jpg"
            alt="Logo"
            fill
            className="rounded-md object-cover"
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
    </div>
  )
}
