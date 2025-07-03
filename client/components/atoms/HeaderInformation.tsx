'use client'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { ROUTE_PATTERNS } from '@/server/utils/patternsHeader'
import { ClassroomTimeSlot, CourseSessionWithRelations } from '@/types/courses'

interface HeaderInformationProps {
  selectedSession?: CourseSessionWithRelations
  classroomTimeSlots?: ClassroomTimeSlot[]
}

const HeaderInformation = ({
  selectedSession,
  classroomTimeSlots = [],
}: HeaderInformationProps) => {
  const pathname = usePathname()

  // Fonction simple pour trouver le pattern correspondant
  const findPattern = (path: string) => {
    // Chercher d'abord une correspondance exacte
    if (ROUTE_PATTERNS[path]) {
      return ROUTE_PATTERNS[path]
    }

    // Chercher une correspondance par pattern générique
    for (const [pattern, routePattern] of Object.entries(ROUTE_PATTERNS)) {
      // Convertir [id] en pattern générique
      const genericPattern = pattern.replace(/\[.*?\]/g, '*')

      // Créer un pattern de test en remplaçant les segments dynamiques
      const testPattern = path.split('/').map((segment, index) => {
        const patternSegments = genericPattern.split('/')
        return patternSegments[index] === '*' ? '*' : segment
      }).join('/')

      if (testPattern === genericPattern) {
        return routePattern
      }
    }

    return null
  }

  const pattern = findPattern(pathname)

  if (!pattern) {
    console.warn(`Route pattern non trouvé pour: ${pathname}`)
  }

  let title = ''
  let subtitle = ''
  if (pattern) {
    title = typeof pattern.title === 'function'
      ? pattern.title({ selectedSession, classroomTimeSlots })
      : pattern.title
    subtitle = typeof pattern.subtitle === 'function'
      ? pattern.subtitle({ selectedSession, classroomTimeSlots })
      : pattern.subtitle
  }

  return (
    <div className="flex items-center gap-4 min-w-0">
      <div className="w-px h-8 bg-primary-foreground/20 flex-shrink-0" />
      <div className="min-w-0">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-primary-foreground truncate"
        >
          {title}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 text-primary-foreground/70 text-sm mt-1"
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {subtitle}
          </span>
        </motion.div>
      </div>
    </div>
  )
}

export default HeaderInformation
