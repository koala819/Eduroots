import { getCourseById } from '@/app/actions/context/courses'
import { ErrorContent } from '@/components/atoms/client/StatusContent'
import { CourseSession, User, CourseSessionTimeslot, Course, CourseTeacher, CourseSessionStudent } from '@/types/supabase/db'
import { CourseWithRelations } from '@/types/supabase/courses'
import { generateSchoolDayDates } from '@/utils/server-helpers'
import TeacherCourses from '@/components/pages/client/TeacherCourses'

interface StudentWithUser extends CourseSessionStudent {
  users: User
  mongo_student_id?: string
}

interface CourseSessionWithRelations extends CourseSession {
  courses: Course
  courses_sessions_timeslot: CourseSessionTimeslot[]
  courses_sessions_students: StudentWithUser[]
}

interface CourseDetailsPageProps {
  courseId: string
  courseDates: Date[]
  selectedSession: CourseSessionWithRelations
  teacherCourses: CourseWithRelations[]
}

type Params = Promise<{ id: string }>

export default async function CoursePage({ params }: { params: Params }) {
  const { id: courseId } = await params

  const response = await getCourseById(courseId)

  if (!response.success) {
    return <ErrorContent message={response.message || 'Erreur lors du chargement du cours'} />
  }

  const session = response.data as CourseSessionWithRelations

  if (!session) {
    return <ErrorContent message="Session de cours introuvable" />
  }

  const courseDates = generateSchoolDayDates(session.courses_sessions_timeslot?.[0]?.day_of_week)

  // Convertir le cours en CourseWithRelations
  const courseWithRelations: CourseWithRelations = {
    ...session.courses,
    courses_teacher: [],
    courses_sessions: [session]
  }

  return (
    <TeacherCourses
      courseId={courseId}
      selectedSession={session}
      courseDates={courseDates}
      teacherCourses={[courseWithRelations]}
    />
  )
}
