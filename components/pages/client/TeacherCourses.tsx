'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CourseSession, User, CourseSessionTimeslot, Course, CourseTeacher, CourseSessionStudent } from '@/types/supabase/db'
import { CourseWithRelations } from '@/types/supabase/courses'
import { ErrorContent } from '@/components/atoms/client/StatusContent'
import { CourseDetails } from '@/components/organisms/client/CourseDetails'
import useCourseStore from '@/stores/useCourseStore'

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

export default function TeacherCourses({
  courseId,
  courseDates,
  selectedSession,
  teacherCourses,
}: CourseDetailsPageProps) {
  const [user, setUser] = useState<any>(null)
  const { courses, fetchTeacherCourses } = useCourseStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sortedStudents = useMemo<User[]>(() => {
    if (!selectedSession?.courses_sessions_students) return []

    return selectedSession.courses_sessions_students
      .filter(student => student.users) // On ne garde que les étudiants avec des données utilisateur
      .map(student => student.users)
      .sort((a, b) => {
        if (!a.lastname || !b.lastname) return 0
        return a.lastname.localeCompare(b.lastname)
      })
  }, [selectedSession])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Error fetching user:', error)
          return
        }

        setUser(user)
      } catch (error) {
        console.error('Error in fetchUser:', error)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const loadTeacherCourses = async () => {
      if (!user) return

      try {
        await fetchTeacherCourses(user.id)
      } catch (error) {
        console.error('Error loading teacher courses:', error)
        setError('Failed to load teacher courses')
      } finally {
        setIsLoading(false)
      }
    }

    loadTeacherCourses()
  }, [user, fetchTeacherCourses])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <CourseDetails
      courseId={courseId}
      selectedSession={selectedSession}
      courseDates={courseDates}
      sortedStudents={sortedStudents}
      teacherCourses={teacherCourses}
    />
  )
}
