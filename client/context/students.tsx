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

import { CreateStudentPayload, StudentResponse } from '@/types/student-payload'

import {
  createStudent as createStudentAction,
  deleteStudent as deleteStudentAction,
  getAllStudents,
  getOneStudent,
  getTeachersForStudent,
  updateStudent as updateStudentAction,
} from '@/server/actions/api/students'
import { useCourses } from '@/client/context/courses'
import { differenceInYears } from 'date-fns'
import { TeacherResponse } from '@/types/teacher-payload'

interface StudentState {
  students: StudentResponse[]
  isLoading: boolean
  error: string | null
}

interface StudentsProviderProps {
  children: ReactNode
  initialStudentsData?: StudentResponse[] | null
}

type StudentAction =
  | {type: 'SET_STUDENTS'; payload: StudentResponse[]}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'ADD_STUDENT'; payload: StudentResponse}
  | {type: 'UPDATE_STUDENT'; payload: StudentResponse}
  | {type: 'DELETE_STUDENT'; payload: string}

function studentReducer(state: StudentState, action: StudentAction): StudentState {
  switch (action.type) {
  case 'SET_STUDENTS':
    return { ...state, students: action.payload }
  case 'SET_LOADING':
    return { ...state, isLoading: action.payload }
  case 'SET_ERROR':
    return { ...state, error: action.payload }
  case 'ADD_STUDENT':
    return {
      ...state,
      students: [...state.students, action.payload],
    }
  case 'UPDATE_STUDENT':
    return {
      ...state,
      students: state.students.map((student) =>
        student.id === action.payload.id ? action.payload : student,
      ),
    }
  case 'DELETE_STUDENT':
    return {
      ...state,
      students: state.students.filter((student) => student.id !== action.payload),
    }
  default:
    return state
  }
}

interface StudentContextType extends StudentState {
  getOneStudent: (id: string) => Promise<StudentResponse>
  getAllStudents: () => Promise<void>
  createStudent: (studentData: CreateStudentPayload) => Promise<StudentResponse>
  updateStudent: (id: string, studentData: Partial<StudentResponse>) => Promise<StudentResponse>
  deleteStudent: (id: string) => Promise<void>
  getStudentAge: (dateOfBirth: string) => number
  getStudentsWithoutCourses: () => Promise<StudentResponse[]>
  getTeachersForStudent: (studentId: string) => Promise<TeacherResponse[]>
}

const StudentContext = createContext<StudentContextType | null>(null)

