import {GraduationCap} from 'lucide-react'

import {CourseSession} from '@/types/mongo/course'
import {Teacher} from '@/types/mongo/user'

import {Badge} from '@/components/ui/badge'
import {Card, CardContent} from '@/components/ui/card'

import {formatDayOfWeek} from '@/utils/helpers'
import { TimeSlotEnum } from '@/types/supabase/courses'

interface StudentCourseMobileProps {
  sessions: Array<{
    session: CourseSession
    teacher: Teacher
  }>
}

export const StudentCourseMobile = ({sessions}: StudentCourseMobileProps) => {
  return (
    <div className="space-y-4">
      {sessions.map(({session, teacher}, index) => (
        <Card key={`mobile-session-${index}`} className="w-full">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {formatDayOfWeek(session.timeSlot.dayOfWeek as TimeSlotEnum)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {session.timeSlot.startTime} - {session.timeSlot.endTime}
                </span>
              </div>

              <Badge variant="secondary" className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                {session.subject}
              </Badge>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Niveau:</span>
                  <span>{session.level}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Professeur:</span>
                  <div className="flex items-center gap-1 text-right">
                    {Array.isArray(teacher) ? (
                      teacher.map((t, index) => (
                        <span key={index}>
                          {t.firstname} {t.lastname}
                          {index < teacher.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    ) : (
                      <span>
                        {teacher.firstname} {teacher.lastname}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Salle:</span>
                  <span>{session.timeSlot.classroomNumber}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
