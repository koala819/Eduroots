'use client'

import { CourseWithRelations, TimeSlotEnum } from '@/types/supabase/courses'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, GraduationCap, Users, Building2 } from 'lucide-react'
import { formatDayOfWeek } from '@/utils/helpers'
import { useRouter } from 'next/navigation'

interface CourseGridProps {
  courses: CourseWithRelations[]
}

// Ordre des créneaux horaires
const TIME_SLOT_ORDER = {
  [TimeSlotEnum.SATURDAY_MORNING]: 1,
  [TimeSlotEnum.SATURDAY_AFTERNOON]: 2,
  [TimeSlotEnum.SUNDAY_MORNING]: 3,
}

export function CourseGrid({ courses }: Readonly<CourseGridProps>) {
  const router = useRouter()

  const allSessions = courses.flatMap((course) =>
    course.courses_sessions?.map((session) => ({
      ...session,
      timeslot: session.courses_sessions_timeslot?.[0],
    })) || [],
  ).sort((a, b) => {
    // Trier par créneau horaire
    const slotA = TIME_SLOT_ORDER[a.timeslot?.day_of_week] || 999
    const slotB = TIME_SLOT_ORDER[b.timeslot?.day_of_week] || 999

    if (slotA !== slotB) {
      return slotA - slotB
    }

    // Si même créneau, trier par heure de début
    const timeA = a.timeslot?.start_time || '00:00'
    const timeB = b.timeslot?.start_time || '00:00'

    return timeA.localeCompare(timeB)
  })

  // Grouper les sessions par créneau horaire
  const sessionsByTimeSlot = allSessions.reduce((acc, session) => {
    const timeSlot = session.timeslot?.day_of_week
    if (!acc[timeSlot]) {
      acc[timeSlot] = []
    }
    acc[timeSlot].push(session)
    return acc
  }, {} as Record<TimeSlotEnum, typeof allSessions>)

  function formatTime(time: string) {
    return time.split(':').slice(0, 2).join(':')
  }

  return (
    <div className="space-y-4">
      {Object.entries(sessionsByTimeSlot).map(([timeSlot, sessions]) => (
        <div key={timeSlot} className="space-y-4">
          <h2 className="text-xl font-semibold text-[#375073] px-4">
            {formatDayOfWeek(timeSlot as TimeSlotEnum)}
          </h2>
          {sessions.map((session) => {
            if (!session) return null
            const timeslot = session.timeslot

            return (
              <Card
                key={session.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer
              border-l-4 border-l-[#375073] hover:border-l-[#4a6b94]"
                onClick={() => router.push(`/teacher/classroom/course/${session.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-[#375073]">
                          {session.subject}
                        </h3>
                        <Badge variant="secondary" className="flex items-center gap-1 bg-[#375073]/10 text-[#375073]">
                          <GraduationCap className="h-4 w-4" />
                          {session.level}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-[#375073]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDayOfWeek(timeslot?.day_of_week)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(timeslot?.start_time)} - {formatTime(timeslot?.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>Salle {timeslot?.classroom_number ?? 'Non définie'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{session.courses_sessions_students?.length || 0} élèves</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ))}
    </div>
  )
}
