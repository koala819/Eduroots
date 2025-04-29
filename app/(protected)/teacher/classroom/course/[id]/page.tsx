import {PopulatedCourse} from '@/types/course'

import {ErrorComponent} from '@/components/atoms/client/ErrorComponent'
import {CourseDetails} from '@/components/organisms/client/CourseDetails'

import {getCourseById} from '@/app/actions/context/courses'
import {generateWeeklyDates} from '@/lib/utils'

export const metadata = {
  title: 'Détail du cours',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/teacher/classroom/course/[id]`,
  },
}
export default async function CoursePage({params}: {params: {id: string}}) {
  const courseId = params.id

  try {
    const response = await getCourseById(courseId)

    if (!response.success) {
      return <ErrorComponent message={response.message || 'Erreur lors du chargement du cours'} />
    }

    const courseData = response.data as unknown as PopulatedCourse

    const selectedSession = courseData.sessions.find((session) => session.id === courseId)

    if (!selectedSession) {
      return <ErrorComponent message="Session de cours introuvable" />
    }

    const courseDates = generateWeeklyDates(selectedSession.timeSlot.dayOfWeek)

    const sortedStudents = [...selectedSession.students].sort((a, b) =>
      `${a.lastname} ${a.firstname}`.localeCompare(`${b.lastname} ${b.firstname}`),
    )

    return (
      <CourseDetails
        courseId={courseId}
        selectedSession={selectedSession}
        courseDates={courseDates}
        sortedStudents={sortedStudents}
        teacherCourses={courseData}
      />
    )
  } catch (error) {
    console.error('Error loading course:', error)
    return <ErrorComponent message="Une erreur s'est produite lors du chargement du cours" />
  }
}
