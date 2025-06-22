import { MenuHeader } from '@/client/components/organisms/HeaderMenu'
import { getStudentsByTeacher } from '@/server/actions/api/teachers'
import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'
import {
  ClassroomTimeSlot,
  CourseSessionWithRelations,
  TimeEnum,
  TimeSlotEnum,
} from '@/types/courses'


interface CourseLayoutProps {
  children: React.ReactNode
}

export default async function CourseLayout({ children }: CourseLayoutProps) {
  let classroomTimeSlots: ClassroomTimeSlot[] = []
  let selectedSession: CourseSessionWithRelations | undefined

  try {
    const user = await getAuthenticatedUser()
    const educationUserId = await getEducationUserId(user.id)

    if (educationUserId) {
      const studentsResponse = await getStudentsByTeacher(educationUserId)

      if (studentsResponse.success && studentsResponse.data) {
        const extractedTimeSlots = studentsResponse.data.courses.flatMap((course) =>
          course.sessions.map((session) => ({
            id: session.sessionId,
            subject: session.subject,
            dayOfWeek: session.timeSlot,
            level: session.level,
            courseId: course.courseId,
            startTime: session.startTime,
            endTime: session.endTime,
          })),
        )

        const sortTimeSlots = (
          a: typeof extractedTimeSlots[0],
          b: typeof extractedTimeSlots[0],
        ) => {
          const dayOrder = {
            [TimeSlotEnum.SATURDAY_MORNING]: 1,
            [TimeSlotEnum.SATURDAY_AFTERNOON]: 2,
            [TimeSlotEnum.SUNDAY_MORNING]: 3,
          }

          const timeOrder = {
            [TimeEnum.MorningStart]: 1,
            [TimeEnum.MorningPause]: 2,
            [TimeEnum.MorningEnd]: 3,
            [TimeEnum.AfternoonStart]: 4,
            [TimeEnum.AfternoonPause]: 5,
            [TimeEnum.AfternoonEnd]: 6,
          }

          const dayA = dayOrder[a.dayOfWeek as TimeSlotEnum] || 999
          const dayB = dayOrder[b.dayOfWeek as TimeSlotEnum] || 999

          if (dayA !== dayB) {
            return dayA - dayB
          }

          const startTimeA = timeOrder[a.startTime as TimeEnum] || 999
          const startTimeB = timeOrder[b.startTime as TimeEnum] || 999

          return startTimeA - startTimeB
        }

        classroomTimeSlots = [...extractedTimeSlots].sort(sortTimeSlots)

        classroomTimeSlots = classroomTimeSlots.map((slot) => ({
          ...slot,
          startTime: slot.startTime ? slot.startTime.substring(0, 5) : undefined,
          endTime: slot.endTime ? slot.endTime.substring(0, 5) : undefined,
        }))
      }
    }
  } catch (error) {
    console.error('[COURSE_LAYOUT] Error loading classroom data:', error)
  }

  return (
    <div className="flex flex-col h-full bg-muted">
      <header className="sticky top-0 z-30">
        <MenuHeader
          classroomTimeSlots={classroomTimeSlots}
          selectedSession={selectedSession}
        />
      </header>

      <div className="flex-1 p-4 overflow-auto pb-20 sm:pb-4 mt-28 sm:mt-20">
        <div className="max-w-[1200px] mx-auto bg-background rounded-lg shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
