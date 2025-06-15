'use client'

import { CourseSession } from '@/types/mongo/course'

import { TeacherCard } from '@/components/admin/atoms/client/PlanningTeacherCard'

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
  sessions: CourseSession[]
  onSessionClick: (session: CourseSession) => void
}) => {
  const sortedSessions = [...sessions].sort((a, b) => {
    const firstnameA = a.user?.firstname || ''
    const firstnameB = b.user?.firstname || ''
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
