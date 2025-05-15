import {
  Course,
  CourseSession,
  PopulatedCourse,
  TimeSlotEnum,
} from '@/types/course'

import { getTeacherCourses } from '@/app/actions/context/courses'
import { serializeData } from '@/lib/serialization'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function compareTimeSlots(a: CourseSession, b: CourseSession) {
  const timeSlotOrder = {
    [TimeSlotEnum.SATURDAY_MORNING]: 0,
    [TimeSlotEnum.SATURDAY_AFTERNOON]: 1,
    [TimeSlotEnum.SUNDAY_MORNING]: 2,
  }

  return (
    timeSlotOrder[a.timeSlot.dayOfWeek] - timeSlotOrder[b.timeSlot.dayOfWeek]
  )
}

// Fonction pour convertir PopulatedCourse en Course
const adaptPopulatedCourse = (populatedCourse: PopulatedCourse): Course => {
  return {
    ...populatedCourse,
    teacher: [populatedCourse.teacher._id],
  }
}

interface CourseState {
  courses: Course[]
  lastFetch: number | null
  fetchTeacherCourses: (teacherId: string) => Promise<void>
}

const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      courses: [],
      lastFetch: null,
      fetchTeacherCourses: async (teacherId: string) => {
        try {
          // Vérifier si les données sont récentes (moins de 5 minutes)
          const now = Date.now()
          const lastFetch = useCourseStore.getState().lastFetch
          if (lastFetch && now - lastFetch < 5 * 60 * 1000) {
            return // Utiliser les données en cache
          }

          const response = await getTeacherCourses(teacherId)
          if (response.success && Array.isArray(response.data)) {
            const serializedData = serializeData(response.data)
            if (Array.isArray(serializedData)) {
              const courses = serializedData
                .map((item) => {
                  if (
                    item &&
                    typeof item === 'object' &&
                    'teacher' in item &&
                    'sessions' in item &&
                    Array.isArray(item.sessions)
                  ) {
                    const populatedCourse = item as unknown as PopulatedCourse
                    const adaptedCourse = adaptPopulatedCourse(populatedCourse)
                    return {
                      ...adaptedCourse,
                      sessions: adaptedCourse.sessions.sort(compareTimeSlots),
                    }
                  }
                  return null
                })
                .filter((course): course is Course => course !== null)
              set({ courses, lastFetch: now })
            }
          } else {
            console.error(
              'Erreur lors de la récupération des cours du professeur:',
              response.message,
            )
          }
        } catch (error) {
          console.error('Failed to fetch teacher courses:', error)
          throw error
        }
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
