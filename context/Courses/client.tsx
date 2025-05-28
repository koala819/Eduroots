'use client'

import {useSession} from 'next-auth/react'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'

import {useToast} from '@/hooks/use-toast'

import {CourseSession, PopulatedCourse, TimeSlot} from '@/types/course'

import useCourseStore from '@/stores/useCourseStore'

import {
  addStudentToCourse as addStudentToCourseAction,
  checkTimeSlotOverlap as checkTimeSlotOverlapAction,
  createCourse as createCourseAction,
  deleteCourse as deleteCourseAction,
  getCourseById as getCourseByIdAction,
  getStudentCourses as getStudentCoursesAction,
  removeStudentFromCourse as removeStudentFromCourseAction,
  updateCourse as updateCourseAction,
  updateCourseSession as updateCourseSessionAction,
  updateCourses as updateCoursesAction,
} from '@/app/actions/context/courses'

interface CourseState {
  courses: PopulatedCourse[]
  teacherCourses: PopulatedCourse | null
  isLoading: boolean
  isLoadingCourse: boolean
  error: string | null
}

type CourseAction =
  | {type: 'SET_LOADING_COURSE'; payload: boolean}
  | {type: 'ADD_COURSE'; payload: PopulatedCourse}
  | {
      type: 'ADD_STUDENT_TO_COURSE'
      payload: {courseId: string; course: PopulatedCourse}
    }
  | {type: 'DELETE_COURSE'; payload: string}
  | {
      type: 'REMOVE_STUDENT_FROM_COURSE'
      payload: {courseId: string; course: PopulatedCourse}
    }
  | {type: 'SET_COURSES'; payload: PopulatedCourse[]}
  | {type: 'SET_TEACHER_COURSES'; payload: PopulatedCourse}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'UPDATE_COURSE'; payload: PopulatedCourse}

function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case 'SET_LOADING_COURSE':
      return {
        ...state,
        isLoadingCourse: action.payload,
      }

    case 'SET_COURSES':
      return {
        ...state,
        courses: action.payload,
      }

    case 'SET_TEACHER_COURSES':
      return {
        ...state,
        teacherCourses: action.payload || null,
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }

    case 'ADD_COURSE':
      return {
        ...state,
        courses: [...state.courses, action.payload],
      }

    case 'UPDATE_COURSE':
      if (!state.courses) return state // Protection contre undefined
      return {
        ...state,
        courses: state.courses
          .map((course) => (course?.id === action?.payload?.id ? action.payload : course))
          .filter(Boolean), // Filtrer les valeurs null/undefined
        teacherCourses:
          state.teacherCourses?.id === action?.payload?.id ? action.payload : state.teacherCourses,
      }

    case 'DELETE_COURSE':
      return {
        ...state,
        courses: state.courses.filter((course) => course.id !== action.payload),
      }

    case 'ADD_STUDENT_TO_COURSE':
    case 'REMOVE_STUDENT_FROM_COURSE':
      if (!state.courses) return state // Protection contre undefined
      return {
        ...state,
        courses: state.courses
          .map((course) =>
            course?.id === action.payload?.courseId ? action.payload.course : course,
          )
          .filter(Boolean),
        teacherCourses:
          state.teacherCourses?.id === action.payload?.courseId
            ? action.payload.course
            : state.teacherCourses,
      }

    default:
      return state
  }
}

const getInitialState = (initialData: PopulatedCourse[] | null): CourseState => ({
  courses: (initialData as PopulatedCourse[]) || [],
  teacherCourses: null,
  isLoading: initialData ? false : true,
  isLoadingCourse: initialData ? false : true,
  error: null,
})

