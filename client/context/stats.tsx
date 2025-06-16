'use client'

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useTransition,
} from 'react'

import { useToast } from '@/client/hooks/use-toast'

import {
  EntityStats,
  StudentStats,
  TeacherStats,
  isStudentStats,
  isTeacherStats,
} from '@/types/stats'

import {
  getStudentAttendance,
  getStudentBehavior,
  getStudentGrade,
  refreshEntityStats,
  refreshGlobalStats,
  refreshTeacherStudentsStats,
  updateStudentStats,
  updateTeacherStats,
} from '@/server/actions/api/stats'
import { SerializedValue } from '@/zUnused/serialization'

interface StatsState {
  globalStats: SerializedValue | null
  entityStats: SerializedValue[]
  isLoading: boolean
  error: string | null
}

type StatsAction =
  | { type: 'SET_GLOBAL_STATS'; payload: SerializedValue }
  | { type: 'SET_ENTITY_STATS'; payload: SerializedValue[] }
  | { type: 'UPDATE_ENTITY_STATS'; payload: SerializedValue }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

export function statsReducer(
  state: StatsState,
  action: StatsAction,
): StatsState {
  switch (action.type) {
  case 'SET_GLOBAL_STATS':
    return { ...state, globalStats: action.payload }
  case 'SET_ENTITY_STATS':
    return { ...state, entityStats: action.payload }
  case 'UPDATE_ENTITY_STATS':
    return {
      ...state,
      entityStats: state.entityStats.map((stat) => {
        if (stat && typeof stat === 'object' && 'userId' in stat) {
          const statWithUserId = stat as { userId: SerializedValue }
          if (
            statWithUserId.userId ===
              (action.payload as { userId: SerializedValue }).userId
          ) {
            return action.payload
          }
        }
        return stat
      }),
    }
  case 'SET_LOADING':
    return { ...state, isLoading: action.payload }
  case 'SET_ERROR':
    return { ...state, error: action.payload }
  default:
    return state
  }
}

interface StatsContextType {
  refreshEntityStats: (forceUpdate?: boolean) => Promise<void>
  refreshTeacherStudentsStats: (forceUpdate?: boolean) => Promise<void>
  updateStudentStats: (id: string, stats: StudentStats) => Promise<void>
  updateTeacherStats: (id: string, stats: TeacherStats) => Promise<void>
  refreshGlobalStats: () => Promise<void>
  getStudentAttendance: (studentId: string) => Promise<any>
  getStudentBehavior: (studentId: string) => Promise<any>
  getStudentGrade: (studentId: string) => Promise<any>

  // État
  globalStats: SerializedValue | null
  entityStats: SerializedValue[]
  studentStats: SerializedValue[]
  teacherStats: SerializedValue[]
  isLoading: boolean
  isPending: boolean
  error: string | null
}

export const StatsContext = createContext<StatsContextType | null>(null)

interface StatsProviderProps {
  children: ReactNode
  initialEntityStats: SerializedValue[]
  initialGlobalStats: SerializedValue
}

