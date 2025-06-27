import { GraduationCap } from 'lucide-react'

import { Badge } from '@/client/components/ui/badge'
import { Card, CardContent } from '@/client/components/ui/card'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { Teacher } from '@/zUnused/types/user'

interface StudentCourseMobileProps {
  sessions: Array<{
    session: {
      id: string
      subject: string
      level: string
      timeSlot: {
        day_of_week: string
        startTime: string
        endTime: string
        classroom_number?: string
      }
    }
    teacher: Teacher
  }>
}

export const StudentCourseMobile = ({ sessions }: StudentCourseMobileProps) => {
  return (
    <div className="space-y-4">
      {sessions.map(({ session, teacher }) => (
        <Card key={session.id} className="w-full">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {formatDayOfWeek(session.timeSlot.day_of_week)}
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
