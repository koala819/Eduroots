import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { BehaviorCreate } from '@/client/components/atoms/BehaviorCreate'
import { ErrorComponent } from '@/client/components/atoms/ErrorComponent'
import { LoadingContent } from '@/client/components/atoms/StatusContent'
import { getAttendanceById } from '@/server/actions/api/attendances'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { AttendanceRecord } from '@/types/db'

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    date?: string
  }>
}

export default async function BehaviorCreatePage({ params, searchParams }: PageProps) {
  const [{ id: courseSessionId }, { date }] = await Promise.all([params, searchParams])

  if (!date) {
    notFound()
  }

  try {
    const courseResponse = await getCourseSessionById(courseSessionId)
    if (!courseResponse.success || !courseResponse.data) {
      return <ErrorComponent message={courseResponse.message} />
    }

    const courseId = courseResponse.data.courses.id
    const attendanceResponse = await getAttendanceById(courseId, date)

    if (!attendanceResponse.success || !attendanceResponse.data) {
      return <ErrorComponent message="Aucune présence trouvée pour cette date" />
    }

    const presentStudents = attendanceResponse.data.attendance_records
      .filter((record: AttendanceRecord) => record.is_present)

    return (
      <Suspense fallback={<LoadingContent />}>
        <BehaviorCreate
          students={presentStudents}
          date={date}
          courseId={courseSessionId}
          onClose={() => {
            // Navigation de retour vers le dashboard
            window.history.back()
          }}
        />
      </Suspense>
    )
  } catch (error) {
    return <ErrorComponent message="Erreur lors du chargement des données" />
  }
}
