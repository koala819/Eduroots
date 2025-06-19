'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'

import { useToast } from '@/client/hooks/use-toast'
import useCourseStore from '@/client/stores/useCourseStore'
import { createClient } from '@/client/utils/supabase'
import {
  addStudentToCourse as addStudentToCourseAction,
  checkTimeSlotOverlap as checkTimeSlotOverlapAction,
  createCourse as createCourseAction,
  deleteCourse as deleteCourseAction,
  getCourseSessionById as getCourseByIdAction,
  getStudentCourses as getStudentCoursesAction,
  removeStudentFromCourse as removeStudentFromCourseAction,
  updateCourse as updateCourseAction,
  updateCourses as updateCoursesAction,
  updateCourseSession as updateCourseSessionAction,
} from '@/server/actions/api/courses'
import { getAuthUser } from '@/server/actions/auth'
import { TimeSlotEnum } from '@/types/courses'
import { Database } from '@/types/db'

type CourseWithRelations = Database['education']['Tables']['courses']['Row'] & {
  courses_teacher: (Database['education']['Tables']['courses_teacher']['Row'] & {
    users: Database['education']['Tables']['users']['Row']
  })[]
  courses_sessions: (Database['education']['Tables']['courses_sessions']['Row'] & {
    courses_sessions_students: (Database['education']['Tables']['courses_sessions_students']['Row']
      & { users: Database['education']['Tables']['users']['Row'] })[]
    courses_sessions_timeslot: Database['education']['Tables']['courses_sessions_timeslot']['Row'][]
  })[]
}

interface CourseState {
  courses: CourseWithRelations[]
  teacherCourses: CourseWithRelations | null
  isLoading: boolean
  isLoadingCourse: boolean
  error: string | null
}

type CourseAction =
  | {type: 'SET_LOADING_COURSE'; payload: boolean}
  | {type: 'ADD_COURSE'; payload: CourseWithRelations}
  | {
      type: 'ADD_STUDENT_TO_COURSE'
      payload: {courseId: string; course: CourseWithRelations}
    }
  | {type: 'DELETE_COURSE'; payload: string}
  | {
      type: 'REMOVE_STUDENT_FROM_COURSE'
      payload: {courseId: string; course: CourseWithRelations}
    }
  | {type: 'SET_COURSES'; payload: CourseWithRelations[]}
  | {type: 'SET_TEACHER_COURSES'; payload: CourseWithRelations}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'UPDATE_COURSE'; payload: CourseWithRelations}

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

const getInitialState = (initialData: CourseWithRelations[] | null): CourseState => ({
  courses: (initialData as CourseWithRelations[]) || [],
  teacherCourses: null,
  isLoading: initialData ? false : true,
  isLoadingCourse: initialData ? false : true,
  error: null,
})

type CourseSession = Database['education']['Tables']['courses_sessions']['Row'] & {
  courses_sessions_students: (Database['education']['Tables']['courses_sessions_students']['Row']
    & { users: Database['education']['Tables']['users']['Row'] })[]
  courses_sessions_timeslot: Database['education']['Tables']['courses_sessions_timeslot']['Row'][]
}

