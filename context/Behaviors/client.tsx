'use client'

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useTransition,
  useEffect,
} from 'react'

import {useToast} from '@/hooks/use-toast'

import {
  Behavior,
  BehaviorRecord,
  CreateBehaviorPayload,
  DuplicateBehavior,
  UpdateBehaviorPayload,
} from '@/types/behavior'
import {BehaviorDocument} from '@/types/mongoose'

import {
  createBehaviorRecord,
  deleteBehaviorRecord,
  fetchBehaviorsByCourse,
  getBehaviorByIdAndDate,
  getStudentBehaviorHistory,
  updateBehaviorRecord,
} from '@/app/actions/context/behaviors'

interface BehaviorState {
  behaviorRecords: Behavior[]
  duplicateBehaviors: DuplicateBehavior[]
  studentAverageBehaviors: Record<string, number>
  isLoading: boolean
  isLoadingBehavior: boolean
  error: string | null
  allBehaviors: BehaviorDocument[] | null
  checkOneBehavior: BehaviorDocument | null
  todayBehavior: BehaviorDocument | null
}

interface BehaviorProviderProps {
  children: ReactNode
  initialBehaviorData?: BehaviorDocument[] | null
}

type BehaviorAction =
  | {type: 'CREATE_BEHAVIOR'; payload: Behavior}
  | {type: 'DELETE_BEHAVIOR'; payload: string}
  | {
      type: 'REFRESH_DATA'
      payload: {
        records: Behavior[]
      }
    }
  | {type: 'SET_BEHAVIOR_RECORDS'; payload: Behavior[]}
  | {type: 'SET_DUPLICATES'; payload: DuplicateBehavior[]}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_LOADING_BEHAVIOR'; payload: boolean}
  | {type: 'SET_STUDENT_AVERAGES'; payload: Record<string, number>}
  | {type: 'UPDATE_SINGLE_RECORD'; payload: Behavior}
  | {type: 'SET_ALL_BEHAVIORS'; payload: BehaviorDocument[]}
  | {type: 'SET_ONE_BEHAVIOR'; payload: BehaviorDocument}
  | {type: 'SET_TODAY_BHEAVIOR'; payload: BehaviorDocument}

