import { getCourseSessionById } from '@/server/actions/context/courses'
import { ErrorContent } from '@/client//components/atoms/StatusContent'
import { generateSchoolDayDates } from '@/server/utils/server-helpers'
import TeacherCourses from '@/client//components/pages/TeacherCourses'

type Params = Promise<{ id: string }>

export default async function CoursePage({ params }: { params: Params }) {
  const { id: courseSessionId } = await params

  // Récupérer le cours spécifique
  const courseResponse = await getCourseSessionById(courseSessionId)
  if (!courseResponse.success || !courseResponse.data) {
    return <ErrorContent message={courseResponse.message} />
  }

  const session = courseResponse.data
  const sessionScheduleDates = generateSchoolDayDates(session.courses_sessions_timeslot[0].day_of_week)

  return (
    <TeacherCourses
      courseSessionId={courseSessionId}
      selectedSession={session}
      sessionScheduleDates={sessionScheduleDates}
    />
  )
}
