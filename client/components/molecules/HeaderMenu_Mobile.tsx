'use client'
import { motion } from 'framer-motion'

import { HeaderBackBtn } from '@/client/components/atoms/HeaderBackBtn'
import { HeaderClassroom } from '@/client/components/atoms/HeaderClassroom'
import HeaderInformation from '@/client/components/atoms/HeaderInformation'
import { HeaderSettings } from '@/client/components/atoms/HeaderSettings'
import { ClassroomTimeSlot, CourseSessionWithRelations } from '@/types/courses'

export const HeaderMenuMobile = ({
  courseSessionId,
  selectedSession,
  classroomTimeSlots = [],
  isClassroomTeacherRoute = false,
  isSettingsRoute = false,
}: {
  courseSessionId?: string
  selectedSession?: CourseSessionWithRelations
  classroomTimeSlots?: ClassroomTimeSlot[]
  isClassroomTeacherRoute: boolean
  isSettingsRoute: boolean
}) => {

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
          <HeaderBackBtn />

          {/* Informations du cours - Utiliser HeaderInformation comme en desktop */}
          <div className="flex items-center justify-between gap-3 min-w-0 flex-1 mx-4">
            <HeaderInformation
              selectedSession={selectedSession}
              classroomTimeSlots={classroomTimeSlots}
            />
          </div>
        </section>

        {/* Sélecteur de créneaux horaires pour la route settings */}
        {isClassroomTeacherRoute && (
          <HeaderClassroom
            courseSessionId={courseSessionId}
            className="flex-[1] justify-center"
          />
        )}

        {/* Menu de navigation des vues pour les routes de cours */}
        {isSettingsRoute && (
          <HeaderSettings
            classroomTimeSlots={classroomTimeSlots}

          />
        )}
      </div>
    </motion.div>
  )
}
