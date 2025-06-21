'use client'

import { CircleArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ProfileCourseCard } from '@/client/components/organisms/ProfileCourseCard'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { SubjectNameEnum, TimeSlotEnum } from '@/types/courses'
import { TeacherWithStudentsResponse } from '@/types/teacher-payload'

interface ClassroomDashboardProps {
  initialData: TeacherWithStudentsResponse
}

const ClassroomDashboard = ({ initialData }: ClassroomDashboardProps) => {
  const router = useRouter()
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  // Extraire tous les créneaux horaires uniques
  const allTimeSlots = initialData.courses.flatMap((course) =>
    course.sessions.map((session) => ({
      id: session.sessionId,
      subject: session.subject,
      dayOfWeek: session.timeSlot,
      level: session.level,
      courseId: course.courseId,
    })),
  )

  // Sélectionner automatiquement le premier créneau
  useEffect(() => {
    if (allTimeSlots.length > 0 && !selectedSession) {
      setSelectedSession(allTimeSlots[0].id)
    }
  }, [allTimeSlots, selectedSession])

  // Trier les créneaux par ordre chronologique
  const sortTimeSlots = (
    a: typeof allTimeSlots[0],
    b: typeof allTimeSlots[0],
  ) => {
    const dayOrder = {
      [TimeSlotEnum.SATURDAY_MORNING]: 1,
      [TimeSlotEnum.SATURDAY_AFTERNOON]: 2,
      [TimeSlotEnum.SUNDAY_MORNING]: 3,
    }

    const dayA = dayOrder[a.dayOfWeek as TimeSlotEnum] || 999
    const dayB = dayOrder[b.dayOfWeek as TimeSlotEnum] || 999

    return dayA - dayB
  }

  const sortedTimeSlots = [...allTimeSlots].sort(sortTimeSlots)

  if (!initialData.courses || initialData.courses.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="link"
            className="p-0 text-gray-500 hover:text-blue-600 -ml-1.5 transition-colors"
            onClick={() => router.push('/teacher/profiles')}
          >
            <CircleArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun cours trouvé pour ce professeur</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="link"
            className="p-0 text-gray-500 hover:text-blue-600 -ml-1.5 transition-colors"
            onClick={() => router.push('/teacher/profiles')}
          >
            <CircleArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100
            text-blue-600">
              <span className="text-xs font-medium">
                {sortedTimeSlots.length}
              </span>
            </div>
            <span className="text-sm text-gray-500">Créneaux</span>
          </div>
        </div>

        <div className="pb-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Mes Cours</h1>
        </div>

        <div className="space-y-2 sm:space-y-0 md:flex overflow-x-auto gap-2 scrollbar-hide pb-2">
          {sortedTimeSlots.map((timeSlot) => (
            <Button
              key={timeSlot.id}
              variant={selectedSession === timeSlot.id ? 'default' : 'outline'}
              className="rounded-full text-sm whitespace-nowrap w-full"
              onClick={() => setSelectedSession(timeSlot.id)}
            >
              {formatDayOfWeek(timeSlot.dayOfWeek as TimeSlotEnum)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-6 mt-4">
        {initialData.courses.map((course) =>
          Object.values(SubjectNameEnum).map((subject) => {
            // Filtrer les sessions pour ce cours, cette matière et ce créneau
            const subjectSessions = course.sessions.filter(
              (session) =>
                session.subject === subject &&
                session.sessionId === selectedSession,
            )

            if (subjectSessions.length > 0) {
              return (
                <Card
                  key={`${course.courseId}-${subject}`}
                  className="shadow-sm border-l-4 border-l-blue-500 border-t-0 border-r-0 border-b-0
                  overflow-hidden rounded-lg animate-fadeIn bg-white"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {subject}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    {subjectSessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors
                        duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between
                        sm:items-center mb-3">
                          <div className="flex items-center mb-2 sm:mb-0">
                            <div className="h-7 w-24 rounded-full bg-blue-100 flex items-center
                            justify-center mr-2">
                              <span className="text-blue-600 text-xs font-medium">
                                Niveau {session.level}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ProfileCourseCard
                          key={session.sessionId}
                          students={session.students}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            }
            return null
          }),
        )}
      </div>
    </div>
  )
}

export default ClassroomDashboard
