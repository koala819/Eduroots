import { GraduationCap } from 'lucide-react'

import { Card, CardContent } from '@/client/components/ui/card'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { TimeSlotEnum } from '@/types/courses'
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

// Fonction pour formater les horaires sans les secondes
const formatTime = (time: string): string => {
  if (!time) return 'N/A'
  // Si le format est HH:MM:SS, on garde seulement HH:MM
  return time.split(':').slice(0, 2).join(':')
}

// Fonction pour obtenir les couleurs des matières sans bordures arrondies
const getSubjectColors = (subject: string): string => {
  switch (subject) {
  case 'Arabe':
    return 'bg-primary-accent/10 text-primary-accent border-l-4 border-primary-accent'
  case 'Education Culturelle':
    return 'bg-accent/10 text-accent border-l-4 border-accent'
  default:
    return 'bg-muted/10 text-muted-foreground border-l-4 border-muted'
  }
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
                  {formatDayOfWeek(session.timeSlot.day_of_week as TimeSlotEnum)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatTime(session.timeSlot.startTime)} - {formatTime(session.timeSlot.endTime)}
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
