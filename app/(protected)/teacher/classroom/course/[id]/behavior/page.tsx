import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { BehaviorDashboard } from '@/client/components/molecules/BehaviorDashboard'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { generateSchoolDayDates } from '@/server/utils/server-helpers'

interface BehaviorPageProps {
  params: Promise<{ id: string }>
}

export default async function BehaviorPage({ params }: BehaviorPageProps) {
  const { id: courseSessionId } = await params

  // Récupérer le cours spécifique
  const courseResponse = await getCourseSessionById(courseSessionId)
  if (!courseResponse.success || !courseResponse.data) {
    return <ErrorContent message={courseResponse.message} />
  }

  const session = courseResponse.data
  const sessionScheduleDates =
    generateSchoolDayDates(session.courses_sessions_timeslot[0].day_of_week)

  return (
    <BehaviorDashboard
      courseId={courseSessionId}
      courseDates={sessionScheduleDates}
    />
  )
}
