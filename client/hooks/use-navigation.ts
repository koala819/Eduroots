'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  // Réinitialiser isNavigating quand le pathname change
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  const handleNavClick = (href: string) => {
    setIsNavigating(true)
    router.push(href)
  }

  return {
    isNavigating,
    handleNavClick,
  }
}
