import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { AttendanceDashboard } from '@/client/components/molecules/AttendanceDashboard'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { generateSchoolDayDates } from '@/server/utils/server-helpers'

interface AttendancePageProps {
  params: Promise<{ id: string }>
}

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { id: courseSessionId } = await params

  const courseResponse = await getCourseSessionById(courseSessionId)
  if (!courseResponse.success || !courseResponse.data) {
    return <ErrorContent message={courseResponse.message} />
  }

  const session = courseResponse.data
  const sessionScheduleDates =
    generateSchoolDayDates(session.courses_sessions_timeslot[0].day_of_week)

  return (
    <AttendanceDashboard
      courseSessionId={courseSessionId}
      courseDates={sessionScheduleDates}
    />
  )
}
