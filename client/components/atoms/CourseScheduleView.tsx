import { Clock, Users } from 'lucide-react'
import React from 'react'

import { formatDayOfWeek, getSubjectColors } from '@/server/utils/helpers'
import { CourseWithRelations, TimeSlotEnum } from '@/types/courses'

type CourseScheduleViewProps = {
  timeSlot: TimeSlotEnum
  courses: CourseWithRelations[]
}

export const CourseScheduleView = ({ timeSlot, courses }: CourseScheduleViewProps) => {
  const getSessionsForSlot = (timeSlot: TimeSlotEnum) => {
    return courses.flatMap((course) =>
      course.courses_sessions.filter((session) => {
        const timeslot = session.courses_sessions_timeslot[0]
        return timeslot?.day_of_week === timeSlot
      }),
    )
  }



  const sessionsForDay = getSessionsForSlot(timeSlot)
  // Trier les cours par ordre chronologique
  const sortedSessions = sessionsForDay.sort((a, b) => {
    const timeA = a.courses_sessions_timeslot[0]?.start_time || ''
    const timeB = b.courses_sessions_timeslot[0]?.start_time || ''
    return timeA.localeCompare(timeB)
  })

  const hasClasses = sortedSessions.length > 0

  return (
    <div className="card shadow-sm border-t-0 border-r-0 border-b-0
    overflow-hidden rounded-lg animate-fadeIn">
      <div className="pb-2 px-4 pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">
            {formatDayOfWeek(timeSlot)}
          </h3>
        </div>
      </div>
      <div className="space-y-4 pt-2 px-4 pb-4">
        {hasClasses ? (
          <div className="space-y-3">
            {sortedSessions.map((session, sessionIdx) => (
              <React.Fragment key={`session-${sessionIdx}`}>
                <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted
                transition-colors duration-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between
                   sm:items-center mb-3">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <div
                        className={`h-7 px-3 rounded-full flex items-center justify-center mr-2 ${
                          getSubjectColors(session.subject)
                        }`}
                      >
                        <span className="text-xs font-medium">{session.subject}</span>
                      </div>
                      <div className="h-7 px-3 rounded-full bg-primary/10 flex items-center
                      justify-center">
                        <span className="text-primary text-xs font-medium">
                          Niveau {session.level}
                        </span>
                      </div>
                    </div>
                    <div className="h-7 px-3 rounded-full bg-primary/10 flex items-center
                    justify-center border border-primary/20">
                      <span className="text-primary text-xs font-medium">
                        Salle{' '}
                        {session.courses_sessions_timeslot[0]?.classroom_number ||
                          'Non définie'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {session.courses_sessions_timeslot[0]?.start_time?.substring(0, 5)} -
                        {session.courses_sessions_timeslot[0]?.end_time?.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {session.courses_sessions_students?.length || 0}
                        élève{session.courses_sessions_students?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Récréation entre les cours (sauf après le dernier) */}
                {sessionIdx < sortedSessions.length - 1 && (
                  <div className="h-1 w-full bg-amber-400 rounded-full my-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Aucun cours programmé
          </div>
        )}
      </div>
    </div>
  )
}
