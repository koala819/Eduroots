'use client'
import React from 'react'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import {cn} from '@/lib/utils'
import EdurootsLogo from '@/public/Logo-blanc.webp'
import Image from 'next/image'

type SidebarMenuProps = {
  handleNavClick: (href: string) => void
  pathname: string
  navItems: { href: string; label: string; Icon: React.ElementType }[]
}


export default function SidebarMenu({ handleNavClick, pathname, navItems }: SidebarMenuProps) {
    function isActive (path: string) {
      return pathname === path
    }

    function logoutHandler() {
        signOut({
        redirect: true,
        callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
        })
    }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col bg-[#375073] text-white w-64 py-6 px-4 h-screen">
        {/* Logo */}
        <div>
          <div className="flex items-center mb-8">
            <Image src={EdurootsLogo} alt="Eduroots" className="h-24 w-24 mr-2" />
            <span className="font-bold text-xl">Eduroots</span>
          </div>

        </div>
        {/* Menu */}
        <div className="flex flex-col gap-8">
           {navItems.map(({ href, label, Icon }) => {

            return (
              <button
                key={href}
                onClick={() => !isActive(href) && handleNavClick(href)}
                disabled={isActive(href)}
                aria-current={isActive(href) ? 'page' : undefined}
                aria-label={label}
                tabIndex={isActive(href) ? -1 : 0}
                className={cn(
                'flex flex-col items-center px-2 py-1 rounded-md text-white',
                isActive(href)
                  ? 'bg-white cursor-default text-primary'
                  : 'transition-colors hover:bg-white/10 hover:text-white group-hover:shadow-sm cursor-pointer',
              )}
              >
                <Icon className="h-6 w-6 mx-auto"/>
                {label}
              </button>
            )
          })}


          <button
           title="Déconnexion"
           className='flex flex-col items-center px-2 py-1 rounded-md text-white transition-colors hover:bg-white/10 hover:text-white group-hover:shadow-sm cursor-pointer'
           onClick={logoutHandler}
          >
            <LogOut className="w-6 h-6 mx-auto text-red-400" />
            <span className='text-red-400'>Sortir</span>
          </button>
        </div>
      </aside>

      {/* Barre de navigation mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#375073] text-white flex justify-around items-center py-2 md:hidden z-50">
        {navItems.map(({ href, label, Icon }) => {

            return (
              <button
                key={href}
                onClick={() => !isActive(href) && handleNavClick(href)}
                disabled={isActive(href)}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                'flex flex-col items-center px-2 py-1 rounded-md text-white',
                isActive(href)
                  ? 'bg-white cursor-default text-primary'
                  : 'transition-colors hover:bg-white/10 hover:text-white group-hover:shadow-sm cursor-pointer',
              )}
              >
                <Icon className="h-6 w-6 mx-auto"/>
                {label}
              </button>
            )
          })}

        <button
         title="Déconnexion"
         className='flex flex-col items-center px-2 py-1 rounded-md text-white transition-colors cursor-pointer'
         onClick={logoutHandler}
        >
          <LogOut className="w-6 h-6 text-red-400" />
          <span className='text-red-400'>Sortir</span>
        </button>
      </nav>
    </>
  )
}