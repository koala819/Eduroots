'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'

import { useToast } from '@/client/hooks/use-toast'
import {
  createGradeRecord,
  getTeacherGrades,
  refreshGradeData,
  updateGradeRecord,
} from '@/server/actions/api/grades'
import { Grade, GradeRecord } from '@/types/db'
import { CreateGradePayload } from '@/types/grade-payload'

export interface PopulatedGrade extends Grade {
  records: GradeRecord[]
}

interface GradeState {
  grades: PopulatedGrade[]
  teacherGrades: PopulatedGrade[] | null
  error: string | null
  isLoading: boolean
}

interface GradeProviderProps {
  children: ReactNode
  initialGradeData?: PopulatedGrade[] | null
}

type GradeAction =
  | {type: 'SET_GRADES'; payload: PopulatedGrade[]}
  | {type: 'SET_TEACHER_GRADES'; payload: PopulatedGrade[]}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'UPDATE_GRADE'; payload: PopulatedGrade}
  | {type: 'DELETE_GRADE'; payload: string}
  | {type: 'REFRESH_DATA'; payload: PopulatedGrade[]}

function gradeReducer(state: GradeState, action: GradeAction): GradeState {
  switch (action.type) {
  case 'SET_GRADES':
    return {
      ...state,
      grades: action.payload || [],
    }
  case 'SET_TEACHER_GRADES':
    return {
      ...state,
      teacherGrades: action.payload,
    }
  case 'SET_ERROR':
    return {
      ...state,
      error: action.payload,
    }
  case 'SET_LOADING':
    return {
      ...state,
      isLoading: action.payload,
    }
  case 'UPDATE_GRADE':
    return {
      ...state,
      grades: state.grades.map((grade) =>
        grade.id === action.payload.id ? action.payload : grade,
      ),
    }
  case 'DELETE_GRADE':
    return {
      ...state,
      grades: state.grades.filter((grade) => grade.id !== action.payload) || [],
    }

  case 'REFRESH_DATA':
    return {
      ...state,
      grades: action.payload || [],
      error: null,
    }
  default:
    return state
  }
}

interface GradeContextType extends Omit<GradeState, 'isLoading' | 'error'> {
  createGradeRecord: (data: CreateGradePayload) => Promise<boolean | number>
  updateGradeRecord: (id: string, data: CreateGradePayload) => Promise<boolean | number>
  error: string | null
  isLoading: boolean
  getTeacherGrades: (teacherId: string) => Promise<PopulatedGrade[]>
  refreshGradeData: (id?: string, fields?: string) => Promise<void>
}

const GradeContext = createContext<GradeContextType | null>(null)

export const GradesProvider = ({ children, initialGradeData = null }: GradeProviderProps) => {
  const { toast } = useToast()

  const initialState: GradeState = {
    grades: initialGradeData || [],
    teacherGrades: initialGradeData || null,
    error: null,
    isLoading: !initialGradeData,
  }

  const [state, dispatch] = useReducer(gradeReducer, initialState)
  const isInitialMount = useRef(true)

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Grade Error:', error)
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

  const handleCreateGradeRecord = useCallback(
    async (data: CreateGradePayload) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await createGradeRecord(data)

        if (!response.success) {
          throw new Error(response.error ?? 'Erreur lors de la création de la présence')
        }
        await refreshGradeData()

        return response.success
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la création de la note')
        return 0
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError],
  )

  const handleGetTeacherGrades = useCallback(
    async (teacherId: string) => {
      // Ne pas charger si on a déjà les données et que c'est le même enseignant
      if (initialGradeData && state.teacherGrades) {
        return state.teacherGrades
      }

      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await getTeacherGrades(teacherId)

        if (!response.success) {
          throw new Error(response.error ?? 'Erreur lors de la création de la présence')
        }
        const grades = (response.data as unknown as PopulatedGrade[]) || []

        dispatch({
          type: 'SET_TEACHER_GRADES',
          payload: grades,
        })

        return grades
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la création de la note')
        return []
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError, initialGradeData],
  )

  const handleRefreshGradeData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await refreshGradeData()

      if (!response.success) {
        throw new Error(response.error ?? 'Erreur lors de la création de la présence')
      }

      const grades = (response.data as unknown as PopulatedGrade[]) || []

      dispatch({
        type: 'REFRESH_DATA',
        payload: grades,
      })
    } catch (error) {
      handleError(error as Error, 'Erreur lors de la mise à jour des notes')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError])

  const handleUpdateGradeRecord = useCallback(
    async (id: string, data: CreateGradePayload) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await updateGradeRecord(id, data)

        if (!response.success) {
          throw new Error(response.error ?? 'Erreur lors de la création de la présence')
        }

        await refreshGradeData()

        return response.success
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la mise à jour de la note')
        return 0
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError, toast],
  )

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      // Ne pas return ici - laisser le useEffect continuer pour charger les données
    }

    // Si nous avons déjà des données initiales, ne chargeons pas à nouveau
    if (initialGradeData && initialGradeData.length > 0) {
      return
    }

    // Charger automatiquement les données si pas de données initiales
    handleRefreshGradeData()
  }, [handleRefreshGradeData, initialGradeData])

  const value = useMemo(
    () => ({
      ...state,
      createGradeRecord: handleCreateGradeRecord,
      getTeacherGrades: handleGetTeacherGrades,
      refreshGradeData: handleRefreshGradeData,
      updateGradeRecord: handleUpdateGradeRecord,
    }),
    [
      state,
      handleCreateGradeRecord,
      handleGetTeacherGrades,
      handleRefreshGradeData,
      handleUpdateGradeRecord,
    ],
  )

  return <GradeContext.Provider value={value}>{children}</GradeContext.Provider>
}

export const useGrades = () => {
  const context = useContext(GradeContext)
  if (!context) {
    throw new Error('useGrades must be used within a GradesProvider')
  }
  return context
}
