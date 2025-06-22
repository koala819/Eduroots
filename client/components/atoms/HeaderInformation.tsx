'use client'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { formatDayOfWeek } from '@/server/utils/helpers'
import { ClassroomTimeSlot, CourseSessionWithRelations } from '@/types/courses'

interface HeaderInformationProps {
  selectedSession?: CourseSessionWithRelations
  classroomTimeSlots?: ClassroomTimeSlot[]
}

type HeaderPattern = {
  title:
    | string
    | ((params: {
        selectedSession?: CourseSessionWithRelations
        classroomTimeSlots?: ClassroomTimeSlot[]
      }) => string)
  subtitle:
    | string
    | ((params: {
        selectedSession?: CourseSessionWithRelations
        classroomTimeSlots?: ClassroomTimeSlot[]
      }) => string)
}

const HEADER_PATTERNS: Record<string, HeaderPattern> = {
  '/teacher/settings/classroom': {
    title: 'Mes Cours',
    subtitle: ({ classroomTimeSlots }) =>
      classroomTimeSlots && classroomTimeSlots.length > 0
        ? `${classroomTimeSlots.length} créneaux disponibles`
        : 'Chargement...',
  },
  '/teacher/settings': {
    title: 'Paramètres',
    subtitle: 'Changer vos paramètres',
  },
  '/teacher/classroom/course': {
    title: ({ selectedSession }) =>
      selectedSession?.subject || 'Cours',
    subtitle: ({ selectedSession }) =>
      selectedSession
        ? formatDayOfWeek(
          selectedSession.courses_sessions_timeslot[0].day_of_week,
        )
        : 'Chargement...',
  },
  '/teacher/classroom/course/attendance': {
    title: 'Présence',
    subtitle: 'Gestion des présences',
  },
  '/teacher/classroom/course/behavior': {
    title: 'Comportement',
    subtitle: 'Gestion du comportement',
  },
  '/teacher/settings/grades': {
    title: 'Notes',
    subtitle: 'Gestion des notes',
  },
  '/admin': {
    title: 'Administration',
    subtitle: 'Gestion du système',
  },
  '/teacher/classroom': {
    title: 'Tableau de bord',
    subtitle: 'Vue d\'ensemble',
  },
}

const HeaderInformation = ({
  selectedSession,
  classroomTimeSlots = [],
}: HeaderInformationProps) => {
  const pathname = usePathname()
  const pattern = HEADER_PATTERNS[pathname]

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
