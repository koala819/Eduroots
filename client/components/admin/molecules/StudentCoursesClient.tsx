'use client'

import { AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CoursesTable } from '@/client/components/admin/atoms/StudentCoursesTable'
import { Alert, AlertDescription } from '@/client/components/ui/alert'
import { getStudentCourses } from '@/server/actions/api/courses'
import { StudentCourseMobile } from '@/server/components/admin/atoms/StudentCourseMobile'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { TimeSlotEnum } from '@/types/courses'

interface StudentCoursesClientProps {
  studentId: string
}

export function StudentCoursesClient({ studentId }: StudentCoursesClientProps) {
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await getStudentCourses(studentId)

        if (!isMounted) return

        if (!response.success || !response.data) {
          setError(response.message || 'Aucun cours trouvé pour cet étudiant.')
          setSessions([])
          return
        }

        const enrollments = response.data as any[]

        // Transformer les enrollments en structure attendue
        const transformedSessions = enrollments.map((enrollment) => {
          const session = enrollment.courses_sessions
          const course = session.courses
          const teacher = course.courses_teacher?.[0]?.users || {}
          const timeslot = session.courses_sessions_timeslot?.[0]

          return {
            session: {
              id: session.id,
              subject: session.subject,
              level: session.level,
              timeSlot: {
                day_of_week: timeslot?.day_of_week,
                startTime: timeslot?.start_time,
                endTime: timeslot?.end_time,
                classroom_number: timeslot?.classroom_number,
              },
            },
            teacher,
          }
        })

        // Trier les sessions
        const sortedSessions = transformedSessions.sort((a, b) => {
          const timeSlotOrder = {
            [TimeSlotEnum.SATURDAY_MORNING]: 0,
            [TimeSlotEnum.SATURDAY_AFTERNOON]: 1,
            [TimeSlotEnum.SUNDAY_MORNING]: 2,
          }

          const dayDiff =
            timeSlotOrder[a.session.timeSlot.day_of_week as TimeSlotEnum] -
            timeSlotOrder[b.session.timeSlot.day_of_week as TimeSlotEnum]

          if (dayDiff !== 0) return dayDiff

          const getMinutes = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number)
            return hours * 60 + minutes
          }

          return getMinutes(a.session.timeSlot.startTime) - getMinutes(b.session.timeSlot.startTime)
        })

        setSessions(sortedSessions)
      } catch (error) {
        console.error('Error in CourseDataLoader:', error)
        if (isMounted) {
          setError('Erreur lors de la récupération des cours')
          setSessions([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [studentId])

  if (isLoading) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Chargement des cours...</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (sessions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Aucun cours trouvé pour cet étudiant.</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      {/* Version mobile */}
      <div className="block md:hidden">
        <StudentCourseMobile sessions={sessions} />
      </div>

      {/* Version desktop */}
      <div className="hidden md:block overflow-x-auto">
        <CoursesTable sessions={sessions} formatDayOfWeek={formatDayOfWeek} />
      </div>
    </>
  )
}
