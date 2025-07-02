import { Metadata } from 'next'
import { Suspense } from 'react'

import { HolidaysList } from '@/client/components/atoms/HolidaysList'
import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { DAY_ORDER_ARRAY, formatDayOfWeek } from '@/client/utils/timeSlots'
import { getAllCoursesWithStats } from '@/server/actions/api/courses'
import { getAllHolidays } from '@/server/actions/api/holidays'
import { TimeSlotEnum } from '@/types/courses'
import { Holiday } from '@/types/holidays'

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

const SchedulePage = async () => {
  console.log('=== DÉBUT SchedulePage ===')

  const [coursesResponse, holidaysResponse] = await Promise.all([
    getAllCoursesWithStats(),
    getAllHolidays(),
  ])

  // console.log('coursesResponse:', coursesResponse)

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

  const sessionsByDayAndSlot: Record<TimeSlotEnum, Record<string, any[]>> = {
    [TimeSlotEnum.SATURDAY_MORNING]: {},
    [TimeSlotEnum.SATURDAY_AFTERNOON]: {},
    [TimeSlotEnum.SUNDAY_MORNING]: {},
  }

  for (const course of coursesResponse.data) {
    for (const session of course.courses_sessions || []) {
      const timeslot = session.courses_sessions_timeslot?.[0]
      if (timeslot && timeslot.day_of_week) {
        const slotKey = formatSlot(timeslot.start_time, timeslot.end_time)
        if (!sessionsByDayAndSlot[timeslot.day_of_week][slotKey]) {
          sessionsByDayAndSlot[timeslot.day_of_week][slotKey] = []
        }
        sessionsByDayAndSlot[timeslot.day_of_week][slotKey].push({
          ...session,
          course,
        })
      }
    }
  }

  // Pour l'affichage, on parcourt dans l'ordre défini
  DAY_ORDER_ARRAY.forEach((day) => {
    console.log(`Sessions pour ${day}:`, sessionsByDayAndSlot[day])
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
          Matières:
            {/* <div className="flex flex-wrap gap-4">
            {subjectLegend.map(({ subject, colorClass }) => (
              <div key={subject} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                <span className="text-sm font-medium">{subject}</span>
              </div>
            ))}
          </div> */}
          </CardContent>
        </Card>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-8">
          {/* Vue principale */}
          <aside>
            {DAY_ORDER_ARRAY.map((day) => {
              const slots = Object.keys(sessionsByDayAndSlot[day]).sort()
              return (
                <section key={day} className="pt-8">
                  <h2 className="text-lg font-bold mb-4">{formatDayOfWeek(day)}</h2>
                  {slots.length === 0 ? (
                    <p>Aucune session</p>
                  ) : (
                    <div className={`grid grid-cols-${slots.length} gap-4`}>
                      {slots.map((slot) => (
                        <div key={slot}>
                          <div className="font-semibold text-center mb-2">{slot}</div>
                          <div className="space-y-2">
                            {sessionsByDayAndSlot[day][slot].map((session) => {
                              const teacher = session.course.courses_teacher?.[0]?.users
                              const teacherName = teacher
                                ? `${teacher.firstname} ${teacher.lastname}` : 'Prof inconnu'
                              const stats = getSessionStats(session)
                              return (
                                <div
                                  key={session.id}
                                  className="p-2 bg-gray-50 rounded shadow-sm text-center"
                                >
                                  <div className="font-medium">
                                    {session.subject} (Niveau {session.level})
                                  </div>
                                  <div className="text-sm text-gray-600 mb-1">{teacherName}</div>
                                  <div className="text-xs text-gray-500">
                                    {stats.total} élève{stats.total > 1 ? 's' : ''}
                                  </div>
                                  <div className="flex justify-center gap-2 text-xs mt-1">
                                    <span className="text-blue-700">
                                      ♂ {stats.male} ({stats.malePercentage}%)
                                    </span>
                                    <span className="text-pink-700">
                                      ♀ {stats.female} ({stats.femalePercentage}%)
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </aside>
          <HolidaysList holidays={convertedHolidays} />
          {/* <ScheduleAdminView courses={coursesResponse} holidays={holidaysResponse} /> */}
        </section>
      </div>
    </Suspense>
  )
}

export default SchedulePage
