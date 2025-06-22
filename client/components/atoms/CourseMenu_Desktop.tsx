'use client'
import { motion } from 'framer-motion'

import { HeaderBackBtn } from '@/client/components/atoms/HeaderBackBtn'
import { HeaderClassroom } from '@/client/components/atoms/HeaderClassroom'
import HeaderInformation from '@/client/components/atoms/HeaderInformation'
import { HeaderProfil } from '@/client/components/atoms/HeaderProfil'
import { ClassroomTimeSlot, CourseSessionWithRelations } from '@/types/courses'

export const CourseMenuDesktop = ({
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


  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full bg-gradient-to-br from-primary via-primary to-primary-dark
       text-primary-foreground relative"
    >
      <div className="px-8 py-6">
        {/* Header avec breadcrumb et informations - Split 60/40 */}
        <div className="flex items-center gap-8 mb-6">
          {/* Partie gauche - Navigation et infos (60%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-6 flex-[0.6]"
          >
            {/* Bouton retour */}
            <HeaderBackBtn
              returnBackName={returnBackName}
              returnBackUrl={returnBackUrl}
            />

            {/* Informations du cours avec design moderne */}
            <HeaderInformation
              selectedSession={selectedSession}
              classroomTimeSlots={classroomTimeSlots}
            />
          </motion.div>

          {/* Partie droite - Navigation des vues ou Créneaux horaires (40%) */}
          {showTabs ? (
            <HeaderClassroom
              courseSessionId={courseSessionId}
            />
          ) : isClassroomRoute && classroomTimeSlots.length > 0 ? (
            <HeaderProfil
              classroomTimeSlots={classroomTimeSlots}
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
