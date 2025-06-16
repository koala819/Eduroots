import { createClient } from '@/client/utils/supabase'
import { TeacherCourseResponse } from '@/types/db'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getTeacherCourses } from '@/server/actions/api/courses'
import { CourseWithRelations } from '@/types/courses'

interface CourseState {
  courses: TeacherCourseResponse[]
  lastFetch: number | null
  fetchTeacherCourses: (teacherId: string) => Promise<void>
  subscribeToCourses: (teacherId: string) => RealtimeChannel
}

// Fonctions utilitaires extraites pour réduire l'imbrication
const findCourseIndex = (courses: TeacherCourseResponse[], courseId: string): number => {
  return courses.findIndex((c) => c.course_id === courseId)
}

const updateCourseInList = (
  courses: TeacherCourseResponse[],
  updatedCourse: TeacherCourseResponse,
): TeacherCourseResponse[] => {
  const courseIndex = findCourseIndex(courses, updatedCourse.course_id)
  if (courseIndex === -1) return courses

  const newCourses = [...courses]
  newCourses[courseIndex] = updatedCourse
  return newCourses
}

const removeCourseFromList = (
  courses: TeacherCourseResponse[],
  courseId: string,
): TeacherCourseResponse[] => {
  return courses.filter((c) => c.course_id !== courseId)
}

const transformToTeacherCourseResponse = (course: CourseWithRelations): TeacherCourseResponse => {
  return {
    course_id: course.id,
    teacher_id: course.courses_teacher[0]?.teacher_id,
    created_at: course.created_at?.toISOString(),
    courses: [{
      id: course.id,
      is_active: course.is_active,
      courses_sessions: course.courses_sessions.map((session) => ({
        id: session.id,
        subject: session.subject,
        level: session.level,
        courses_sessions_timeslot: session.courses_sessions_timeslot,
      })),
    }],
  }
}

const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      courses: [],
      lastFetch: null,
      fetchTeacherCourses: async (teacherId: string) => {
        try {
          // Vérification du cache (5 minutes)
          const now = Date.now()
          const lastFetch = useCourseStore.getState().lastFetch
          if (lastFetch && now - lastFetch < 5 * 60 * 1000) {
            return // Utiliser les données en cache
          }

          const response = await getTeacherCourses(teacherId)
          if (response.success && response.data) {
            const transformedCourses = response.data.map(transformToTeacherCourseResponse)
            set({
              courses: transformedCourses,
              lastFetch: now,
            })
          } else {
            console.error('Erreur lors de la récupération des cours:', response.message)
          }
        } catch (error) {
          console.error('Failed to fetch teacher courses:', error)
          throw error
        }
      },
      subscribeToCourses: (teacherId: string) => {
        const supabase = createClient()

        const handleCourseChange = (payload: any) => {
          set((state) => {
            const currentCourses = [...state.courses]
            let updatedCourses: TeacherCourseResponse[]

            if (payload.eventType === 'INSERT') {
              updatedCourses = [...currentCourses, payload.new as TeacherCourseResponse]
            } else if (payload.eventType === 'UPDATE') {
              updatedCourses = updateCourseInList(
                currentCourses,
                payload.new as TeacherCourseResponse,
              )
            } else if (payload.eventType === 'DELETE') {
              updatedCourses = removeCourseFromList(currentCourses, payload.old.id)
            } else {
              updatedCourses = currentCourses
            }

            return { courses: updatedCourses }
          })
        }

        return supabase
          .channel('courses_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'education',
              table: 'courses',
              filter: `teacher_id=eq.${teacherId}`,
            },
            handleCourseChange,
          )
          .subscribe()
      },
    }),
    {
      name: 'course-storage',
      partialize: (state) => ({
        courses: state.courses,
        lastFetch: state.lastFetch,
      }),
    },
  ),
)

export default useCourseStore
