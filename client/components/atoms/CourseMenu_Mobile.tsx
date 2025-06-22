'use client'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { HeaderBackBtn } from '@/client/components/atoms/HeaderBackBtn'
import { HeaderClassroomMobile } from '@/client/components/atoms/HeaderClassroomMobile'
import { HeaderProfileMobile } from '@/client/components/atoms/HeaderProfileMobile'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { ClassroomTimeSlot, CourseSessionWithRelations } from '@/types/courses'

export const CourseMenuMobile = ({
  courseSessionId,
  selectedSession,
  returnBackName = 'Accueil',
  returnBackUrl = '/teacher/classroom',
  showTabs = true,
  isClassroomRoute = false,
  classroomTimeSlots = [],
}: {
  courseSessionId?: string
  selectedSession?: CourseSessionWithRelations
  returnBackName?: string
  returnBackUrl?: string
  showTabs?: boolean
  isClassroomRoute?: boolean
  classroomTimeSlots?: ClassroomTimeSlot[]
}) => {
  const pathname = usePathname()

  // Détecter la vue active basée sur le pathname
  const activeView = pathname.includes('/behavior') ? 'behavior' : 'attendance'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full bg-gradient-to-br from-primary via-primary to-primary-dark
       text-primary-foreground"
    >
      <div className="px-4 py-4">
        {/* Header avec navigation et informations */}
        <section className="flex items-center justify-between mb-4">
          {/* Bouton retour */}
          <HeaderBackBtn
            returnBackName={returnBackName}
            returnBackUrl={returnBackUrl}
            className="px-3 py-2 rounded-lg"
          />

          {/* Informations du cours */}
          <div className="flex items-center justify-between gap-3 min-w-0 flex-1 mx-4">
            {selectedSession ? (
              <>
                <h1 className="text-lg font-bold text-primary-foreground truncate">
                  {selectedSession.subject}
                </h1>
                <div className="flex items-center gap-2 text-primary-foreground/70 text-xs mt-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {formatDayOfWeek(selectedSession.courses_sessions_timeslot[0].day_of_week)}
                  </span>
                </div>
              </>
            ) : isClassroomRoute ? (
              <>
                <h1 className="text-lg font-bold text-primary-foreground truncate">
                  Mes Cours
                </h1>
                <div className="flex items-center gap-2 text-primary-foreground/70 text-xs mt-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {classroomTimeSlots.length > 0
                      ? `${classroomTimeSlots.length} créneaux`
                      : 'Chargement...'}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </section>

        {/* Sélecteur de créneaux horaires pour la route classroom */}
        {isClassroomRoute && classroomTimeSlots.length > 0 && (
          <HeaderClassroomMobile
            classroomTimeSlots={classroomTimeSlots}
          />
        )}

        {/* Menu de navigation des vues
        - seulement affiché si on a un courseSessionId ET showTabs est true */}
        {courseSessionId && showTabs && (
          <HeaderProfileMobile
            courseSessionId={courseSessionId}
            activeView={activeView}
          />
        )}
      </div>
    </motion.div>
  )
}
