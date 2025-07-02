import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { HolidaysList } from '@/client/components/atoms/HolidaysList'
import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { DAY_ORDER_ARRAY, formatDayOfWeek, getTimeSlotOptions } from '@/client/utils/timeSlots'
import { getAllCoursesWithStats } from '@/server/actions/api/courses'
import { getAllHolidays } from '@/server/actions/api/holidays'
import { getSubjectColors } from '@/server/utils/helpers'
import { TimeSlotEnum } from '@/types/courses'
import { Holiday } from '@/types/holidays'
// import { getSubjectColors } from '@/client/utils/subjectColors'

export const metadata: Metadata = {
  title: 'Planning des cours',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/schedule`,
  },
}

function formatHour(time: string) {
  // Prend "09:00:00" et retourne "09:00"
  return time ? time.slice(0, 5) : ''
}

function formatSlot(start: string, end: string) {
  return `${formatHour(start)}-${formatHour(end)}`
}

function getSessionStats(session: any) {
  const students = session.courses_sessions_students || []
  const total = students.length
  let male = 0
  let female = 0

  students.forEach((student: any) => {
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

type PlanningCard = {
  slot: string
  sessionId: string
  teacherName: string
  level: string
  subject: string
  stats: ReturnType<typeof getSessionStats>
  bgColor: string
  teacherId?: string
}

type PlanningDay = {
  day: TimeSlotEnum
  dayLabel: string
  slots: {
    slot: string
    cards: PlanningCard[]
  }[]
}

const SchedulePage = async () => {
  const [coursesResponse, holidaysResponse] = await Promise.all([
    getAllCoursesWithStats(),
    getAllHolidays(),
  ])

  if (coursesResponse.error ||
    holidaysResponse.error ||
    !holidaysResponse.data ||
    !coursesResponse.data) {
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

  for (const course of coursesResponse.data) {
    for (const session of course.courses_sessions || []) {
      const timeslot = session.courses_sessions_timeslot?.[0]
      if (timeslot && timeslot.day_of_week) {
        const day = timeslot.day_of_week as TimeSlotEnum
        const slotKey = formatSlot(timeslot.start_time, timeslot.end_time)
        const slotOptions = getTimeSlotOptions(day)
        const isDoubleSlot = slotOptions.length === 3 &&
          slotOptions[2].start === timeslot.start_time &&
          slotOptions[2].end === timeslot.end_time
        if (isDoubleSlot) {
          slotOptions.slice(0, 2).forEach((opt) => {
            const splitKey = `${opt.start}-${opt.end}`
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
    slotOptionsByDay[day] = getTimeSlotOptions(day).slice(0, 2)
  }

  // On prépare les données à passer au composant client plus tard
  const planningData = {
    sessionsByDayAndSlot,
    slotOptionsByDay,
    subjects: Array.from(subjectsSet),
    holidays: convertedHolidays,
  }

  const planningDays: PlanningDay[] = DAY_ORDER_ARRAY.map((day) => {
    const slots = slotOptionsByDay[day].map((opt) => {
      const slot = `${opt.start}-${opt.end}`
      const cards: PlanningCard[] = (sessionsByDayAndSlot[day][slot] || []).map((session: any) => {
        const teacher = session.course?.courses_teacher?.[0]?.users
        const teacherName = teacher
          ? `${teacher.firstname} ${teacher.lastname}` : 'Prof inconnu'
        const stats = getSessionStats(session)
        const bgColor = getSubjectColors(session.subject)
        const teacherId = teacher?.id
        return {
          slot,
          sessionId: session.id,
          teacherName,
          level: session.level,
          subject: session.subject,
          stats,
          bgColor,
          teacherId,
        }
      })
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

        {/* Légende des couleurs */}
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
            {planningDays.map(({ day, dayLabel, slots }) => (
              <section key={day} className="pt-8">
                <h2 className="text-lg font-bold mb-4">{dayLabel}</h2>
                <div className={`grid grid-cols-${slots.length} gap-4`}>
                  {slots.map(({ slot, cards }) => (
                    <div key={slot}>
                      <div className="font-semibold text-center mb-2">{slot}</div>
                      <div className="space-y-2">
                        {cards.map((card) => (
                          <Link
                            key={card.sessionId}
                            href={`/admin/members/teacher/edit/${card.teacherId}`}
                            className={`block p-2 rounded shadow-sm text-center hover:bg-primary/80
                              transition ${card.bgColor}`}
                          >
                            <div className="font-bold text-base mb-1">{card.teacherName}</div>
                            <div className="text-sm font-semibold mb-1">Niveau {card.level}</div>
                            <div className="text-md font-medium mb-1">{card.subject}</div>
                            <div className="text-xs">
                              {card.stats.total} élève{card.stats.total > 1 ? 's' : ''}
                            </div>
                            <div className="flex justify-center gap-4 text-xs mt-1 bg-warning
                            rounded-md p-2">
                              <span className="flex items-center gap-1">
                                <GenderDisplay gender="masculin" size="w-8 h-8" />
                                {card.stats.male} ({card.stats.malePercentage}%)
                              </span>
                              <span className="flex items-center gap-1">
                                <GenderDisplay gender="féminin" size="w-8 h-8" />
                                {card.stats.female} ({card.stats.femalePercentage}%)
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </aside>
          <HolidaysList holidays={convertedHolidays} />
          {/* <ScheduleAdminView courses={coursesResponse} holidays={holidaysResponse} /> */}
        </section>
      </div>
    </Suspense>
  )
}

export default SchedulePage
