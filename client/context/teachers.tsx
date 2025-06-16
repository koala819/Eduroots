'use client'

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'

import { useToast } from '@/client/hooks/use-toast'

import { GroupedStudents } from '@/types/courses'
import { TeacherResponse, CreateTeacherPayload } from '@/types/teacher-payload'
import { StudentResponse } from '@/types/student-payload'

import {
  createTeacher as createTeacherAction,
  deleteTeacher as deleteTeacherAction,
  getAllTeachers,
  getOneTeacher,
  updateTeacher as updateTeacherAction,
  getStudentsByTeacher as getStudentsByTeacherAction,
} from '@/server/actions/api/teachers'

interface TeacherState {
  teachers: TeacherResponse[]
  isLoading: boolean
  error: string | null
  students: StudentResponse[] | null
  groupedStudents: GroupedStudents[] | null
  selectedCourseId: string | null
}

interface TeachersProviderProps {
  children: ReactNode
  initialTeachersData?: TeacherResponse[] | null
}

type TeacherAction =
  | {type: 'SET_TEACHERS'; payload: TeacherResponse[]}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'ADD_TEACHER'; payload: TeacherResponse}
  | {type: 'UPDATE_TEACHER'; payload: TeacherResponse}
  | {type: 'DELETE_TEACHER'; payload: string}
  | {type: 'SET_STUDENTS'; payload: StudentResponse[]}
  | {type: 'SET_GROUPED_STUDENTS'; payload: GroupedStudents[]}
  | {type: 'SET_SELECTED_COURSE_ID'; payload: string}
  | {
      type: 'UPDATE_TEACHER_STATS'
      payload: {
        id: string
        stats: {
          studentCount: number
          courseCount: number
          attendanceRate: number
          averageStudentSuccess: number
        }
      }
    }

function teacherReducer(state: TeacherState, action: TeacherAction): TeacherState {
  switch (action.type) {
  case 'SET_SELECTED_COURSE_ID':
    return {
      ...state,
      selectedCourseId: action.payload,
    }
  case 'SET_TEACHERS':
    return {
      ...state,
      teachers: action.payload,
    }
  case 'SET_STUDENTS':
    return {
      ...state,
      students: action.payload,
    }
  case 'SET_LOADING':
    return {
      ...state,
      isLoading: action.payload,
    }
  case 'SET_ERROR':
    return { ...state, error: action.payload }
  case 'ADD_TEACHER':
    return {
      ...state,
      teachers: [...state.teachers, action.payload],
    }
  case 'UPDATE_TEACHER':
    return {
      ...state,
      teachers: state.teachers.map((teacher) =>
        teacher.id === action.payload.id ? action.payload : teacher,
      ),
    }
  case 'DELETE_TEACHER':
    return {
      ...state,
      teachers: state.teachers.filter((teacher) => teacher.id !== action.payload),
    }
  case 'SET_GROUPED_STUDENTS':
    return {
      ...state,
      groupedStudents: action.payload,
    }
  case 'UPDATE_TEACHER_STATS':
    return {
      ...state,
      teachers: state.teachers.map((teacher) =>
        teacher.id === action.payload.id ? { ...teacher, stats: action.payload.stats } : teacher,
      ),
    }
  default:
    return state
  }
}

interface TeacherContextType extends TeacherState {
  getOneTeacher: (id: string) => Promise<TeacherResponse>
  getAllTeachers: () => Promise<void>
  createTeacher: (teacherData: CreateTeacherPayload) => Promise<TeacherResponse>
  updateTeacher: (id: string, teacherData: Partial<TeacherResponse>) => Promise<void>
  deleteTeacher: (id: string) => Promise<void>
  getStudentsByTeacher: (teacherId: string) => Promise<StudentResponse[]>
  setSelectedCourseId: (id: string) => void
}

const TeacherContext = createContext<TeacherContextType | null>(null)