interface CourseContextType extends CourseState {
  addStudentToCourse: (
    courseId: string,
    studentId: string,
    timeSlot: Pick<Database['education']['Tables']['courses_sessions_timeslot']['Row'],
    'day_of_week' | 'start_time' | 'end_time'> & { subject: string },
  ) => Promise<CourseWithRelations>
  checkTimeSlotOverlap: (
    timeSlot: Pick<Database['education']['Tables']['courses_sessions_timeslot']['Row'],
    'day_of_week' | 'start_time' | 'end_time'>,
    userId: string,
    excludeCourseId?: string,
  ) => Promise<boolean>
  createCourse: (
    courseData: Omit<Database['education']['Tables']['courses']['Insert'],
      'id' | 'created_at' | 'updated_at'> & {
      teacherIds: string[]
      sessions: Array<{
        subject: string
        level: string
        timeSlots: Array<{
          day_of_week: TimeSlotEnum
          start_time: string
          end_time: string
          classroom_number: string | null
        }>
      }>
    },
  ) => Promise<CourseWithRelations>
  deleteCourse: (courseId: string) => Promise<CourseWithRelations>
  getCoursesByTimeSlot: (
    timeSlot: Pick<Database['education']['Tables']['courses_sessions_timeslot']['Row'],
    'day_of_week' | 'start_time' | 'end_time'>
  ) => CourseWithRelations[]
  getStudentCourses: (studentId: string) => Promise<CourseWithRelations[]>
  fetchTeacherCourses: (teacherId: string) => Promise<void>
  getCourseSessionById: (courseId: string) => Promise<CourseWithRelations | null>
  getCourseByIdForStudent: (courseId: string) => Promise<CourseWithRelations | null>
  removeStudentFromCourse: (courseId: string, studentId: string) => Promise<void>
  updateCourse: (
    courseData: Omit<CourseWithRelations, 'students' | 'stats'>,
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
  initialCourseData?: CourseWithRelations[] | null
}) => {
  const { toast } = useToast()
  const [state, dispatch] = useReducer(courseReducer, getInitialState(initialCourseData))

  // État Supabase
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  const { fetchTeacherCourses } = useCourseStore()

  // Effet pour gérer l'authentification Supabase
  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (user && !error) {
          setUser(user)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setAuthLoading(false)
      }
    }

    getUser()

    // Écouter les changements d'authentification
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Course Error:', error)
      const errorMessage = customMessage || error.message
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMessage,
        duration: 5000,
      })
    },
    [toast],
  )

  const getCourseSessionById = useCallback(
    async (id: string): Promise<CourseWithRelations | null> => {
      if (!isAuthenticated || !user) {
        return null
      }

      dispatch({ type: 'SET_LOADING_COURSE', payload: true })
      try {
        const authResponse = await getAuthUser(user.id)

        if (!authResponse.success || !authResponse.data) {
          throw new Error(authResponse.message || 'Erreur d\'authentification')
        }

        const response = await getCourseByIdAction(id)

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch course data')
        }

        return response.data as CourseWithRelations | null
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération du cours')
        return null
      } finally {
        dispatch({ type: 'SET_LOADING_COURSE', payload: false })
      }
    },
    [handleError, user, isAuthenticated],
  )

  const getCourseByIdForStudent = useCallback(
    async (id: string) => {
      if (!isAuthenticated || !user) {
        return null
      }

      try {
        const authResponse = await getAuthUser(user.id)

        if (!authResponse.success || !authResponse.data) {
          throw new Error(authResponse.message || 'Erreur d\'authentification')
        }

        const response = await getCourseByIdAction(id)

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch course data')
        }

        return response.data as CourseWithRelations | null
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération du cours')
        return null
      }
    },
    [handleError, user, isAuthenticated],
  )

  const addStudentToCourse = useCallback(
    async (
      courseId: string,
      studentId: string,
      timeSlot: Pick<Database['education']['Tables']['courses_sessions_timeslot']['Row'],
        'day_of_week' | 'start_time' | 'end_time'> & { subject: string },
    ): Promise<CourseWithRelations> => {
      if (!isAuthenticated || !user) {
        throw new Error('Non authentifié')
      }

      try {
        const authResponse = await getAuthUser(user.id)

        if (!authResponse.success || !authResponse.data) {
          throw new Error(authResponse.message || 'Erreur d\'authentification')
        }

        const response = await addStudentToCourseAction(courseId, studentId, timeSlot)

        if (!response.success) {
          throw new Error(response.message || 'Failed to add student to course')
        }

        const courseData = response.data as CourseWithRelations

        dispatch({
          type: 'ADD_STUDENT_TO_COURSE',
          payload: { courseId, course: courseData },
        })

        return courseData
      } catch (error) {
        handleError(error as Error, 'Erreur lors de l\'ajout de l\'étudiant')
        throw error
      }
    },
    [handleError, user, isAuthenticated],
  )

  const checkTimeSlotOverlap = useCallback(
    async (
      timeSlot: Pick<Database['education']['Tables']['courses_sessions_timeslot']['Row'],
        'day_of_week' | 'start_time' | 'end_time'>,
      userId: string,
      excludeCourseId?: string,
    ): Promise<boolean> => {
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
    async (studentId: string): Promise<CourseWithRelations[]> => {
      try {
        const response = await getStudentCoursesAction(studentId)

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch student courses')
        }

        return response.data as unknown as CourseWithRelations[]
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération des cours de l\'étudiant')
        return []
      }
    },
    [handleError],
  )

  const createCourse = useCallback(
    async (
      courseData: Omit<Database['education']['Tables']['courses']['Insert'],
        'id' | 'created_at' | 'updated_at'> & {
        teacherIds: string[]
        sessions: Array<{
          subject: string
          level: string
          timeSlots: Array<{
            day_of_week: TimeSlotEnum
            start_time: string
            end_time: string
            classroom_number: string | null
          }>
        }>
      },
    ): Promise<CourseWithRelations> => {
      if (!isAuthenticated || !user) {
        throw new Error('Non authentifié')
      }

      try {
        const authResponse = await getAuthUser(user.id)

        if (!authResponse.success || !authResponse.data) {
          throw new Error(authResponse.message || 'Erreur d\'authentification')
        }

        const response = await createCourseAction(courseData)

        if (!response.success) {
          throw new Error(response.message || 'Failed to create course')
        }

        const newCourse = response.data as CourseWithRelations

        dispatch({ type: 'ADD_COURSE', payload: newCourse })

        toast({
          title: 'Succès',
          variant: 'success',
          description: 'Cours créé avec succès',
          duration: 3000,
        })

        return newCourse
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors de la création du cours'
        handleError(new Error(errorMessage))
        throw error
      }
    },
    [handleError, toast, user, isAuthenticated],
  )

  const deleteCourse = useCallback(
    async (courseId: string): Promise<CourseWithRelations> => {
      try {
        const response = await deleteCourseAction(courseId)

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete course')
        }

        const deletedCourse = response.data as unknown as CourseWithRelations

        dispatch({ type: 'DELETE_COURSE', payload: courseId })

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
    (timeSlot: Pick<Database['education']['Tables']['courses_sessions_timeslot']['Row'],
      'day_of_week' | 'start_time' | 'end_time'>): CourseWithRelations[] => {
      return state.courses.filter((course) =>
        course.courses_sessions.some(
          (session) =>
            session.courses_sessions_timeslot.some(
              (timeslot) =>
                timeslot.day_of_week === timeSlot.day_of_week &&
                timeslot.start_time < timeSlot.end_time &&
                timeslot.end_time > timeSlot.start_time,
            ),
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

        const courseData = response.data as unknown as CourseWithRelations

        dispatch({
          type: 'REMOVE_STUDENT_FROM_COURSE',
          payload: { courseId, course: courseData },
        })

        toast({
          title: 'Succès',
          variant: 'success',
          description: 'Étudiant retiré du cours avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors du retrait de l\'étudiant')
      }
    },
    [handleError, toast],
  )

  const updateCourse = useCallback(
    async (
      courseData: Omit<CourseWithRelations, 'students' | 'stats'>,
    ): Promise<void> => {
      if (!isAuthenticated || !user) {
        throw new Error('Non authentifié')
      }

      try {
        const authResponse = await getAuthUser(user.id)

        if (!authResponse.success || !authResponse.data) {
          throw new Error(authResponse.message || 'Erreur d\'authentification')
        }

        const response = await updateCourseAction({
          sessions: courseData.courses_sessions.map((session) => ({
            id: session.id,
            subject: session.subject,
            level: session.level,
            timeSlot: session.courses_sessions_timeslot[0] ? {
              day_of_week: session.courses_sessions_timeslot[0].day_of_week,
              start_time: session.courses_sessions_timeslot[0].start_time,
              end_time: session.courses_sessions_timeslot[0].end_time,
              classroom_number: session.courses_sessions_timeslot[0].classroom_number,
            } : {
              day_of_week: TimeSlotEnum.SATURDAY_MORNING,
              start_time: '09:00',
              end_time: '10:00',
              classroom_number: null,
            },
          })),
        })

        if (!response.success) {
          throw new Error(response.message || 'Failed to update course')
        }

        const updatedCourse = response.data as CourseWithRelations

        dispatch({ type: 'UPDATE_COURSE', payload: updatedCourse })

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
    [handleError, toast, user, isAuthenticated],
  )

  const updateCourses = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    try {

      const authResponse = await getAuthUser(user.id)

      if (!authResponse.success || !authResponse.data) {
        throw new Error(authResponse.message || 'Erreur d\'authentification')
      }

      const { educationUserId, role } = authResponse.data

      const response = await updateCoursesAction(role, educationUserId)

      if (!response.success) {
        throw new Error(response.message || 'Failed to update courses')
      }

      dispatch({ type: 'SET_COURSES', payload: response.data as CourseWithRelations[] })
    } catch (error) {
      handleError(error as Error, 'Erreur lors de la mise à jour des cours')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ type: 'SET_LOADING_COURSE', payload: false })
    }
  }, [handleError, user, isAuthenticated])

  const updateCourseSession = useCallback(
    async (
      courseId: string,
      sessionIndex: number,
      sessionData: Partial<CourseSession>,
    ): Promise<void> => {
      if (!isAuthenticated || !user) {
        console.log('Cannot update course session - not authenticated')
        return
      }

      try {
        const userRole = user.user_metadata?.role
        const userId = user.id

        const response = await updateCourseSessionAction(
          courseId,
          sessionIndex,
          sessionData,
          userRole,
          userId,
        )

        if (!response.success) {
          throw new Error(response.message || 'Failed to update course session')
        }

        const courseData = response.data as unknown as CourseWithRelations

        dispatch({ type: 'UPDATE_COURSE', payload: courseData })

        toast({
          title: 'Succès',
          description: 'Session mise à jour avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la mise à jour de la session')
      }
    },
    [handleError, toast, user, isAuthenticated],
  )

  // Effect for initializing data
  useEffect(() => {
    // If we already have initial course data, no need to load again
    if (initialCourseData) {
      console.log('Using initial course data, skipping fetch')
      return
    }

    // Only load when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated && user) {
      updateCourses().catch((err) => console.error('Failed to load initial courses data:', err))
      fetchTeacherCourses(user.id)
    } else if (authLoading) {
      // console.log('Auth session is still loading')
    }
  }, [initialCourseData, user, isAuthenticated, authLoading, fetchTeacherCourses, updateCourses])

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
      getCourseSessionById,
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
      getCourseSessionById,
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
