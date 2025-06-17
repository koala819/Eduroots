'use client'

import { CircleArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/client/hooks/use-toast'
import {
  CourseSessionWithRelations,
  SubjectNameEnum,
  TimeEnum,
  TimeSlotEnum,
} from '@/types/courses'
import { ProfileCourseCard } from '@/client/components/organisms/ProfileCourseCard'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { useTeachers } from '@/client/context/teachers'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { createClient } from '@/client/utils/supabase'
import { CourseSession, User } from '@/types/db'

interface TimeSlot {
  id: string
  subject: string
  dayOfWeek: TimeSlotEnum
  startTime: string
  endTime: string
  level: string
  courseId: string
}

interface CourseWithSessions {
  courseId: string
  sessions: CourseSession[]
}

const createTimeSlotFromSession = (
  session: CourseSession,
  timeslot: CourseSessionWithRelations['courses_sessions_timeslot'][0],
  courseId: string,
): TimeSlot => ({
  id: session.id,
  subject: session.subject,
  dayOfWeek: timeslot.day_of_week,
  startTime: timeslot.start_time,
  endTime: timeslot.end_time,
  level: session.level,
  courseId,
})

const getAllTimeSlots = (groupedStudents: any[]): TimeSlot[] => {
  const timeSlots: TimeSlot[] = []

  groupedStudents.forEach((course) => {
    course.sessions.forEach((session: CourseSession) => {
      const sessionWithRelations = session as CourseSessionWithRelations
      sessionWithRelations.courses_sessions_timeslot.forEach((timeslot) => {
        timeSlots.push(createTimeSlotFromSession(session, timeslot, course.courseId))
      })
    })
  })

  return timeSlots
}

const getSubjectSessions = (
  course: CourseWithSessions,
  subject: SubjectNameEnum,
  selectedSession: string | null,
) => {
  return course.sessions.filter(
    (session: CourseSession) =>
      session.subject === subject && session.id === selectedSession,
  )
}

const getStudentsFromSession = (session: CourseSession): User[] => {
  const sessionWithRelations = session as CourseSessionWithRelations
  return sessionWithRelations.courses_sessions_students.map((s) => s.users)
}

const ClassRoomPage = () => {
  const { toast } = useToast()
  const router = useRouter()
  const { groupedStudents, getStudentsByTeacher, isLoading } = useTeachers()
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    const loadStudents = async () => {
      try {
        if (user?.id) {
          await getStudentsByTeacher(user.id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    }
    loadStudents()
  }, [user, getStudentsByTeacher])

  const allTimeSlots = groupedStudents ? getAllTimeSlots(groupedStudents) : []

  useEffect(() => {
    if (allTimeSlots.length > 0 && !selectedSession) {
      setSelectedSession(allTimeSlots[0].id)
    }
  }, [allTimeSlots, selectedSession])

  const sortTimeSlots = (a: TimeSlot, b: TimeSlot) => {
    const dayOrder = {
      [TimeSlotEnum.SATURDAY_MORNING]: 1,
      [TimeSlotEnum.SATURDAY_AFTERNOON]: 2,
      [TimeSlotEnum.SUNDAY_MORNING]: 3,
    }

    const timeOrder = {
      [TimeEnum.MorningStart]: 1,
      [TimeEnum.MorningPause]: 2,
      [TimeEnum.MorningEnd]: 3,
      [TimeEnum.AfternoonStart]: 4,
      [TimeEnum.AfternoonPause]: 5,
      [TimeEnum.AfternoonEnd]: 6,
    }

    const dayA = dayOrder[a.dayOfWeek] || 999
    const dayB = dayOrder[b.dayOfWeek] || 999

    if (dayA !== dayB) {
      return dayA - dayB
    }

    const startTimeA = timeOrder[a.startTime as TimeEnum] || 999
    const startTimeB = timeOrder[b.startTime as TimeEnum] || 999

    return startTimeA - startTimeB
  }

  const sortedTimeSlots = [...allTimeSlots].sort(sortTimeSlots)

  if (isLoading || !groupedStudents) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1" />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    )
  }

  if (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: `Error: ${error}`,
      duration: 3000,
    })
  }

  return (
    <div className="p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="link"
            className={`
              p-0 text-gray-500 hover:text-blue-600 -ml-1.5
              transition-colors
            `}
            onClick={() => router.push('/teacher/profiles')}
          >
            <CircleArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className={`
              h-8 w-8 flex items-center justify-center rounded-full
              bg-blue-100 text-blue-600
            `}>
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

        <div className={`
          space-y-2 sm:space-y-0 md:flex overflow-x-auto gap-2
          scrollbar-hide pb-2
        `}>
          {sortedTimeSlots.map((timeSlot) => (
            <Button
              key={timeSlot.id}
              variant={selectedSession === timeSlot.id ? 'default' : 'outline'}
              className={`
                rounded-full text-sm whitespace-nowrap w-full
              `}
              onClick={() => setSelectedSession(timeSlot.id)}
            >
              {formatDayOfWeek(timeSlot.dayOfWeek)}{' '}
              {timeSlot.startTime}-{timeSlot.endTime}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-6 mt-4">
        {groupedStudents.map((course) =>
          Object.values(SubjectNameEnum).map((subject) => {
            const subjectSessions = getSubjectSessions(course, subject, selectedSession)

            if (subjectSessions.length > 0) {
              return (
                <Card
                  key={`${course.courseId}-${subject}`}
                  className={`
                    shadow-sm border-l-4 border-l-blue-500 border-t-0
                    border-r-0 border-b-0 overflow-hidden rounded-lg
                    animate-fadeIn bg-white
                  `}
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
                        key={session.id}
                        className={`
                          bg-gray-50 rounded-lg p-4 hover:bg-gray-100
                          transition-colors duration-200
                        `}
                      >
                        <div className={`
                          flex flex-col sm:flex-row sm:justify-between
                          sm:items-center mb-3
                        `}>
                          <div className="flex items-center mb-2 sm:mb-0">
                            <div className={`
                              h-7 w-24 rounded-full bg-blue-100
                              flex items-center justify-center mr-2
                            `}>
                              <span className="text-blue-600 text-xs font-medium">
                                Niveau {session.level}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ProfileCourseCard
                          key={session.id}
                          students={getStudentsFromSession(session)}
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

export default ClassRoomPage
