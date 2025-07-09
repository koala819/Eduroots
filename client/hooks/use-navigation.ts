'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function useNavigation() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleNavClick = (href: string) => {
    setIsNavigating(true)
    router.push(href)
  }

  return {
    isNavigating,
    handleNavClick,
  }
}
