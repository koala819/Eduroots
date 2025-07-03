'use server'

import { CoursesProvider } from '@/client/context/courses'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { Database } from '@/types/db'

type CourseWithRelations = Database['education']['Tables']['courses']['Row'] & {
  courses_teacher: (Database['education']['Tables']['courses_teacher']['Row'] & {
    users: Database['education']['Tables']['users']['Row']
  })[]
  courses_sessions: (Database['education']['Tables']['courses_sessions']['Row'] & {
    courses_sessions_students:
    (Database['education']['Tables']['courses_sessions_students']['Row'] & {
      users: Database['education']['Tables']['users']['Row']
    })[]
    courses_sessions_timeslot: Database['education']['Tables']['courses_sessions_timeslot']['Row'][]
  })[]
}

interface CoursesServerComponentProps {
  children: React.ReactNode
  courseId?: string
}

export default async function CourseServerComponent({
  children,
  courseId,
}: Readonly <CoursesServerComponentProps>) {
  // Si un courseId est fourni, on pré-charge les données pour ce cours
  let initialCourseData: CourseWithRelations[] | null = null

  if (courseId) {
    try {
      // Récupération des données
      const response = await getCourseSessionById(courseId)

      if (response.success && response.data) {
        // Vérifier si data est un tableau et le convertir explicitement en CourseWithRelations[]
        const courseData = response.data as unknown as CourseWithRelations
        // Toujours stocker comme un tableau pour maintenir la cohérence avec le provider
        initialCourseData = [courseData]
      }
    } catch (error) {
      console.error('Error pre-loading course data:', error)
      // In case of error, we'll let the client component handle loading
      initialCourseData = null
    }
  }

  return <CoursesProvider initialCourseData={initialCourseData}>{children}</CoursesProvider>
}
