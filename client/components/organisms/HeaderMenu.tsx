'use client'

import { usePathname } from 'next/navigation'

import {
  ClassroomTimeSlot,
  CourseSessionWithRelations,
  CourseWithRelations,
  TimeSlotEnum,
} from '@/types/courses'

import { HeaderMenuDesktop } from '../molecules/HeaderMenu_Desktop'

export function MenuHeader({
  classroomTimeSlots = [],
  selectedSession,
  courses = [],
  selectedTimeSlot = null,
  onTimeSlotChange,
  currentDayIndex = 0,
  onPrevDay,
  onNextDay,
}: {
  classroomTimeSlots?: ClassroomTimeSlot[]
  selectedSession: CourseSessionWithRelations | undefined
  courses?: CourseWithRelations[]
  selectedTimeSlot?: TimeSlotEnum | null
  onTimeSlotChange?: (timeSlot: TimeSlotEnum) => void
  currentDayIndex?: number
  onPrevDay?: () => void
  onNextDay?: () => void
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
          selectedTimeSlot={selectedTimeSlot}
          onTimeSlotChange={onTimeSlotChange}
          currentDayIndex={currentDayIndex}
          onPrevDay={onPrevDay}
          onNextDay={onNextDay}
          isClassroomTeacherRoute={isClassroomTeacherRoute}
          isSettingsRoute={isSettingsRoute}
          isPlanningRoute={isPlanningRoute}
        />
      </div>

      {/* Vue mobile */}
      <div className="sm:hidden">
        Menu mobile
        {/* <HeaderMenuMobile
          courseSessionId={selectedSession?.id}
          selectedSession={selectedSession}
          classroomTimeSlots={classroomTimeSlots}
          courses={courses}
          selectedTimeSlot={selectedTimeSlot}
          onTimeSlotChange={onTimeSlotChange}
          currentDayIndex={currentDayIndex}
          onPrevDay={onPrevDay}
          onNextDay={onNextDay}
          isClassroomTeacherRoute={isClassroomTeacherRoute}
          isSettingsRoute={isSettingsRoute}
          isPlanningRoute={isPlanningRoute}
        /> */}
      </div>
    </>
  )
}
