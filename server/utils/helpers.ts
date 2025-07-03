// import { ButtonVariant, ThemeConfig } from '@/zUnused/mongo/models'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { createClient } from '@/client/utils/supabase'
import { ROUTE_PATTERNS } from '@/server/utils/patternsHeader'
import { CourseWithRelations,SubjectNameEnum, TimeSlotEnum } from '@/types/courses'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fonction simple pour trouver le pattern correspondant
export const findPattern = (path: string) => {
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

export function formatName(firstname: string, lastname: string) {
  return {
    firstName: firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase(),
    lastName: lastname.toUpperCase(),
  }
}

export function formatAdminConfigTitle(title: string) {
  const prefixes = ['teacher', 'student', 'bureau']
  for (const prefix of prefixes) {
    if (title.toLowerCase().startsWith(prefix)) {
      return title.slice(prefix.length)
    }
  }
  return title
}

// export function generateDefaultTheme(role: 'teacher' | 'student' | 'bureau'): ThemeConfig {
//   const buttonVariants = {} as Record<ButtonVariant, string>
//   ;(['Cancel', 'Default', 'Secondary', 'Tertiary', 'Warning'] as const).forEach((variant) => {
//     buttonVariants[`${role}${variant}` as ButtonVariant] = ''
//   })

//   return {
//     buttonVariants,
//     cardHeader: '',
//     loader: '', // Un loader par défaut générique
//   }
// }

export function getColorClass(absences: number): string {
  if (absences === 0) {
    return 'bg-effet-metal-or from-or-clair via-or to-or-fonce text-amber-900'
  } // 0 absences
  switch (absences % 3) {
  case 1:
    return 'bg-effet-metal-argent from-argent-clair via-argentto-argent-fonce ' +
        'text-slate-900' // 1, 4, 7... absences
  case 2:
    return 'bg-effet-metal-bronze from-bronze-clair via-bronze to-bronze-fonce ' +
        'text-orange-50' // 2, 5, 8... absences
  case 0:
    return 'bg-effet-inferno from-inferno-light via-inferno to-inferno-dark ' +
        'text-black' // 3, 6, 9... absences
  default:
    return 'bg-gray-500 text-white' // Should never happen, but for safety
  }
}

export function getSubjectColors(subject: string): string {
  switch (subject) {
  case SubjectNameEnum.Arabe:
    return 'bg-primary-accent text-primary-foreground'
  case SubjectNameEnum.EducationCulturelle:
    return 'bg-accent text-accent-foreground'
  default:
    return 'bg-muted text-muted-foreground'
  }
}

export async function logoutHandler() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/'
}

// Fonction pour trier les sessions par jour de la semaine
export function sortSessionsByDayOfWeek(sessions: CourseWithRelations['courses_sessions']) {
  const dayOrder = {
    [TimeSlotEnum.SATURDAY_MORNING]: 1,
    [TimeSlotEnum.SATURDAY_AFTERNOON]: 2,
    [TimeSlotEnum.SUNDAY_MORNING]: 3,
  }

  return [...sessions].sort((a, b) => {
    const dayA = a.courses_sessions_timeslot[0]?.day_of_week
    const dayB = b.courses_sessions_timeslot[0]?.day_of_week
    const startTimeA = a.courses_sessions_timeslot[0]?.start_time
    const startTimeB = b.courses_sessions_timeslot[0]?.start_time

    // Si les jours sont différents, trier par jour
    if (dayA !== dayB) {
      if (!dayA || !dayB) return 0
      return dayOrder[dayA] - dayOrder[dayB]
    }

    // Si les jours sont identiques, trier par heure de début
    if (startTimeA && startTimeB) {
      return startTimeA.localeCompare(startTimeB)
    }

    return 0
  })
}
