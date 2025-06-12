'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

import { Course, PopulatedCourse } from '@/types/course'

import { ErrorComponent } from '@/components/atoms/client/ErrorComponent'
import { CourseDetails } from '@/components/organisms/client/CourseDetails'

import { getCourseById } from '@/app/actions/context/courses'
import useCourseStore from '@/stores/useCourseStore'
import { Student } from '@/types/user'

type CourseDetailsPageProps = {
    courseId: string
    courseDates: Date[]
    sortedStudents: Student[]
}

export const TeacherCourses = ({
  courseId,
  courseDates,
  sortedStudents,
}: CourseDetailsPageProps) => {

  const [user, setUser] = useState<any>(null)
  const { courses, fetchTeacherCourses } = useCourseStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseData, setCourseData] = useState<PopulatedCourse | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user && !error) {
        setUser(user)
      }
    }
    getUser()
    }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return

      try {
        // Charger tous les cours du professeur
        await fetchTeacherCourses(user.id)

        // Charger les détails du cours spécifique
        const response = await getCourseById(courseId)
        if (!response.success) {
          throw new Error(response.message || 'Erreur lors du chargement du cours')
        }
        setCourseData(response.data as unknown as PopulatedCourse)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur s\'est produite')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [courseId, user?.id, fetchTeacherCourses])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !courseData) {
    return <ErrorComponent message={error || 'Erreur lors du chargement du cours'} />
  }

  const selectedSession = courseData.sessions.find((session) => session.id === courseId)

  if (!selectedSession) {
    return <ErrorComponent message="Session de cours introuvable" />
  }





  // Convertir les cours du store en PopulatedCourse[]
  const populatedCourses = courses.map((course: Course) => ({
    ...course,
    _id: course.id,
    teacher: {
      _id: course.teacher[0],
      id: course.teacher[0],
    },
  })) as unknown as PopulatedCourse[]

  return (
    <CourseDetails
      courseId={courseId}
      selectedSession={selectedSession}
      courseDates={courseDates}
      sortedStudents={sortedStudents}
      teacherCourses={populatedCourses}
    />
  )
}
