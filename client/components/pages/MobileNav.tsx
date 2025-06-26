'use client'

import { LogOut } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

import { cn, logoutHandler } from '@/server/utils/helpers'

type MobileNavProps = {
  handleNavClick: (href: string) => void
  pathname: string
  navItems: {
    href: string
    label: string
    Icon: string
    pathPattern: string
  }[]
}

export default function MobileNav({
  handleNavClick,
  pathname,
  navItems,
}: Readonly<MobileNavProps>) {
  function isActive(item: { href: string; pathPattern: string }) {
    const pattern = new RegExp(item.pathPattern)
    return pattern.test(pathname)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground
      flex justify-around items-center py-2 md:hidden z-50 border-t border-border/30
      backdrop-blur-sm">
      {navItems.map(({ href, label, Icon, pathPattern }) => {
        const IconComponent =
          LucideIcons[Icon as keyof typeof LucideIcons] as React.ComponentType<{ size: number }>
        return (
          <button
            key={href}
            onClick={() => {
              if (!isActive({ href, pathPattern })) {
                handleNavClick(href)
              }
            }}
            disabled={isActive({ href, pathPattern })}
            aria-current={isActive({ href, pathPattern }) ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center px-2 py-1 rounded-md text-primary-foreground',
              isActive({ href, pathPattern })
                ? 'bg-background cursor-default text-primary'
                : 'transition-colors hover:bg-background/10 hover:text-primary-foreground ' +
                'group-hover:shadow-sm cursor-pointer',
            )}
          >
            {IconComponent && <IconComponent size={18} />}
            <span className='text-xs font-medium'>{label}</span>
          </button>
        )
      })}

      <button
        title="Déconnexion"
        className='flex flex-col items-center rounded-md text-error-foreground
        transition-colors bg-error hover:bg-error-dark py-2 px-3'
        onClick={logoutHandler}
      >
        <LogOut className="w-4 h-4 text-error-foreground" />
        <span className='text-error-foreground text-xs font-medium'>Sortir</span>
      </button>
    </nav>
  )
}
