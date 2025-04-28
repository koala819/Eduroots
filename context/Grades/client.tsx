'use client'

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'

import { useToast } from '@/hooks/use-toast'

import { CreateGradeDTO, PopulatedGrade, UpdateGradeDTO } from '@/types/grade'

import {
  createGradeRecord,
  getTeacherGrades,
  refreshGradeData,
  updateGradeRecord,
} from '@/app/actions/context/grades'

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
  | { type: 'SET_GRADES'; payload: PopulatedGrade[] }
  | { type: 'SET_TEACHER_GRADES'; payload: PopulatedGrade[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_GRADE'; payload: PopulatedGrade }
  | { type: 'DELETE_GRADE'; payload: string }
  | { type: 'REFRESH_DATA'; payload: PopulatedGrade[] }

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
        grades:
          state.grades.filter((grade) => grade.id !== action.payload) || [],
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
  createGradeRecord: (data: CreateGradeDTO) => Promise<boolean | number>
  updateGradeRecord: (
    id: string,
    data: UpdateGradeDTO,
  ) => Promise<boolean | number>
  error: string | null
  isLoading: boolean
  getTeacherGrades: (teacherId: string) => Promise<PopulatedGrade[]>
  refreshGradeData: (id?: string, fields?: string) => Promise<void>
}

const GradeContext = createContext<GradeContextType | null>(null)

export const GradesProvider = ({
  children,
  initialGradeData = null,
}: GradeProviderProps) => {
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
      const errorMessage = customMessage || error.message
      console.error('Grade Error:', error)
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
    async (data: CreateGradeDTO) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await createGradeRecord(data)

        if (!response.success) {
          throw new Error(
            response.error || 'Erreur lors de la création de la présence',
          )
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
          throw new Error(
            response.error || 'Erreur lors de la création de la présence',
          )
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
    [handleError],
  )

  const handleRefreshGradeData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await refreshGradeData()

      if (!response.success) {
        throw new Error(
          response.error || 'Erreur lors de la création de la présence',
        )
      }

      dispatch({
        type: 'REFRESH_DATA',
        payload: (response.data as unknown as PopulatedGrade[]) || [],
      })
    } catch (error) {
      handleError(error as Error, 'Erreur lors de la mise à jour des notes')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError])

  const handleUpdateGradeRecord = useCallback(
    async (id: string, data: UpdateGradeDTO) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await updateGradeRecord(id, data)

        if (!response.success) {
          throw new Error(
            response.error || 'Erreur lors de la création de la présence',
          )
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
    // Ne pas recharger les données si on a déjà initialGradeData
    if (isInitialMount.current && !initialGradeData) {
      isInitialMount.current = false
      handleRefreshGradeData()
    }
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
