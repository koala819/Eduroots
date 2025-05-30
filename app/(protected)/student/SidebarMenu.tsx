'use client'
import React from 'react'
import { Home, User, LogOut, Mail } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import {cn} from '@/lib/utils'
import EdurootsLogo from '@/public/Logo-blanc.webp'
import Image from 'next/image'


export default function SidebarMenu() {
    const pathname = usePathname()
    const router = useRouter()

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
    <aside className="flex flex-col bg-[#375073] text-white w-64 py-6 px-4 h-full">
      {/* Logo */}
      <div>
        <div className="flex items-center mb-8">
          <Image src={EdurootsLogo} alt="Eduroots" className="h-24 w-24 mr-2" />
          <span className="font-bold text-xl">Eduroots</span>
        </div>

      </div>
      {/* Menu */}
      <div className="flex flex-col gap-8">
        <button
            className={cn(
              'flex flex-col items-center px-2 py-1 rounded-md text-white',
              isActive('/student')
                ? 'bg-white cursor-default text-primary'
                : 'transition-colors hover:bg-white/10 hover:text-white group-hover:shadow-sm cursor-pointer',
            )}
          onClick={(e) => {
            router.push('/student')
            if (isActive('/student')) {
                e.preventDefault()
            }
          }}
        >
            <Home className="w-6 h-6 mx-auto" />
            Scolarité
        </button>

        <button
            className={cn(
              'flex flex-col items-center px-2 py-1 rounded-md text-white',
              isActive('/student/tempSocketio')
                ? 'bg-white cursor-default text-primary'
                : 'transition-colors hover:bg-white/10 hover:text-white group-hover:shadow-sm cursor-pointer',
            )}
          onClick={(e) => {
            router.push('/student/tempSocketio')
            if (isActive('/student/tempSocketio')) {
                e.preventDefault()
            }
          }}
        >
            <Mail className="w-6 h-6 mx-auto" />
            Messagerie
        </button>

        <button
            className={cn(
              'flex flex-col items-center px-2 py-1 rounded-md text-white',
              isActive('/student/profile')
                ? 'bg-white cursor-default text-primary'
                : 'transition-colors hover:bg-white/10 hover:text-white group-hover:shadow-sm cursor-pointer',
            )}
          onClick={(e) => {
            router.push('/student/profile')
            if (isActive('/student/profile')) {
                e.preventDefault()
            }
          }}
        >
            <User className="w-6 h-6 mx-auto" />
            Profil
        </button>

        <button title="Déconnexion" className='flex flex-col items-center px-2 py-1 rounded-md text-white transition-colors hover:bg-white/10 hover:text-white group-hover:shadow-sm cursor-pointer'
            onClick={logoutHandler}><LogOut className="w-6 h-6 mx-auto" />Déconnexion</button>
      </div>
    </aside>
  )
}