export const StudentProvider = ({
  children,
  initialStudentsData = null,
}: StudentsProviderProps) => {
  const { toast } = useToast()
  const { courses } = useCourses()

  // Utiliser les données initiales si disponibles
  const initialState: StudentState = {
    students: initialStudentsData || [],
    isLoading: !initialStudentsData, // Marquer comme chargé si nous avons déjà des données
    error: null,
  }

  const [state, dispatch] = useReducer(studentReducer, initialState)

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Student Error:', error)
      const errorMessage = customMessage ?? error.message
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

  const getStudentAge = useCallback((dateOfBirth: string): number => {
    try {
      return differenceInYears(new Date(), new Date(dateOfBirth))
    } catch (error) {
      console.error('Error calculating age:', error)
      return 0
    }
  }, [])

  const handleGetOneStudent = useCallback(
    async (studentId: string): Promise<StudentResponse> => {
      try {
        const response = await getOneStudent(studentId)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la récupération de l\'étudiant')
        }

        // Extraire l'étudiant de la réponse
        const student = response.data as StudentResponse

        dispatch({ type: 'UPDATE_STUDENT', payload: student })
        return student
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération de l\'étudiant')
        throw error
      }
    },
    [handleError],
  )

  const handleGetTeachersForStudent = useCallback(
    async (studentId: string): Promise<TeacherResponse[]> => {
      try {
        const response = await getTeachersForStudent(studentId)
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Erreur lors de la récupération des professeurs')
        }
        return response.data.teachers.map((teacher) => ({
          id: teacher.id,
          email: teacher.email,
          firstname: teacher.firstname,
          lastname: teacher.lastname,
          subjects: teacher.subjects || [],
          type: 'teacher',
          created_at: new Date(),
          updated_at: new Date(),
        }))
      } catch (error) {
        console.error('[GET_TEACHERS_FOR_STUDENT]', error)
        throw error
      }
    },
    [],
  )

  const handleGetAllStudents = useCallback(async (): Promise<void> => {
    // Si nous avons déjà des données initiales, ne chargeons pas à nouveau
    if (initialStudentsData) {
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await getAllStudents()

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la récupération des étudiants')
      }

      // Extraire les étudiants de la réponse
      const data = response.data as any
      const students = data ?? []

      dispatch({ type: 'SET_STUDENTS', payload: students as StudentResponse[] })
    } catch (error) {
      handleError(error as Error, 'Erreur lors de la récupération des étudiants')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError, initialStudentsData])

  const handleCreateStudent = useCallback(
    async (
      studentData: CreateStudentPayload,
    ): Promise<StudentResponse> => {
      try {
        const response = await createStudentAction(studentData)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la création de l\'étudiant')
        }

        // Extraire l'étudiant de la réponse
        const newStudent = response.data as StudentResponse

        dispatch({ type: 'ADD_STUDENT', payload: newStudent })

        toast({
          title: 'Succès',
          variant: 'success',
          description: 'Étudiant créé avec succès',
          duration: 3000,
        })

        return newStudent
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la création de l\'étudiant')
        throw error
      }
    },
    [handleError, toast],
  )

  const handleUpdateStudent = useCallback(
    async (id: string, studentData: Partial<StudentResponse>): Promise<StudentResponse> => {
      try {
        const response = await updateStudentAction(id, studentData)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la mise à jour de l\'étudiant')
        }

        // Extraire l'étudiant de la réponse
        const updatedStudent = response.data as StudentResponse

        dispatch({ type: 'UPDATE_STUDENT', payload: updatedStudent })

        toast({
          title: 'Succès',
          variant: 'success',
          description: 'Étudiant mis à jour avec succès',
          duration: 3000,
        })

        return updatedStudent
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la mise à jour de l\'étudiant')
        throw error
      }
    },
    [handleError, toast],
  )

  const handleDeleteStudent = useCallback(
    async (id: string): Promise<void> => {
      try {
        const response = await deleteStudentAction(id)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la suppression de l\'étudiant')
        }

        dispatch({ type: 'DELETE_STUDENT', payload: id })

        toast({
          title: 'Succès',
          description: 'Étudiant supprimé avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la suppression de l\'étudiant')
        throw error
      }
    },
    [handleError, toast],
  )

  const getStudentsWithoutCourses = useCallback(async (): Promise<StudentResponse[]> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const allStudents = state.students
      // Pour chaque étudiant, vérifier qu'il n'est dans AUCUNE session de AUCUN cours
      return allStudents.filter((student) => {
        let isStudentInAnyCourse = false

        for (const course of courses) {
          for (const session of course.courses_sessions) {
            if (
              session.courses_sessions_students.find((s) => {
                return s.users.id === student.id
              })
            ) {
              isStudentInAnyCourse = true
              break
            }
          }
          if (isStudentInAnyCourse) break
        }

        return !isStudentInAnyCourse
      })
    } catch (error) {
      handleError(error as Error)
      return []
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.students, courses, handleError])

  useEffect(() => {
    // Seulement charger les données si nécessaire
    if (!initialStudentsData) {
      handleGetAllStudents()
    }
  }, [initialStudentsData, handleGetAllStudents])

  const value = useMemo(
    () => ({
      ...state,
      getOneStudent: handleGetOneStudent,
      getAllStudents: handleGetAllStudents,
      createStudent: handleCreateStudent,
      updateStudent: handleUpdateStudent,
      deleteStudent: handleDeleteStudent,
      getStudentAge,
      getStudentsWithoutCourses,
      getTeachersForStudent: handleGetTeachersForStudent,
    }),
    [
      state,
      handleGetOneStudent,
      handleGetAllStudents,
      handleCreateStudent,
      handleUpdateStudent,
      handleDeleteStudent,
      getStudentAge,
      getStudentsWithoutCourses,
      handleGetTeachersForStudent,
    ],
  )

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
}

export const useStudents = () => {
  const context = useContext(StudentContext)
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider')
  }
  return context
}

export default StudentProvider
