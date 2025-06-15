'use client'

import { Clipboard, Home, MailOpen, Menu, Power, Settings } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import { AnimatePresence, motion } from 'framer-motion'

export function Navbar() {
  const { data: session, status } = useSession()
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  function logoutHandler() {
    signOut({
      redirect: true,
      callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
    })
  }

  function closeSheet() {
    setIsSheetOpen(false)
  }

  const navItems = [
    { icon: Home, label: 'Accueil', href: `/${session?.user.role}` },
    { icon: MailOpen, label: 'Messagerie', href: '/messages' },
    ...(session?.user.role === 'teacher'
      ? [{ icon: Clipboard, label: 'Evaluations', href: '/teacher/grades' }]
      : []),
  ]

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 bg-white z-50 transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={`${process.env.NEXT_PUBLIC_CLIENT_URL}/${session?.user.role}`}
              className="flex items-center"
            >
              <div className="relative w-12 h-12 mr-3">
                <Image
                  src="/mosquee-colomiers.jpg"
                  alt="Mosquée de Colomiers"
                  fill
                  className="rounded-full"
                  sizes="8vw"
                />
              </div>

              <div className="flex flex-col">
                <p className="font-bold">
                  <span>{session?.user.firstname}</span> <span>{session?.user.lastname}</span>
                </p>
                <span className="text-sm">
                  {session?.user.role === 'teacher' ? 'Professeur' : 'Élève'}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {session?.user.email}
                </span>
              </div>
            </Link>
          </motion.div>

          {/* MOBILE VIEW */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="outline">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-4 p-4">
                <AnimatePresence>
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                        href={item.href}
                        onClick={closeSheet}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ delay: navItems.length * 0.1 }}
                  >
                    <a
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200"
                      onClick={logoutHandler}
                    >
                      <Power className="h-5 w-5" />
                      <span>Déconnexion</span>
                    </a>
                  </motion.div>
                </AnimatePresence>
              </nav>
            </SheetContent>
          </Sheet>

          {/* DESKTOP VIEW */}
          <nav className="hidden gap-4 text-sm font-medium md:flex items-center">
            {navItems.map((item, index) => (
              <motion.div
                key={item.label}
                className="relative group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link
                  className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100 transition-colors duration-200"
                  href={item.href}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
                <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-sm text-white bg-black rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {item.label}
                </span>
              </motion.div>
            ))}
            {session?.user.role === 'teacher' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuSeparator />
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.label} className="cursor-pointer">
                      <Link
                        className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100 w-full transition-colors duration-200"
                        href={item.href}
                        prefetch={false}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem>
                    <a
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer transition-colors duration-200"
                      onClick={logoutHandler}
                    >
                      <Power className="h-5 w-5" />
                      <span>Déconnexion</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {session?.user.role === 'student' && (
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <a onClick={logoutHandler} className="cursor-pointer">
                  <Power className="h-5 w-5" color="red" />
                  <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-sm text-white bg-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Déconnexion
                  </span>
                </a>
              </motion.div>
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  )
}
