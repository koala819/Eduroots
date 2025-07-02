import { Metadata } from 'next'
import { Suspense } from 'react'

import { HolidaysList } from '@/client/components/admin/atoms/HolidaysList'
import { ScheduleDayCaroussel } from '@/client/components/admin/molecules/ScheduleDayCarousel'
import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { DAY_ORDER_ARRAY, formatDayOfWeek, getTimeSlotOptions } from '@/client/utils/timeSlots'
import { getCoursesWithStudentStats } from '@/server/actions/admin/student-courses-stats'
import { getAllHolidays } from '@/server/actions/api/holidays'
import { getSubjectColors } from '@/server/utils/helpers'
import { CourseSessionWithRelations, TimeSlotEnum } from '@/types/courses'
import { Holiday } from '@/types/holidays'
import { ScheduleCard, ScheduleDay, SessionStats } from '@/types/schedule'

export const metadata: Metadata = {
  title: 'Planning des cours',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/schedule`,
  },
}

const formatHour = (time: string) => time ? time.slice(0, 5) : ''

function getSessionStats(session: CourseSessionWithRelations): SessionStats {
  const students = session.courses_sessions_students || []
  const total = students.length
  let male = 0
  let female = 0

  students.forEach((student) => {
    const gender = student.users?.gender?.toLowerCase()
    if (gender === 'masculin' || gender === 'male' || gender === 'm') {
      male++
    } else if (gender === 'féminin' || gender === 'female' || gender === 'f') {
      female++
    }
  })

  const malePercentage = total > 0 ? Math.round((male / total) * 100) : 0
  const femalePercentage = total > 0 ? Math.round((female / total) * 100) : 0

  return { total, male, female, malePercentage, femalePercentage }
}



const SchedulePage = async () => {
  const [coursesData, holidaysResponse] = await Promise.all([
    getCoursesWithStudentStats(),
    getAllHolidays(),
  ])

  if (holidaysResponse.error || !holidaysResponse.data || !coursesData) {
    return <ErrorContent message="Erreur lors de la récupération des cours ou des vacances" />
  }

  const convertedHolidays = holidaysResponse.data.map((holiday: Holiday) => ({
    ...holiday,
    start_date: new Date(holiday.start_date),
    end_date: new Date(holiday.end_date),
    created_at: new Date(holiday.created_at),
    updated_at: new Date(holiday.updated_at),
  }))

  // Préparation des données côté server
  const sessionsByDayAndSlot: Record<TimeSlotEnum, Record<string, any[]>> = {
    [TimeSlotEnum.SATURDAY_MORNING]: {},
    [TimeSlotEnum.SATURDAY_AFTERNOON]: {},
    [TimeSlotEnum.SUNDAY_MORNING]: {},
  }

  for (const course of coursesData) {
    for (const session of course.courses_sessions || []) {
      const timeslot = session.courses_sessions_timeslot?.[0]
      if (timeslot && timeslot.day_of_week) {
        const day = timeslot.day_of_week as TimeSlotEnum
        const slotKey = `${formatHour(timeslot.start_time)}-${formatHour(timeslot.end_time)}`
        const slotOptions = getTimeSlotOptions(day)
        const isDoubleSlot =
          slotOptions.length === 3 &&
          formatHour(slotOptions[2].start) === formatHour(timeslot.start_time) &&
          formatHour(slotOptions[2].end) === formatHour(timeslot.end_time)
        if (isDoubleSlot) {
          // On n'ajoute la session que dans les deux créneaux simples (pas dans la colonne double)
          slotOptions.slice(0, 2).forEach((opt) => {
            const splitKey = `${formatHour(opt.start)}-${formatHour(opt.end)}`
            if (!sessionsByDayAndSlot[day][splitKey]) {
              sessionsByDayAndSlot[day][splitKey] = []
            }
            sessionsByDayAndSlot[day][splitKey].push({
              ...session,
              course,
            })
          })
        } else {
          if (!sessionsByDayAndSlot[day][slotKey]) {
            sessionsByDayAndSlot[day][slotKey] = []
          }
          sessionsByDayAndSlot[day][slotKey].push({
            ...session,
            course,
          })
        }
      }
    }
  }

  // Extraction des matières présentes dans le planning
  const subjectsSet = new Set<string>()
  Object.values(sessionsByDayAndSlot).forEach((slotsByTime) => {
    Object.values(slotsByTime).forEach((sessions) => {
      sessions.forEach((session) => {
        if (session.subject) {
          subjectsSet.add(session.subject)
        }
      })
    })
  })

  // Pour chaque jour, on veut les créneaux simples (pas le "double")
  const slotOptionsByDay: Record<TimeSlotEnum, { start: string, end: string, label: string }[]> = {
    [TimeSlotEnum.SATURDAY_MORNING]: [],
    [TimeSlotEnum.SATURDAY_AFTERNOON]: [],
    [TimeSlotEnum.SUNDAY_MORNING]: [],
  }
  for (const day of DAY_ORDER_ARRAY) {
    // On ne garde que les deux premiers créneaux (simples) pour l'affichage.
    // Cela cache le créneau double (ex : 09:00-12:30)
    slotOptionsByDay[day] = getTimeSlotOptions(day).slice(0, 2)
  }

  const planningDays: ScheduleDay[] = DAY_ORDER_ARRAY.map((day) => {
    const slots = slotOptionsByDay[day].map((opt) => {
      const slot = `${opt.start}-${opt.end}`
      const cards: ScheduleCard[] = (sessionsByDayAndSlot[day][slot] || [])
        .map((session: any) => {
          const teacher = session.course?.courses_teacher?.[0]?.users
          const teacherName = teacher
            ? `${teacher.firstname} ${teacher.lastname}` : 'Prof inconnu'
          const stats = getSessionStats(session)
          const bgColor = getSubjectColors(session.subject)
          const teacherId = teacher?.id
          const averageAge = session.course?.stats?.averageAge || 0
          return {
            slot,
            sessionId: session.id,
            teacherName,
            level: session.level,
            subject: session.subject,
            stats,
            bgColor,
            teacherId,
            averageAge,
          }
        })
        .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'fr'))
      return { slot, cards }
    })
    return {
      day,
      dayLabel: formatDayOfWeek(day),
      slots,
    }
  })

  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="p-4">

        {/* Légende des matières */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Légende des matières</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Array.from(subjectsSet).map((subject) => (
                <div key={subject} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getSubjectColors(subject)}`} />
                  <span className="text-sm font-medium">{subject}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-8">
          {/* Vue principale */}
          <aside>
            <ScheduleDayCaroussel planningDays={planningDays} />
          </aside>
          <HolidaysList holidays={convertedHolidays} />
        </section>
      </div>
    </Suspense>
  )
}

export default SchedulePage
