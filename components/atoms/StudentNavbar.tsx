'use client'

import {Home, LogOut, Mail, User} from 'lucide-react'
import {signOut} from 'next-auth/react'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {cn} from '@/lib/utils'

export default function StudentNavbarMobile() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  function logoutHandler() {
    signOut({
      redirect: true,
      callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
    })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white shadow-md z-50">
      <div className="flex justify-around items-center h-16">
        <Link
          href="/student"
          className={cn(
            'flex flex-col items-center justify-center w-full cursor-default',
            isActive('/student') ? '' : 'group',
          )}
          onClick={(e) => isActive('/student') && e.preventDefault()}
        >
          <div
            className={cn(
              'flex flex-col items-center px-2 py-1 rounded-md',
              isActive('/student')
                ? 'text-white bg-primary'
                : 'transition-colors text-gray-500 hover:bg-blue-100 hover:text-blue-700 group-hover:shadow-sm cursor-pointer',
            )}
          >
            <Home size={24} />
            <span className="text-xs mt-1 font-medium">Scolarité</span>
          </div>
        </Link>

        <Link
          href="/student/messages"
          className={cn(
            'flex flex-col items-center justify-center w-full cursor-default',
            isActive('/student/messages') ? '' : 'group',
          )}
          onClick={(e) => isActive('/student/messages') && e.preventDefault()}
        >
          <div
            className={cn(
              'flex flex-col items-center px-2 py-1 rounded-md',
              isActive('/student/messages')
                ? 'text-white bg-primary cursor-default'
                : 'transition-colors text-gray-500 hover:bg-blue-100 hover:text-blue-700 group-hover:shadow-sm cursor-pointer',
            )}
          >
            <Mail size={24} />
            <span className="text-xs mt-1 font-medium">Messagerie</span>
          </div>
        </Link>

        <Link
          href="/student/profile"
          className={cn(
            'flex flex-col items-center justify-center w-full cursor-default',
            isActive('/student/profile') ? '' : 'group',
          )}
          onClick={(e) => isActive('/student/profile') && e.preventDefault()}
        >
          <div
            className={cn(
              'flex flex-col items-center px-2 py-1 rounded-md',
              isActive('/student/profile')
                ? 'text-white bg-primary cursor-default'
                : 'transition-colors text-gray-500 hover:bg-blue-100 hover:text-blue-700 group-hover:shadow-sm cursor-pointer',
            )}
          >
            <User size={24} />
            <span className="text-xs mt-1 font-medium">Profil</span>
          </div>
        </Link>

        <button
          className="flex flex-col items-center justify-center w-full cursor-default"
          onClick={logoutHandler}
        >
          <div className="flex flex-col items-center px-2 py-1 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors group-hover:shadow-sm cursor-pointer">
            <LogOut size={24} />
            <span className="text-xs mt-1 font-medium">Déconnexion</span>
          </div>
        </button>
      </div>
    </div>
  )
}
