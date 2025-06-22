'use client'

import { usePathname } from 'next/navigation'

import { ClassroomTimeSlot, CourseSessionWithRelations } from '@/types/courses'

import { HeaderMenuDesktop } from '../molecules/HeaderMenu_Desktop'
import { HeaderMenuMobile } from '../molecules/HeaderMenu_Mobile'

export function MenuHeader({
  classroomTimeSlots = [],
  selectedSession,
}: {
  classroomTimeSlots?: ClassroomTimeSlot[]
  selectedSession: CourseSessionWithRelations | undefined
}) {
  const pathname = usePathname()

  const isAttendanceRoute = pathname.includes('/attendance')
  const isBehaviorRoute = pathname.includes('/behavior')
  const isClassroomTeacherRoute = (isAttendanceRoute || isBehaviorRoute) &&
    !pathname.includes('/create') &&
    !pathname.includes('/edit')

  const isSettingsRoute = pathname.includes('/settings/classroom')

  return (
    <>
      {/* Vue desktop */}
      <div className="hidden sm:flex">
        <HeaderMenuDesktop
          courseSessionId={selectedSession?.id}
          selectedSession={selectedSession}
          classroomTimeSlots={classroomTimeSlots}
          isClassroomTeacherRoute={isClassroomTeacherRoute}
          isSettingsRoute={isSettingsRoute}
        />
      </div>

      {/* Vue mobile */}
      <div className="sm:hidden">
        <HeaderMenuMobile
          courseSessionId={selectedSession?.id}
          selectedSession={selectedSession}
          classroomTimeSlots={classroomTimeSlots}
          isClassroomTeacherRoute={isClassroomTeacherRoute}
          isSettingsRoute={isSettingsRoute}
        />
      </div>
    </>
  )
}