export const TeacherProvider = ({
  children,
  initialTeachersData = null,
}: TeachersProviderProps) => {
  const { toast } = useToast()

  // Utiliser les données initiales si disponibles
  const initialState: TeacherState = {
    teachers: initialTeachersData || [],
    isLoading: !initialTeachersData, // Marquer comme chargé si nous avons déjà des données
    error: null,
    students: null,
    groupedStudents: [],
    selectedCourseId: null,
  }

  const [state, dispatch] = useReducer(teacherReducer, initialState)

  const handleError = (error: Error, message: string) => {
    console.error(message, error)
    dispatch({ type: 'SET_ERROR', payload: message })
    toast({
      variant: 'destructive',
      title: 'Erreur',
      description: message,
    })
  }

  const setSelectedCourseId = useCallback((id: string) => {
    dispatch({ type: 'SET_SELECTED_COURSE_ID', payload: id })
  }, [])

  const transformStudentToMapEntry = (student: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    secondaryEmail: string | null;
    gender: string | null;
    dateOfBirth: Date | null;
  }): [string, StudentResponse] => [
    student.id,
    {
      id: student.id,
      email: student.email,
      firstname: student.firstname,
      lastname: student.lastname,
      type: 'student',
      subjects: null,
      created_at: null,
      updated_at: null,
      gender: student.gender,
      date_of_birth: student.dateOfBirth,
      secondary_email: student.secondaryEmail,
      phone: null,
      school_year: null,
    },
  ]

  const getAllStudentsFromSessions = (sessions: any[]) =>
    sessions.flatMap((session) => session.students)

  const handleGetStudentsByTeacher = useCallback(
    async (teacherId: string): Promise<StudentResponse[]> => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await getStudentsByTeacherAction(teacherId)
        if (!response.success || !response.data) {
          throw new Error('Erreur lors de la récupération des étudiants')
        }
        const data = response.data
        const uniqueStudents = Array.from(
          new Map(
            data.courses
              .flatMap((course) => getAllStudentsFromSessions(course.sessions))
              .map(transformStudentToMapEntry),
          ).values(),
        ) as StudentResponse[]
        dispatch({ type: 'SET_STUDENTS', payload: uniqueStudents })
        return uniqueStudents
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération des étudiants')
        throw error
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [dispatch, handleError],
  )

  const handleGetOneTeacher = useCallback(
    async (id: string): Promise<TeacherResponse> => {
      try {
        const response = await getOneTeacher(id)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la récupération du professeur')
        }

        const teacher = response.data as TeacherResponse
        return teacher
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération du professeur')
        throw error
      }
    },
    [handleError],
  )

  const handleGetAllTeachers = useCallback(async (): Promise<void> => {
    // Si nous avons déjà des données initiales, ne chargeons pas à nouveau
    if (initialTeachersData && !state.isLoading) {
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await getAllTeachers()

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la récupération des professeurs')
      }

      // Extraire les professeurs de la réponse
      const data = response.data as TeacherResponse[]
      const teachers = data ?? []

      dispatch({ type: 'SET_TEACHERS', payload: teachers })
    } catch (error) {
      handleError(error as Error, 'Erreur lors de la récupération des professeurs')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError, initialTeachersData, state.isLoading])

  const handleCreateTeacher = useCallback(
    async (teacherData: CreateTeacherPayload): Promise<TeacherResponse> => {
      try {
        const response = await createTeacherAction(teacherData)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la création du professeur')
        }

        // Extraire le professeur de la réponse
        const newTeacher = response.data as TeacherResponse

        dispatch({ type: 'ADD_TEACHER', payload: newTeacher })

        toast({
          title: 'Succès',
          variant: 'success',
          description: 'Professeur créé avec succès',
          duration: 3000,
        })

        return newTeacher
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la création du professeur')
        throw error
      }
    },
    [handleError, toast],
  )

  const handleUpdateTeacher = useCallback(
    async (id: string, teacherData: Partial<TeacherResponse>): Promise<void> => {
      try {
        const response = await updateTeacherAction(id, teacherData)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la mise à jour du professeur')
        }

        // Extraire le professeur de la réponse
        const updatedTeacher = response.data as TeacherResponse

        dispatch({ type: 'UPDATE_TEACHER', payload: updatedTeacher })

        toast({
          title: 'Succès',
          variant: 'success',
          description: 'Professeur mis à jour avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la mise à jour du professeur')
        throw error
      }
    },
    [handleError, toast],
  )

  const handleDeleteTeacher = useCallback(
    async (id: string): Promise<void> => {
      try {
        const response = await deleteTeacherAction(id)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la suppression du professeur')
        }

        dispatch({ type: 'DELETE_TEACHER', payload: id })

        toast({
          title: 'Succès',
          description: 'Professeur supprimé avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la suppression du professeur')
        throw error
      }
    },
    [handleError, toast],
  )

  useEffect(() => {
    // Seulement charger les données si nécessaire
    if (!initialTeachersData) {
      handleGetAllTeachers()
    }
  }, [initialTeachersData, handleGetAllTeachers])

  const value = useMemo(
    () => ({
      ...state,
      getOneTeacher: handleGetOneTeacher,
      getAllTeachers: handleGetAllTeachers,
      createTeacher: handleCreateTeacher,
      updateTeacher: handleUpdateTeacher,
      deleteTeacher: handleDeleteTeacher,
      getStudentsByTeacher: handleGetStudentsByTeacher,
      setSelectedCourseId,
    }),
    [
      state,
      handleGetOneTeacher,
      handleGetAllTeachers,
      handleCreateTeacher,
      handleUpdateTeacher,
      handleDeleteTeacher,
      handleGetStudentsByTeacher,
      setSelectedCourseId,
    ],
  )

  return <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>
}

export const useTeachers = () => {
  const context = useContext(TeacherContext)
  if (!context) {
    throw new Error('useTeachers must be used within a TeacherProvider')
  }
  return context
}

export default TeacherProvider
