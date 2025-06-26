'use client'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ROUTE_PATTERNS } from '@/server/utils/patternsHeader'

export const HeaderBackBtn = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('student')

  const pathTeacher = pathname === '/teacher'
  const pathFamily = pathname === '/family'
  const pathAdmin = pathname === '/admin'

  // Ne pas afficher le bouton retour
  const hiddenBtn = (pathFamily && !studentId) || pathAdmin
  if (hiddenBtn) {
    return null
  }

  // Trouver le pattern correspondant
  const findPattern = (path: string) => {
    // Chercher d'abord une correspondance exacte
    if (ROUTE_PATTERNS[path]) {
      return ROUTE_PATTERNS[path]
    }

    // Chercher une correspondance par pattern générique
    for (const [pattern, routePattern] of Object.entries(ROUTE_PATTERNS)) {
      const genericPattern = pattern.replace(/\[.*?\]/g, '*')
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

    // Déterminer l'URL de retour de manière sécurisée
    const getFallbackUrl = () => {
      if (pathFamily) return '/family'
      if (pathTeacher) return '/teacher'
      if (pathAdmin) return '/admin'
      return '/'
    }

    return (
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push(getFallbackUrl())}
        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10
          hover:bg-primary-foreground/15 transition-all duration-200 border
          border-primary-foreground/20 flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4 text-primary-foreground
          group-hover:text-primary-foreground transition-colors" />
        <span className="text-sm font-medium text-primary-foreground/90
          group-hover:text-primary-foreground">
          {pathFamily ? 'Accueil' : 'Retour'}
        </span>
      </motion.button>
    )
  }

  // Fonction pour déterminer l'URL de retour
  const getBackUrl = () => {
    const segments = pathname.split('/').filter(Boolean)

    // CAS spécial: Routes familiales
    if (segments[0] === 'family') {
      return '/family'
    }

    // CAS spécial: Pages de grades
    if (
      segments.includes('grades') &&
      (segments.includes('edit') || segments.includes('create'))
    ) {
      return '/teacher/settings/grades'
    }

    // CAS avec pages d'attendance et behavior
    if (segments.includes('attendance') || segments.includes('behavior')) {
      if (segments.includes('edit') || segments.includes('create')) {
        const courseId = segments.find((segment) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment),
        )
        if (courseId) {
          const type = segments.includes('attendance') ? 'attendance' : 'behavior'
          return `/teacher/classroom/course/${courseId}/${type}`
        }
      }
      return '/teacher/classroom'
    }

    // CAS 3: Pages de cours
    if (segments.includes('course')) {
      return '/teacher/classroom'
    }

    // CAS 4: Pages de settings
    if (segments.includes('settings')) {
      return '/teacher/settings'
    }

    // CAS 5: Par défaut, supprimer le dernier segment
    return '/' + segments.slice(0, -1).join('/')
  }

  const backUrl = getBackUrl()

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
