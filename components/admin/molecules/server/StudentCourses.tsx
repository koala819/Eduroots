import {AlertCircle} from 'lucide-react'

import {TimeSlotEnum} from '@/types/course'

import {CoursesTable} from '@/components/admin/atoms/client/StudentCoursesTable'
import {StudentCourseMobile} from '@/components/admin/atoms/server/StudentCourseMobile'
import {Alert, AlertDescription} from '@/components/ui/alert'

import {getStudentCourses} from '@/app/actions/context/courses'
import {formatDayOfWeek} from '@/lib/utils'

export async function StudentCourses({studentId}: {studentId: string}) {
  try {
    const response = await getStudentCourses(studentId)

    if (!response.success || !response.data) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {response.message || 'Aucun cours trouvé pour cet étudiant.'}
          </AlertDescription>
        </Alert>
      )
    }

    const courses = response.data as any[]

    // Traitement similaire à celui de votre code original
    const filteredCourses = courses
      .map((course) => {
        const filteredSessions = course.sessions.filter((session: any) =>
          session.students.some((student: any) => student._id === studentId),
        )
        return {
          ...course,
          sessions: filteredSessions,
        }
      })
      .filter((course) => course.sessions.length > 0)

    const allSessions = filteredCourses.flatMap((course) =>
      course.sessions.map((session: any) => ({
        session,
        teacher: course.teacher,
      })),
    )

    const sortedStudentSessions = allSessions.sort((a: any, b: any) => {
      const timeSlotOrder = {
        [TimeSlotEnum.SATURDAY_MORNING]: 0,
        [TimeSlotEnum.SATURDAY_AFTERNOON]: 1,
        [TimeSlotEnum.SUNDAY_MORNING]: 2,
      }

      const dayDiff =
        timeSlotOrder[a.session.timeSlot.dayOfWeek as TimeSlotEnum] -
        timeSlotOrder[b.session.timeSlot.dayOfWeek as TimeSlotEnum]

      if (dayDiff !== 0) return dayDiff

      const getMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
      }

      return getMinutes(a.session.timeSlot.startTime) - getMinutes(b.session.timeSlot.startTime)
    })

    if (sortedStudentSessions.length === 0) {
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
          <StudentCourseMobile sessions={sortedStudentSessions} />
        </div>

        {/* Version desktop */}
        <div className="hidden md:block overflow-x-auto">
          <CoursesTable sessions={sortedStudentSessions} formatDayOfWeek={formatDayOfWeek} />
        </div>
      </>
    )
  } catch (error) {
    console.error('Error in CourseDataLoader:', error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erreur lors de la récupération des cours</AlertDescription>
      </Alert>
    )
  }
}