export const StatsProvider = ({
  children,
  initialEntityStats,
  initialGlobalStats,
}: StatsProviderProps) => {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Initialiser l'état avec les données du serveur
  const initialState: StatsState = {
    globalStats: initialGlobalStats,
    entityStats: initialEntityStats,
    isLoading: false,
    error: null,
  }

  const [state, dispatch] = useReducer(statsReducer, initialState)

  // Filtrer les statistiques par type
  const studentStats = useMemo(() => {
    return state.entityStats.filter((stat) => {
      if (stat && typeof stat === 'object' && !Array.isArray(stat)) {
        return isStudentStats(stat as unknown as EntityStats)
      }
      return false
    })
  }, [state.entityStats])

  const teacherStats = useMemo(() => {
    return state.entityStats.filter((stat) => {
      if (stat && typeof stat === 'object' && !Array.isArray(stat)) {
        return isTeacherStats(stat as unknown as EntityStats)
      }
      return false
    })
  }, [state.entityStats])

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Stats Error:', error)
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

  const handleRefreshEntityStats = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      // Utiliser Server Action
      startTransition(async () => {
        const response = await refreshEntityStats()

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch attendance data')
        }

        dispatch({
          type: 'SET_ENTITY_STATS',
          payload: response.data as SerializedValue[],
        })
      })
    } catch (error) {
      handleError(
        error as Error,
        'Erreur lors de la récupération des statistiques des entités',
      )
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError])

  const handleRefreshTeacherStudentsStats =
    useCallback(async (): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })

        // Utiliser Server Action
        startTransition(async () => {
          const response = await refreshTeacherStudentsStats()

          if (!response.success || !response.data) {
            throw new Error(
              response.message || 'Failed to fetch teacher students stats',
            )
          }

          dispatch({
            type: 'SET_ENTITY_STATS',
            payload: response.data as SerializedValue[],
          })
        })
      } catch (error) {
        handleError(
          error as Error,
          'Erreur lors de la récupération des statistiques des élèves du professeur',
        )
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }, [handleError])

  const handleUpdateStudentStats = useCallback(
    async (id: string, statsData: StudentStats): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })

        // Utiliser Server Action avec transition UI
        startTransition(async () => {
          const response = await updateStudentStats(id, statsData)

          if (!response.success || !response.data) {
            throw new Error(
              response.message || 'Failed to fetch attendance data',
            )
          }

          dispatch({
            type: 'UPDATE_ENTITY_STATS',
            payload: response.data as SerializedValue,
          })
          toast({ title: 'Succès', description: 'Statistiques mises à jour' })
        })
      } catch (error) {
        handleError(
          error as Error,
          'Erreur lors de la mise à jour des statistiques',
        )
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError, toast],
  )

  const handleUpdateTeacherStats = useCallback(
    async (id: string, statsData: TeacherStats): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })

        // Utiliser Server Action avec transition UI
        startTransition(async () => {
          const response = await updateTeacherStats(id, statsData)

          if (!response.success || !response.data) {
            throw new Error(
              response.message || 'Failed to fetch attendance data',
            )
          }

          dispatch({
            type: 'UPDATE_ENTITY_STATS',
            payload: response.data as SerializedValue,
          })
          toast({ title: 'Succès', description: 'Statistiques mises à jour' })
        })
      } catch (error) {
        handleError(
          error as Error,
          'Erreur lors de la mise à jour des statistiques',
        )
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError, toast],
  )

  const handleRefreshGlobalStats = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      // Utiliser Server Action
      startTransition(async () => {
        const response = await refreshGlobalStats()

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch attendance data')
        }

        dispatch({
          type: 'SET_GLOBAL_STATS',
          payload: response.data as SerializedValue,
        })
      })
    } catch (error) {
      handleError(
        error as Error,
        'Erreur lors de la récupération des statistiques globales',
      )
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError])

  const handleGetStudentAttendance = useCallback(
    async (studentId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        return await getStudentAttendance(studentId)
      } catch (error) {
        handleError(
          error as Error,
          `Erreur lors de la récupération des présences pour l'étudiant ${studentId}`,
        )
        return null
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError],
  )

  const handleGetStudentBehavior = useCallback(
    async (studentId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        return await getStudentBehavior(studentId)
      } catch (error) {
        handleError(
          error as Error,
          `Erreur lors de la récupération des comportements pour l'étudiant ${studentId}`,
        )
        return null
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError],
  )

  const handleGetStudentGrade = useCallback(
    async (studentId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        return await getStudentGrade(studentId)
      } catch (error) {
        handleError(
          error as Error,
          `Erreur lors de la récupération des notes pour l'étudiant ${studentId}`,
        )
        return null
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError],
  )

  const value = useMemo(
    () => ({
      ...state,
      refreshEntityStats: handleRefreshEntityStats,
      refreshTeacherStudentsStats: handleRefreshTeacherStudentsStats,
      updateStudentStats: handleUpdateStudentStats,
      updateTeacherStats: handleUpdateTeacherStats,
      refreshGlobalStats: handleRefreshGlobalStats,
      getStudentAttendance: handleGetStudentAttendance,
      getStudentBehavior: handleGetStudentBehavior,
      getStudentGrade: handleGetStudentGrade,
      studentStats,
      teacherStats,
      isPending,
    }),
    [
      state,
      handleUpdateStudentStats,
      handleUpdateTeacherStats,
      handleRefreshGlobalStats,
      handleRefreshEntityStats,
      handleRefreshTeacherStudentsStats,
      handleGetStudentAttendance,
      handleGetStudentBehavior,
      handleGetStudentGrade,
      studentStats,
      teacherStats,
      isPending,
    ],
  )

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>
}

export const useStats = () => {
  const context = useContext(StatsContext)
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider')
  }
  return context
}
