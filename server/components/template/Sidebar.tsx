'use client'
import { LogOut } from 'lucide-react'
import { cn, logoutHandler } from '@/server/utils/helpers'
import EdurootsLogo from '@/public/Logo-blanc.webp'
import Image from 'next/image'
import * as LucideIcons from 'lucide-react'

type SidebarMenuProps = {
  handleNavClick: (href: string) => void
  pathname: string
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

export default function SidebarMenu({
  handleNavClick,
  pathname,
  navItems,
  isAdmin = false,
  teacher,
}: Readonly<SidebarMenuProps>) {
  function isActive(item: { href: string; pathPattern: string }) {
    const pattern = new RegExp(item.pathPattern)
    return pattern.test(pathname)
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside
        className={`hidden md:flex flex-col
        ${isAdmin ? 'bg-red-500' : 'bg-[#375073]'} text-white w-64 py-6 px-4 h-full`}>
        {/* Logo */}
        <div>
          <div className="flex items-center">
            <Image src={EdurootsLogo} alt="Eduroots" className="h-24 w-24 mr-2" />
            <span className="font-bold text-xl">Eduroots</span>
          </div>
          <div className="flex flex-col mb-8 text-center text-white">
            <span className="font-bold text-lg">{teacher?.firstname} {teacher?.lastname}</span>
            <span className="font-bold text-xs">{teacher?.email}</span>
          </div>

        </div>
        {/* Menu */}
        <div className="flex flex-col gap-8">
          {navItems.map(({ href, label, Icon, pathPattern }) => {
            const IconComponent =
              LucideIcons[Icon as keyof typeof LucideIcons] as React.ComponentType<{ size: number }>
            return (
              <button
                key={href}
                onClick={() => !isActive({ href, pathPattern }) && handleNavClick(href)}
                disabled={isActive({ href, pathPattern })}
                aria-current={isActive({ href, pathPattern }) ? 'page' : undefined}
                aria-label={label}
                tabIndex={isActive({ href, pathPattern }) ? -1 : 0}
                className={cn(
                  'flex flex-col items-center px-2 py-1 rounded-md text-white',
                  isActive({ href, pathPattern })
                    ? isAdmin
                      ? 'bg-red-600 cursor-default text-white border-l-4 border-red-700'
                      : 'bg-white cursor-default text-primary'
                    : 'transition-colors hover:bg-white/10 cursor-pointer group-hover:shadow-sm',
                )}
              >
                {IconComponent && <IconComponent size={42} />}
                {label}
              </button>
            )
          })}


          <button
            title="Déconnexion"
            className='flex flex-col items-center px-2 py-1 rounded-md
            text-white transition-colors hover:bg-white/10 hover:text-white
            group-hover:shadow-sm cursor-pointer bg-red-500'
            onClick={logoutHandler}
          >
            <LogOut className="w-6 h-6 mx-auto text-[#EDEDED]" />
            <span className='text-[#EDEDED] font-medium text-xl tracking-widest'>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Barre de navigation mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#375073] text-white
      flex justify-around items-center py-2 md:hidden z-50">
        {navItems.map(({ href, label, Icon, pathPattern }) => {
          const IconComponent =
            LucideIcons[Icon as keyof typeof LucideIcons] as React.ComponentType<{ size: number }>
          return (
            <button
              key={href}
              onClick={() => !isActive({ href, pathPattern }) && handleNavClick(href)}
              disabled={isActive({ href, pathPattern })}
              aria-current={isActive({ href, pathPattern }) ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center px-2 py-1 rounded-md text-white',
                isActive({ href, pathPattern })
                  ? 'bg-white cursor-default text-primary'
                  : 'transition-colors hover:bg-white/10 hover:text-white' +
                  'group-hover:shadow-sm cursor-pointer',
              )}
            >
              {IconComponent && <IconComponent size={18} />}
              <span className='text-xs'>{label}</span>
            </button>
          )
        })}

        <button
          title="Déconnexion"
          className='flex flex-col items-center px-2 py-1 rounded-md text-white
          transition-colors bg-red-500 py-2'
          onClick={logoutHandler}
        >
          <LogOut className="w-4 h-4 text-[#EDEDED]" />
          <span className='text-[#EDEDED] text-xs'>Sortir</span>
        </button>
      </nav>
    </>
  )
}
