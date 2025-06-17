'use client'

import { TeacherCard } from '@/client/components/admin/atoms/PlanningTeacherCard'
import { CourseSessionWithRelations } from '@/types/courses'

type FixedTimeSlot = {
  startTime: string
  endTime: string
  display: string
}

export const TimeSlotColumn = ({
  timeSlot,
  sessions,
  onSessionClick,
}: {
  timeSlot: FixedTimeSlot
  sessions: CourseSessionWithRelations[]
  onSessionClick: (session: CourseSessionWithRelations) => void
}) => {
  const sortedSessions = [...sessions].sort((a, b) => {
    const firstnameA = a.courses_sessions_students[0]?.users?.firstname ?? ''
    const firstnameB = b.courses_sessions_students[0]?.users?.firstname ?? ''
    return firstnameA.localeCompare(firstnameB)
  })

  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-600 text-center font-medium">{timeSlot.display}</div>
      <div className="space-y-1">
        {sortedSessions.map((session, idx) => (
          <TeacherCard key={idx} session={session} onClick={() => onSessionClick(session)} />
        ))}
      </div>
    </div>
  )
}
