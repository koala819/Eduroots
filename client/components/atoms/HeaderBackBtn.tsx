'use client'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import { ROUTE_PATTERNS } from '@/server/utils/patternsHeader'

export const HeaderBackBtn = () => {
  const pathname = usePathname()
  const router = useRouter()

  // Fonction simple pour trouver le pattern correspondant (même logique que HeaderInformation)
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
    // Fallback par défaut
    return (
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/teacher/classroom')}
        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10
          hover:bg-primary-foreground/15 transition-all duration-200 border
          border-primary-foreground/20 flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4 text-primary-foreground
          group-hover:text-primary-foreground transition-colors" />
        <span className="text-sm font-medium text-primary-foreground/90
          group-hover:text-primary-foreground">
          Retour
        </span>
      </motion.button>
    )
  }

  // Supprimer le dernier segment de l'URL
  const pathSegments = pathname.split('/').filter(Boolean)

  // Cas spéciaux pour les pages d'attendance et behavior
  let backUrl: string

  // Si on est sur une page d'édition ou création d'attendance/behavior
  if (pathSegments.includes('edit') || pathSegments.includes('create')) {
    // Retourner vers la page d'attendance/behavior du cours
    const courseIdIndex = pathSegments.findIndex((segment) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment),
    )
    if (courseIdIndex !== -1) {
      const courseId = pathSegments[courseIdIndex]
      const type = pathSegments.includes('attendance') ? 'attendance' : 'behavior'
      backUrl = `/teacher/classroom/course/${courseId}/${type}`
    } else {
      backUrl = '/' + pathSegments.slice(0, -1).join('/')
    }
  } else if (pathSegments.includes('attendance') || pathSegments.includes('behavior')) {
    // Si on est sur une page d'attendance ou behavior principale, retourner vers /teacher/classroom
    backUrl = '/teacher/classroom'
  } else {
    // Sinon, supprimer le dernier segment
    backUrl = '/' + pathSegments.slice(0, -1).join('/')
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push(backUrl)}
      className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10
        hover:bg-primary-foreground/15 transition-all duration-200 border
        border-primary-foreground/20 flex-shrink-0"
    >
      <ArrowLeft className="w-4 h-4 text-primary-foreground
        group-hover:text-primary-foreground transition-colors" />
      <span className="text-sm font-medium text-primary-foreground/90
        group-hover:text-primary-foreground">
        {pattern.backButton.name}
      </span>
    </motion.button>
  )
}
