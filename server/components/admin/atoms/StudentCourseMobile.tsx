import { GraduationCap } from 'lucide-react'

import { Card, CardContent } from '@/client/components/ui/card'
import { formatDayOfWeek, getSubjectColors } from '@/server/utils/helpers'
import { StudentCourseSession, TimeSlotEnum } from '@/types/courses'

interface StudentCourseMobileProps {
  coursesSessions: StudentCourseSession[]
}

export const StudentCourseMobile = ({ coursesSessions }: StudentCourseMobileProps) => {
  return (
    <div className="space-y-4">
      {coursesSessions.map(({ session, teacher }) => (
        <Card key={session.id} className="w-full">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {formatDayOfWeek(session.timeSlot.day_of_week as TimeSlotEnum)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {session.timeSlot.startTime.slice(0, 5)} - {session.timeSlot.endTime.slice(0, 5)}
                </span>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-2
              ${getSubjectColors(session.subject)}`}>
                <GraduationCap className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{session.subject}</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Niveau:</span>
                  <span>{session.level}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Professeur:</span>
                  <div className="flex items-center gap-1 text-right">
                    {Array.isArray(teacher) ? (
                      teacher.map((t) => (
                        <span key={t.id}>
                          {t.firstname} {t.lastname}
                          {t !== teacher[teacher.length - 1] ? ', ' : ''}
                        </span>
                      ))
                    ) : (
                      <span>
                        {teacher.firstname} {teacher.lastname}
                      </span>
                    )}
                  </div>
                </div>

                {session.timeSlot.classroom_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Salle:</span>
                    <span>{session.timeSlot.classroom_number}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
