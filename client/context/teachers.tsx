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

import { GroupedStudents } from '@/zUnused/types/course'
import { StudentDocument } from '@/zUnused/types/mongoose'
import { Student, Teacher } from '@/zUnused/types/user'

import {
  createTeacher as createTeacherAction,
  deleteTeacher as deleteTeacherAction,
  getAllTeachers,
  getOneTeacher,
  getStudentsByTeacher as getStudentsByTeacherAction,
  updateTeacher as updateTeacherAction,
} from '@/server/actions/context/teachers'

interface TeacherState {
  teachers: Teacher[]
  isLoading: boolean
  error: string | null
  students: StudentDocument[] | null // Ajout pour stocker les étudiants récupérés
  groupedStudents: GroupedStudents[] | null
  selectedCourseId: string | null
}

interface TeachersProviderProps {
  children: ReactNode
  initialTeachersData?: Teacher[] | null
}

type TeacherAction =
  | {type: 'SET_TEACHERS'; payload: Teacher[]}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'ADD_TEACHER'; payload: Teacher}
  | {type: 'UPDATE_TEACHER'; payload: Teacher}
  | {type: 'DELETE_TEACHER'; payload: string}
  | {type: 'SET_STUDENTS'; payload: StudentDocument[]}
  | {type: 'SET_GROUPED_STUDENTS'; payload: GroupedStudents[]}
  | {type: 'SET_SELECTED_COURSE_ID'; payload: string}
  | {
      type: 'UPDATE_TEACHER_STATS'
      payload: {id: string; stats: Teacher['stats']}
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
  getOneTeacher: (id: string) => Promise<Teacher>
  getAllTeachers: () => Promise<void>
  createTeacher: (
    teacherData: Omit<Teacher, 'id' | '_id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<Teacher>
  updateTeacher: (id: string, teacherData: Partial<Teacher>) => Promise<void>
  deleteTeacher: (id: string) => Promise<void>
  getStudentsByTeacher: (teacherId: string) => Promise<Student[]>
  setSelectedCourseId: (id: string) => void
}

const TeacherContext = createContext<TeacherContextType | null>(null)

export const TeacherProvider = ({ children, initialTeachersData = null }: TeachersProviderProps) => {
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

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Teacher Error:', error)
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

  const setSelectedCourseId = useCallback((id: string) => {
    dispatch({ type: 'SET_SELECTED_COURSE_ID', payload: id })
  }, [])

  const handleGetStudentsByTeacher = useCallback(
    async (teacherId: string): Promise<Student[]> => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await getStudentsByTeacherAction(teacherId)

        if (!response.success) {
          throw new Error(
            response.message || 'Erreur lors de la récupération des étudiants du professeur',
          )
        }

        // Extraire les données nécessaires
        const allStudents = new Set<string>()
        const coursesData = response.data as unknown as GroupedStudents[]

        coursesData.forEach((course: any) => {
          course.sessions.forEach((session: any) => {
            session.students.forEach((student: any) => {
              allStudents.add(JSON.stringify(student)) // On utilise JSON.stringify pour gérer la déduplication d'objets
            })
          })
        })

        // Conversion en tableau et parsing des étudiants uniques
        const uniqueStudents = Array.from(allStudents).map((student: string) => JSON.parse(student))

        dispatch({ type: 'SET_GROUPED_STUDENTS', payload: coursesData })
        dispatch({ type: 'SET_STUDENTS', payload: uniqueStudents })

        return uniqueStudents
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération des étudiants du professeur')
        throw error
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError],
  )

  const handleGetOneTeacher = useCallback(
    async (id: string): Promise<Teacher> => {
      try {
        const response = await getOneTeacher(id)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la récupération du professeur')
        }

        const teacher = response.data as unknown as Teacher
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
      const data = response.data as any
      const teachers = data || []

      dispatch({ type: 'SET_TEACHERS', payload: teachers as Teacher[] })
    } catch (error) {
      handleError(error as Error, 'Erreur lors de la récupération des professeurs')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError, initialTeachersData, state.isLoading])

  const handleCreateTeacher = useCallback(
    async (
      teacherData: Omit<Teacher, 'id' | '_id' | 'createdAt' | 'updatedAt'>,
    ): Promise<Teacher> => {
      try {
        const response = await createTeacherAction(teacherData)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la création du professeur')
        }

        // Extraire le professeur de la réponse
        const newTeacher = response.data as unknown as Teacher

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
    async (id: string, teacherData: Partial<Teacher>): Promise<void> => {
      try {
        const response = await updateTeacherAction(id, teacherData)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la mise à jour du professeur')
        }

        // Extraire le professeur de la réponse
        const updatedTeacher = response.data as unknown as Teacher

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