function behaviorReducer(state: BehaviorState, action: BehaviorAction): BehaviorState {
  switch (action.type) {
    case 'SET_TODAY_BHEAVIOR':
      return {
        ...state,
        todayBehavior: action.payload,
      }
    case 'SET_ONE_BEHAVIOR':
      return {
        ...state,
        checkOneBehavior: action.payload,
      }

    case 'SET_ALL_BEHAVIORS':
      return {
        ...state,
        allBehaviors: action.payload as any,
      }

    case 'SET_BEHAVIOR_RECORDS':
      return {
        ...state,
        behaviorRecords: action.payload,
      }
    case 'SET_DUPLICATES':
      return {
        ...state,
        duplicateBehaviors: action.payload,
      }
    case 'SET_STUDENT_AVERAGES':
      return {
        ...state,
        studentAverageBehaviors: action.payload,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    case 'SET_LOADING_BEHAVIOR':
      return {
        ...state,
        isLoadingBehavior: action.payload,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }
    case 'UPDATE_SINGLE_RECORD':
      return {
        ...state,
        behaviorRecords: state.behaviorRecords.map((record) =>
          record.id === action.payload.id ? action.payload : record,
        ),
      }
    case 'DELETE_BEHAVIOR':
      return {
        ...state,
        behaviorRecords: state.behaviorRecords.filter((record) => record.id !== action.payload),
      }
    case 'REFRESH_DATA':
      return {
        ...state,
        behaviorRecords: action.payload.records,
        error: null,
      }
    case 'CREATE_BEHAVIOR':
      return {
        ...state,
        behaviorRecords: [...state.behaviorRecords, action.payload],
      }
    default:
      return state
  }
}

interface BehaviorContextType extends Omit<BehaviorState, 'isLoading' | 'error'> {
  calculateAverageBehavior: (studentId: string) => number
  calculateGlobalAverageBehavior: () => number
  createBehaviorRecord: (data: CreateBehaviorPayload) => Promise<void>
  deleteBehaviorRecord: (id: string) => Promise<void>
  error: string | null
  fetchBehaviors: ({
    courseId,
    sessionId,
    checkToday,
  }: {
    courseId: string
    sessionId?: string
    checkToday?: boolean
  }) => Promise<void>
  getStudentBehavior: (studentId: string) => BehaviorRecord[]
  isLoading: boolean
  isPending: boolean
  getBehaviorById: (courseId: string, date: string) => Promise<any> // Utiliser any pour correspondre au type sérialisé
  getStudentBehaviorHistory: (studentId: string) => Promise<any> // Utiliser any pour correspondre au type sérialisé
  updateBehaviorRecord: (data: UpdateBehaviorPayload) => Promise<void>
}

const BehaviorsContext = createContext<BehaviorContextType | null>(null)

export const BehaviorProvider = ({children, initialBehaviorData = null}: BehaviorProviderProps) => {
  const {toast} = useToast()
  const [isPending, startTransition] = useTransition()

  const initialState: BehaviorState = {
    behaviorRecords: [],
    duplicateBehaviors: [],
    studentAverageBehaviors: {},
    isLoading: false,
    isLoadingBehavior: false,
    error: null,
    allBehaviors: null,
    checkOneBehavior: null,
    todayBehavior: null,
  }

  const [state, dispatch] = useReducer(behaviorReducer, initialState)

  useEffect(() => {
    if (initialBehaviorData) {
      dispatch({type: 'SET_ALL_BEHAVIORS', payload: initialBehaviorData})
    }
  }, [initialBehaviorData])

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Behavior Error:', error)
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

  const handleGetStudentBehaviorHistory = useCallback(
    async (studentId: string) => {
      if (!studentId) return []

      dispatch({type: 'SET_LOADING', payload: true})
      try {
        const data = await getStudentBehaviorHistory(studentId)
        return data
      } catch (error) {
        handleError(error as Error)
        return []
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError],
  )

  const handleGetBehaviorById = useCallback(
    async (courseId: string, date: string) => {
      if (!courseId || !date) return null

      dispatch({type: 'SET_LOADING_BEHAVIOR', payload: true})
      try {
        const data = await getBehaviorByIdAndDate(courseId, date)
        if (data?.success && data.data) {
          const behaviorDoc = data.data as any
          dispatch({type: 'SET_ONE_BEHAVIOR', payload: behaviorDoc})
        }
        return data
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération du cours')
        return null
      } finally {
        dispatch({type: 'SET_LOADING_BEHAVIOR', payload: false})
      }
    },
    [handleError],
  )

  const calculateAverageBehavior = useCallback(
    (studentId: string): number => {
      return state.studentAverageBehaviors[studentId] || 0
    },
    [state.studentAverageBehaviors],
  )

  const calculateGlobalAverageBehavior = useCallback((): number => {
    const values = Object.values(state.studentAverageBehaviors)
    if (values.length === 0) return 0
    return Math.round(values.reduce((acc, val) => acc + val, 0) / values.length)
  }, [state.studentAverageBehaviors])

  const handleCreateBehaviorRecord = useCallback(
    async (data: CreateBehaviorPayload) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        startTransition(async () => {
          const result = await createBehaviorRecord(data)

          toast({
            title: 'Succès',
            variant: 'success',
            description: 'Comportement enregistré avec succès',
            duration: 3000,
          })

          // Refresh data if needed
          if (data.course) {
            await handleFetchBehaviors({courseId: data.course})
          }
        })
      } catch (error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'No Record behavior do',
        })
        handleError(error as Error, 'Erreur lors de la création du comportement')
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError, toast],
  )

  const handleDeleteBehaviorRecord = useCallback(
    async (id: string) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        startTransition(async () => {
          await deleteBehaviorRecord(id)

          dispatch({type: 'DELETE_BEHAVIOR', payload: id})

          toast({
            title: 'Succès',
            description: 'Comportement supprimé avec succès',
            duration: 3000,
          })
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la suppression du comportement')
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError, toast],
  )

  const handleFetchBehaviors = useCallback(
    async ({
      courseId,
      sessionId,
      checkToday,
    }: {
      courseId: string
      sessionId?: string
      checkToday?: boolean
    }) => {
      if (!courseId) return

      dispatch({type: 'SET_LOADING_BEHAVIOR', payload: true})
      try {
        const response = await fetchBehaviorsByCourse(courseId)

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch behavior data')
        }

        startTransition(() => {
          if (sessionId) {
            const sessionBehavior = Array.isArray(response.data)
              ? response.data.find(
                  (b) =>
                    b &&
                    typeof b === 'object' &&
                    'course' in b &&
                    b?.course?.toString() === sessionId,
                )
              : response.data

            if (sessionBehavior) {
              dispatch({
                type: 'SET_ONE_BEHAVIOR',
                payload: sessionBehavior as any,
              })
            }
          } else if (checkToday) {
            const today = new Date().toISOString().split('T')[0]
            const todayBehavior =
              Array.isArray(response.data) && response.data.length > 0
                ? response.data.find(
                    (b) =>
                      b &&
                      (b as any).date &&
                      new Date((b as any).date).toISOString().split('T')[0] === today,
                  )
                : response.data

            if (todayBehavior) {
              dispatch({
                type: 'SET_TODAY_BHEAVIOR',
                payload: todayBehavior as any,
              })
            }
          } else {
            dispatch({
              type: 'SET_ALL_BEHAVIORS',
              payload: response.data as any[],
            })
          }
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la vérification des comportements')
        throw error
      } finally {
        dispatch({type: 'SET_LOADING_BEHAVIOR', payload: false})
      }
    },
    [handleError],
  )

  const getStudentBehavior = useCallback(
    (studentId: string): BehaviorRecord[] => {
      const behaviors = state.behaviorRecords.filter((behavior) =>
        behavior.records.some(
          (record) =>
            (typeof record.student === 'string' ? record.student : record.student.id) === studentId,
        ),
      )
      return behaviors.flatMap((behavior) =>
        behavior.records.filter(
          (record) =>
            (typeof record.student === 'string' ? record.student : record.student.id) === studentId,
        ),
      )
    },
    [state.behaviorRecords],
  )

  const handleUpdateBehaviorRecord = useCallback(
    async (data: UpdateBehaviorPayload) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        startTransition(async () => {
          await updateBehaviorRecord(data)

          toast({
            title: 'Succès',
            variant: 'success',
            description: 'Comportement mis à jour avec succès',
            duration: 3000,
          })

          // Refresh data if needed
          if (data.courseId) {
            await handleFetchBehaviors({courseId: data.courseId})
          }
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la mise à jour du comportement')
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError, toast, handleFetchBehaviors],
  )

  const value = useMemo(
    () => ({
      ...state,
      calculateAverageBehavior,
      calculateGlobalAverageBehavior,
      createBehaviorRecord: handleCreateBehaviorRecord,
      deleteBehaviorRecord: handleDeleteBehaviorRecord,
      fetchBehaviors: handleFetchBehaviors,
      getStudentBehavior,
      updateBehaviorRecord: handleUpdateBehaviorRecord,
      getBehaviorById: handleGetBehaviorById,
      getStudentBehaviorHistory: handleGetStudentBehaviorHistory,
      isPending,
    }),
    [
      state,
      calculateAverageBehavior,
      calculateGlobalAverageBehavior,
      handleCreateBehaviorRecord,
      handleDeleteBehaviorRecord,
      handleFetchBehaviors,
      getStudentBehavior,
      handleUpdateBehaviorRecord,
      handleGetBehaviorById,
      handleGetStudentBehaviorHistory,
      isPending,
    ],
  )

  return <BehaviorsContext.Provider value={value}>{children}</BehaviorsContext.Provider>
}

export const useBehavior = () => {
  const context = useContext(BehaviorsContext)
  if (!context) {
    throw new Error('useBehavior must be used within a BehaviorProvider')
  }
  return context
}
