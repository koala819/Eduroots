'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { AttendanceTable } from '@/client/components/atoms/AttendanceTable'
import { EmptyContent, ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { Card, CardContent } from '@/client/components/ui/card'
import { useAttendances } from '@/client/context/attendances'
import { useCourses } from '@/client/context/courses'
import { getCourseSessionById } from '@/server/actions/api/courses'

export const AttendanceDashboard = ({
  courseSessionId,
  courseDates,
}: {
  courseSessionId: string
  courseDates: Date[]
}) => {
  const router = useRouter()
  const { isLoading: isLoadingCourses, error: errorCourses } = useCourses()
  const { allAttendance, fetchAttendances, error: attendanceError } = useAttendances()

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getCourseSessionById(courseSessionId)
        if (!response.success || !response.data) {
          console.error('❌ [AttendanceDashboard] Erreur chargement session:', response.message)
          return
        }

        const courseId = response.data.courses.id
        await fetchAttendances({ courseId })
      } catch (err) {
        console.error('❌ [AttendanceDashboard] Erreur chargement:', err)
      }
    }

    loadData()
  }, [courseSessionId, fetchAttendances])

  function handleCreateAttendance(date: string) {
    // Navigation vers la page de création avec useRouter
    router.push(
      `/teacher/classroom/course/${courseSessionId}/attendance/create?date=${date}`,
    )
  }

  function handleEditAttendance(attendanceId: string, date: string) {
    // Navigation vers la page d'édition avec useRouter
    router.push(
      `/teacher/classroom/course/${courseSessionId}/attendance/${attendanceId}/edit?date=${date}`,
    )
  }

  if (isLoadingCourses) {
    return <LoadingContent />
  }

  if (attendanceError || errorCourses) {
    return <ErrorContent message={attendanceError ?? errorCourses ?? 'Une erreur est survenue'} />
  }

  if (!allAttendance || allAttendance.length === 0) {
    return <EmptyContent />
  }

  return (
    <Card className="w-full border-primary/60 border-2 rounded-sm">
      <CardContent className="p-2 sm:p-6">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <AttendanceTable
            courseDates={courseDates}
            allAttendance={allAttendance}
            handleCreateAttendance={handleCreateAttendance}
            handleEditAttendance={handleEditAttendance}
          />
        </div>
      </CardContent>
    </Card>
  )
}
