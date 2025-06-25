'use client'

import { usePathname } from 'next/navigation'

import { HeaderMenuDesktop } from '@/client/components/molecules/HeaderMenu_Desktop'
import { HeaderMenuMobile } from '@/client/components/molecules/HeaderMenu_Mobile'
import { ClassroomTimeSlot, CourseSessionWithRelations, CourseWithRelations } from '@/types/courses'
import { User } from '@/types/db'
import { GradeWithRelations } from '@/types/grades'
import { UserRoleEnum } from '@/types/user'

export function MenuHeader({
  classroomTimeSlots = [],
  selectedSession,
  courses = [],
  grades = [],
  familyStudents = [],
}: {
  classroomTimeSlots?: ClassroomTimeSlot[]
  selectedSession: CourseSessionWithRelations | undefined
  courses: CourseWithRelations[]
  grades: GradeWithRelations[]
  familyStudents?: Array<User & { role: UserRoleEnum.Student }>
}) {
  const pathname = usePathname()

  const isAttendanceRoute = pathname.includes('/attendance')
  const isBehaviorRoute = pathname.includes('/behavior')
  const isClassroomTeacherRoute = (isAttendanceRoute || isBehaviorRoute) &&
    !pathname.includes('/create') &&
    !pathname.includes('/edit')

  const isSettingsRoute = pathname.includes('/settings/classroom')
  const isPlanningRoute = pathname.includes('/settings/planning')
  const isGradesRoute = pathname.endsWith('/settings/grades')

  const isFamilyRoute = pathname.includes('/family')

  return (
    <>
      {/* Vue desktop */}
      <div className="hidden sm:flex">
        <HeaderMenuDesktop
          courseSessionId={selectedSession?.id}
          selectedSession={selectedSession}
          classroomTimeSlots={classroomTimeSlots}
          courses={courses}
          grades={grades}
          familyStudents={familyStudents}
          isClassroomTeacherRoute={isClassroomTeacherRoute}
          isSettingsRoute={isSettingsRoute}
          isPlanningRoute={isPlanningRoute}
          isGradesRoute={isGradesRoute}
          isFamilyRoute={isFamilyRoute}
        />
      </div>

      {/* Vue mobile */}
      <div className="sm:hidden">
        <HeaderMenuMobile
          courseSessionId={selectedSession?.id}
          selectedSession={selectedSession}
          classroomTimeSlots={classroomTimeSlots}
          courses={courses}
          grades={grades}
          familyStudents={familyStudents}
          isClassroomTeacherRoute={isClassroomTeacherRoute}
          isSettingsRoute={isSettingsRoute}
          isPlanningRoute={isPlanningRoute}
          isGradesRoute={isGradesRoute}
          isFamilyRoute={isFamilyRoute}
        />
      </div>
    </>
  )
}