interface CourseContextType extends CourseState {
  addStudentToCourse: (
    courseId: string,
    studentId: string,
    timeSlot: {
      dayOfWeek: string
      startTime: string
      endTime: string
      subject: string
    },
  ) => Promise<PopulatedCourse>
  checkTimeSlotOverlap: (
    timeSlot: TimeSlot,
    userId: string,
    excludeCourseId?: string,
  ) => Promise<boolean>
  createCourse: (
    courseData: Omit<PopulatedCourse, 'id' | '_id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<PopulatedCourse>
  deleteCourse: (courseId: string) => Promise<PopulatedCourse>
  getCoursesByTimeSlot: (timeSlot: TimeSlot) => PopulatedCourse[]
  getStudentCourses: (studentId: string) => Promise<PopulatedCourse[]>
  fetchTeacherCourses: (teacherId: string) => Promise<void>
  getCourseById: (courseId: string) => Promise<PopulatedCourse | null>
  getCourseByIdForStudent: (courseId: string) => Promise<PopulatedCourse | null>
  removeStudentFromCourse: (courseId: string, studentId: string) => Promise<void>
  updateCourse: (
    courseId: string,
    courseData: Omit<PopulatedCourse, 'students' | 'stats'>,
    sameStudents: boolean,
  ) => Promise<void>
  updateCourses: () => Promise<void>
  updateCourseSession: (
    courseId: string,
    sessionIndex: number,
    sessionData: Partial<CourseSession>,
  ) => Promise<void>
}

const CoursesContext = createContext<CourseContextType | null>(null)

export const CoursesProvider = ({
  children,
  initialCourseData = null,
}: {
  children: ReactNode
  initialCourseData?: PopulatedCourse[] | null
}) => {
  const {toast} = useToast()
  const [state, dispatch] = useReducer(courseReducer, getInitialState(initialCourseData))
  const {data: session, status} = useSession()
  const {fetchTeacherCourses} = useCourseStore()

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Course Error:', error)
      const errorMessage = customMessage || error.message
      dispatch({type: 'SET_ERROR', payload: errorMessage})
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMessage,
        duration: 5000,
      })
    },
    [toast],
  )

  const getCourseById = useCallback(
    async (id: string): Promise<PopulatedCourse | null> => {
      dispatch({type: 'SET_LOADING_COURSE', payload: true})
      try {
        const response = await getCourseByIdAction(id)

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch course data')
        }

        return response.data as PopulatedCourse | null
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération du cours')
        return null
      } finally {
        dispatch({type: 'SET_LOADING_COURSE', payload: false})
      }
    },
    [handleError],
  )

  const getCourseByIdForStudent = useCallback(
    async (id: string) => {
      try {
        const response = await getCourseByIdAction(id)

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch course data')
        }

        return response.data as PopulatedCourse | null
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération du cours')
        return null
      }
    },
    [handleError],
  )

  const addStudentToCourse = useCallback(
    async (
      courseId: string,
      studentId: string,
      timeSlot: {
        dayOfWeek: string
        startTime: string
        endTime: string
        subject: string
      },
    ): Promise<PopulatedCourse> => {
      try {
        const response = await addStudentToCourseAction(courseId, studentId, timeSlot)

        if (!response.success) {
          throw new Error(response.message || 'Failed to add student to course')
        }

        const courseData = response.data as unknown as PopulatedCourse

        dispatch({
          type: 'ADD_STUDENT_TO_COURSE',
          payload: {courseId, course: courseData},
        })

        return courseData
      } catch (error) {
        handleError(error as Error, "Erreur lors de l'ajout de l'étudiant")
        throw error
      }
    },
    [handleError],
  )

  const checkTimeSlotOverlap = useCallback(
    async (timeSlot: TimeSlot, userId: string, excludeCourseId?: string): Promise<boolean> => {
      try {
        const response = await checkTimeSlotOverlapAction(timeSlot, userId, excludeCourseId)

        if (!response.success) {
          throw new Error(response.message || 'Failed to check time slot overlap')
        }

        const hasOverlap = response.data
          ? (response.data as {hasOverlap: boolean}).hasOverlap
          : false

        return hasOverlap
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la vérification du créneau')
        return false
      }
    },
    [handleError],
  )

  const getStudentCourses = useCallback(
    async (studentId: string): Promise<PopulatedCourse[]> => {
      try {
        const response = await getStudentCoursesAction(studentId)

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch student courses')
        }

        return response.data as unknown as PopulatedCourse[]
      } catch (error) {
        handleError(error as Error, "Erreur lors de la récupération des cours de l'étudiant")
        return []
      }
    },
    [handleError],
  )

  const createCourse = useCallback(
    async (
      courseData: Omit<PopulatedCourse, 'id' | '_id' | 'createdAt' | 'updatedAt'>,
    ): Promise<PopulatedCourse> => {
      try {
        const response = await createCourseAction(courseData as any)

        if (!response.success) {
          throw new Error(response.message || 'Failed to create course')
        }

        const newCourse = response.data as unknown as PopulatedCourse

        dispatch({type: 'ADD_COURSE', payload: newCourse})

        toast({
          title: 'Succès',
          description: 'Cours créé avec succès',
          duration: 3000,
        })

        return newCourse
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la création du cours')
        throw error
      }
    },
    [handleError, toast],
  )

  const deleteCourse = useCallback(
    async (courseId: string): Promise<PopulatedCourse> => {
      try {
        const response = await deleteCourseAction(courseId)

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete course')
        }

        const deletedCourse = response.data as unknown as PopulatedCourse

        dispatch({type: 'DELETE_COURSE', payload: courseId})

        toast({
          title: 'Succès',
          description: 'Cours supprimé avec succès',
          duration: 3000,
        })

        return deletedCourse
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la suppression du cours')
        throw error
      }
    },
    [handleError, toast],
  )

  const getCoursesByTimeSlot = useCallback(
    (timeSlot: TimeSlot): PopulatedCourse[] => {
      return state.courses.filter((course) =>
        course.sessions.some(
          (session) =>
            session.timeSlot.dayOfWeek === timeSlot.dayOfWeek &&
            session.timeSlot.startTime < timeSlot.endTime &&
            session.timeSlot.endTime > timeSlot.startTime,
        ),
      )
    },
    [state.courses],
  )

  const removeStudentFromCourse = useCallback(
    async (courseId: string, studentId: string): Promise<void> => {
      try {
        const response = await removeStudentFromCourseAction(courseId, studentId)

        if (!response.success) {
          throw new Error(response.message || 'Failed to remove student from course')
        }

        const courseData = response.data as unknown as PopulatedCourse

        dispatch({
          type: 'REMOVE_STUDENT_FROM_COURSE',
          payload: {courseId, course: courseData},
        })

        toast({
          title: 'Succès',
          variant: 'success',
          description: 'Étudiant retiré du cours avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error, "Erreur lors du retrait de l'étudiant")
      }
    },
    [handleError, toast],
  )

  const updateCourse = useCallback(
    async (
      courseId: string,
      courseData: Omit<PopulatedCourse, 'students' | 'stats'>,
      sameStudents: boolean,
    ): Promise<void> => {
      try {
        const response = await updateCourseAction(courseId, courseData as any, sameStudents)

        if (!response.success) {
          throw new Error(response.message || 'Failed to update course')
        }

        const updatedCourse = response.data as unknown as PopulatedCourse

        dispatch({type: 'UPDATE_COURSE', payload: updatedCourse})

        toast({
          title: 'Succès',
          variant: 'success',
          description: 'Cours mis à jour avec succès',
          duration: 3000,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors de la mise à jour du cours'
        handleError(new Error(errorMessage))
        throw error
      }
    },
    [handleError, toast],
  )

  const updateCourses = useCallback(async (): Promise<void> => {
    // Only attempt to update if we have an authenticated session
    if (status !== 'authenticated' || !session || !session.user) {
      // console.log('Skipping updateCourses - not authenticated yet')
      return
    }

    dispatch({type: 'SET_LOADING', payload: true})
    try {
      const response = await updateCoursesAction(session.user.role, session.user._id)

      if (!response.success) {
        throw new Error(response.message || 'Failed to update courses')
      }

      const courseData = response.data as unknown as PopulatedCourse[]
      // console.log('Loaded courses data:', courseData.length)
      dispatch({type: 'SET_COURSES', payload: courseData})
    } catch (error) {
      handleError(error as Error, 'Erreur lors de la mise à jour des cours')
    } finally {
      dispatch({type: 'SET_LOADING', payload: false})
      dispatch({type: 'SET_LOADING_COURSE', payload: false})
    }
  }, [handleError, session, status])

  const updateCourseSession = useCallback(
    async (
      courseId: string,
      sessionIndex: number,
      sessionData: Partial<CourseSession>,
    ): Promise<void> => {
      if (status !== 'authenticated' || !session || !session.user) {
        console.log('Cannot update course session - not authenticated')
        return
      }

      try {
        const response = await updateCourseSessionAction(
          courseId,
          sessionIndex,
          sessionData,
          session.user.role,
          session.user._id,
        )

        if (!response.success) {
          throw new Error(response.message || 'Failed to update course session')
        }

        const courseData = response.data as unknown as PopulatedCourse

        dispatch({type: 'UPDATE_COURSE', payload: courseData})

        toast({
          title: 'Succès',
          description: 'Session mise à jour avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la mise à jour de la session')
      }
    },
    [handleError, toast, session, status],
  )

  // Effect for initializing data
  useEffect(() => {
    // If we already have initial course data, no need to load again
    if (initialCourseData) {
      console.log('Using initial course data, skipping fetch')
      return
    }

    // Only load when authentication is ready
    if (status === 'authenticated' && session?.user) {
      // console.log('Session authenticated, loading courses data')
      updateCourses().catch((err) => console.error('Failed to load initial courses data:', err))
      fetchTeacherCourses(session.user.id)
    } else if (status === 'loading') {
      // console.log('Auth session is still loading')
    }
  }, [initialCourseData, session, status, fetchTeacherCourses, updateCourses])

  const value = useMemo(
    () => ({
      ...state,
      addStudentToCourse,
      checkTimeSlotOverlap,
      createCourse,
      deleteCourse,
      getCoursesByTimeSlot,
      getStudentCourses,
      fetchTeacherCourses,
      removeStudentFromCourse,
      updateCourse,
      updateCourses,
      updateCourseSession,
      getCourseById,
      getCourseByIdForStudent,
    }),
    [
      state,
      addStudentToCourse,
      checkTimeSlotOverlap,
      createCourse,
      deleteCourse,
      getCoursesByTimeSlot,
      getStudentCourses,
      fetchTeacherCourses,
      removeStudentFromCourse,
      updateCourse,
      updateCourses,
      updateCourseSession,
      getCourseById,
      getCourseByIdForStudent,
    ],
  )

  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>
}

export const useCourses = () => {
  const context = useContext(CoursesContext)
  if (!context) {
    throw new Error('useCourses must be used within a CoursesProvider')
  }
  return context
}
