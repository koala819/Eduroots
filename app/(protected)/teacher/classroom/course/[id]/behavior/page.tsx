import { Suspense } from 'react'

import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { BehaviorDashboard } from '@/client/components/pages/BehaviorDashboard'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { generateSchoolDayDates } from '@/server/utils/server-helpers'

interface BehaviorPageProps {
  params: Promise<{ id: string }>
}

export default async function BehaviorPage({ params }: BehaviorPageProps) {
  const { id: courseSessionId } = await params

  try {
    const user = await getAuthenticatedUser()

    const courseResponse = await getCourseSessionById(courseSessionId)
    if (!courseResponse.success || !courseResponse.data) {
      return <ErrorContent message={courseResponse.message} />
    }

    const session = courseResponse.data
    const sessionScheduleDates =
      generateSchoolDayDates(session.courses_sessions_timeslot[0].day_of_week)

    return (
      <Suspense fallback={<LoadingContent />}>
        <BehaviorDashboard
          courseId={courseSessionId}
          courseDates={sessionScheduleDates}
          userId={user.id}
        />
      </Suspense>
    )
  } catch (error) {
    return <ErrorContent message={`Erreur d'authentification: ${error}`} />
  }
}
