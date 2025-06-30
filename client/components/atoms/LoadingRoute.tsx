'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import LoadingScreen from './LoadingScreen'

export default function LoadingRoute() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [currentPath, setCurrentPath] = useState(pathname)

  useEffect(() => {
    // Si le pathname a changé, on arrête le loading
    if (pathname !== currentPath) {
      setCurrentPath(pathname)
      setLoading(false)
    }
  }, [pathname, currentPath])

  useEffect(() => {
    let timeoutId: number | null = null

    const handleStart = () => {
      setLoading(true)
      // Nettoyer le timeout précédent s'il existe
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      // Créer un nouveau timeout pour arrêter le loading après 5 secondes
      timeoutId = window.setTimeout(() => {
        setLoading(false)
        timeoutId = null
      }, 5000)
    }

    // Intercepter les méthodes de navigation du router
    const originalPush = router.push
    const originalReplace = router.replace

    router.push = (...args) => {
      handleStart()
      return originalPush.apply(router, args as any)
    }

    router.replace = (...args) => {
      handleStart()
      return originalReplace.apply(router, args as any)
    }

    // Écouter les événements de navigation du navigateur
    const handlePopState = () => {
      handleStart()
    }

    window.addEventListener('popstate', handlePopState)

    // Nettoyer
    return () => {
      router.push = originalPush
      router.replace = originalReplace
      window.removeEventListener('popstate', handlePopState)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [router])

  return loading ? <LoadingScreen /> : null
}
