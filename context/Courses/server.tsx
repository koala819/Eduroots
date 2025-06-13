'use server'

import {PopulatedCourse} from '@/types/mongo/course'

import {getCourseById} from '@/app/actions/context/courses'
import {CoursesProvider} from '@/context/Courses/client'

interface CoursesServerComponentProps {
  children: React.ReactNode
  courseId?: string
}

export default async function CourseServerComponent({
  children,
  courseId,
}: CoursesServerComponentProps) {
  // Si un courseId est fourni, on pré-charge les données pour ce cours
  let initialCourseData: PopulatedCourse[] | null = null

  if (courseId) {
    try {
      // Récupération des données
      const response = await getCourseById(courseId)

      if (response.success && response.data) {
        // Vérifier si data est un tableau et le convertir explicitement en CourseDocument[]
        const courseData = response.data as unknown as PopulatedCourse
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
