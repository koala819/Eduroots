'use client'
import { motion } from 'framer-motion'

import { HeaderBackBtn } from '@/client/components/atoms/HeaderBackBtn'
import { HeaderClassroom } from '@/client/components/atoms/HeaderClassroom'
import { HeaderFamily } from '@/client/components/atoms/HeaderFamily'
import { HeaderGrades } from '@/client/components/atoms/HeaderGrades'
import HeaderInformation from '@/client/components/atoms/HeaderInformation'
import { HeaderPlanning } from '@/client/components/atoms/HeaderPlanning'
import { HeaderSettings } from '@/client/components/atoms/HeaderSettings'
import {
  ClassroomTimeSlot,
  CourseSessionWithRelations,
  CourseWithRelations,
} from '@/types/courses'
import { User } from '@/types/db'
import { GradeWithRelations } from '@/types/grades'
import { UserRoleEnum } from '@/types/user'

export const HeaderMenuMobile = ({
  courseSessionId,
  selectedSession,
  classroomTimeSlots = [],
  courses = [],
  grades = [],
  familyStudents = [],
  isClassroomTeacherRoute = false,
  isSettingsRoute = false,
  isPlanningRoute = false,
  isGradesRoute = false,
  isFamilyRoute = false,
  isAdmin = false,
}: {
  courseSessionId?: string
  selectedSession?: CourseSessionWithRelations
  classroomTimeSlots?: ClassroomTimeSlot[]
  courses?: CourseWithRelations[]
  grades: GradeWithRelations[]
  familyStudents?: Array<User & { role: UserRoleEnum.Student }>
  isClassroomTeacherRoute: boolean
  isSettingsRoute: boolean
  isPlanningRoute: boolean
  isGradesRoute: boolean
  isFamilyRoute: boolean
  isAdmin: boolean
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

        {isPlanningRoute && (
          <HeaderPlanning
            courses={courses}
          />
        )}

        {isGradesRoute && (
          <HeaderGrades
            grades={grades}
          />
        )}

        {isFamilyRoute && (
          <HeaderFamily
            familyStudents={familyStudents}
          />
        )}
      </div>
    </motion.div>
  )
}
