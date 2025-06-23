'use client'

import { usePathname } from 'next/navigation'

import { HeaderMenuDesktop } from '@/client/components/molecules/HeaderMenu_Desktop'
import { HeaderMenuMobile } from '@/client/components/molecules/HeaderMenu_Mobile'
import { ClassroomTimeSlot, CourseSessionWithRelations, CourseWithRelations } from '@/types/courses'

export function MenuHeader({
  classroomTimeSlots = [],
  selectedSession,
  courses = [],
}: {
  classroomTimeSlots?: ClassroomTimeSlot[]
  selectedSession: CourseSessionWithRelations | undefined
  courses: CourseWithRelations[]
}) {
  const pathname = usePathname()

  const isAttendanceRoute = pathname.includes('/attendance')
  const isBehaviorRoute = pathname.includes('/behavior')
  const isClassroomTeacherRoute = (isAttendanceRoute || isBehaviorRoute) &&
    !pathname.includes('/create') &&
    !pathname.includes('/edit')

  const isSettingsRoute = pathname.includes('/settings/classroom')
  const isPlanningRoute = pathname.includes('/settings/edit')

  return (
    <>
      {/* Vue desktop */}
      <div className="hidden sm:flex">
        <HeaderMenuDesktop
          courseSessionId={selectedSession?.id}
          selectedSession={selectedSession}
          classroomTimeSlots={classroomTimeSlots}
          courses={courses}
          isClassroomTeacherRoute={isClassroomTeacherRoute}
          isSettingsRoute={isSettingsRoute}
          isPlanningRoute={isPlanningRoute}
        />
      </div>

      {/* Vue mobile */}
      <div className="sm:hidden">
        <HeaderMenuMobile
          courseSessionId={selectedSession?.id}
          selectedSession={selectedSession}
          classroomTimeSlots={classroomTimeSlots}
          courses={courses}
          isClassroomTeacherRoute={isClassroomTeacherRoute}
          isSettingsRoute={isSettingsRoute}
          isPlanningRoute={isPlanningRoute}
        />
      </div>
    </>
  )
}
