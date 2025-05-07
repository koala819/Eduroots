import {Course, CourseSession, TimeSlotEnum} from '@/types/course'

import {getTeacherCourses} from '@/app/actions/context/courses'
import {serializeData} from '@/lib/serialization'
import {create} from 'zustand'

function compareTimeSlots(a: CourseSession, b: CourseSession) {
  const timeSlotOrder = {
    [TimeSlotEnum.SATURDAY_MORNING]: 0,
    [TimeSlotEnum.SATURDAY_AFTERNOON]: 1,
    [TimeSlotEnum.SUNDAY_MORNING]: 2,
  }

  return timeSlotOrder[a.timeSlot.dayOfWeek] - timeSlotOrder[b.timeSlot.dayOfWeek]
}

interface CourseState {
  courses: Course[]
  fetchTeacherCourses: (teacherId: string) => Promise<void>
}

const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  fetchTeacherCourses: async (teacherId: string) => {
    try {
      const response = await getTeacherCourses(teacherId)
      if (response.success && Array.isArray(response.data)) {
        const courses = response.data
          .map((item) => {
            const serializedItem = serializeData(item)
            if (
              serializedItem &&
              typeof serializedItem === 'object' &&
              'sessions' in serializedItem &&
              Array.isArray(serializedItem.sessions)
            ) {
              return {
                ...serializedItem,
                sessions: (serializedItem.sessions as unknown as CourseSession[]).sort(
                  compareTimeSlots,
                ),
              } as Course
            }
            return null
          })
          .filter((course): course is Course => course !== null)
        set({courses})
      } else {
        console.error('Erreur lors de la récupération des cours du professeur:', response.message)
      }
    } catch (error) {
      console.error('Failed to fetch teacher courses:', error)
    }
  },
}))

export default useCourseStore
