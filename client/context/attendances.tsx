'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useTransition,
} from 'react'

import { useToast } from '@/client/hooks/use-toast'
import {
  createAttendanceRecord,
  deleteAttendance,
  getAttendanceById,
  getStudentAttendanceHistory,
  restoreAttendance,
  softDeleteAttendance,
  updateAttendanceRecord,
} from '@/server/actions/api/attendances'

import { Attendance, AttendanceRecord } from '@/types/db'
import {
  CreateAttendancePayload,
  UpdateAttendancePayload,
} from '@/types/attendance-payload'
import {
  AttendanceState,
  AttendanceStats,
  DuplicateRecords,
  GroupedAbsences,
} from '@/types/attendance'

interface AttendanceProviderProps {
  children: React.ReactNode
  initialAttendanceData?: Attendance[] | null
}

type AttendanceAction =
  | {type: 'SET_LOADING_ATTENDANCE'; payload: boolean}
  | {type: 'SET_ALL_ATTENDANCE'; payload: Attendance[]}
  | {type: 'SET_ONE_ATTENDANCE'; payload: Attendance}
  | {type: 'SET_TODAY_ATTENDANCE'; payload: Attendance}
  | {type: 'CREATE_ATTENDANCE'; payload: AttendanceRecord}
  | {type: 'DELETE_ATTENDANCE'; payload: string}
  | {type: 'SOFT_DELETE_ATTENDANCE'; payload: string}
  | {type: 'RESTORE_ATTENDANCE'; payload: string}
  | {type: 'SET_STATS'; payload: AttendanceStats}
  | {
      type: 'REFRESH_DATA'
      payload: {
        records: AttendanceRecord[]
      }
    }
  | {type: 'SET_ATTENDANCE_RECORDS'; payload: AttendanceRecord[]}
  | {type: 'SET_DUPLICATES'; payload: DuplicateRecords[]}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'SET_GROUPED_STUDENTS'; payload: GroupedAbsences}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_STUDENT_IDS'; payload: string[]}
  | {type: 'UPDATE_SINGLE_RECORD'; payload: AttendanceRecord}

function attendanceReducer(state: AttendanceState, action: AttendanceAction): AttendanceState {
  switch (action.type) {
  case 'SET_LOADING_ATTENDANCE':
    return {
      ...state,
      isLoadingAttendance: action.payload,
    }

  case 'SET_ALL_ATTENDANCE':
    return {
      ...state,
      allAttendance: action.payload,
    }

  case 'SET_ONE_ATTENDANCE':
    return {
      ...state,
      checkOneAttendance: action.payload,
    }

  case 'SET_TODAY_ATTENDANCE':
    return {
      ...state,
      todayAttendance: action.payload,
    }

  case 'SET_ATTENDANCE_RECORDS':
    return {
      ...state,
      attendanceRecords: action.payload,
    }

  case 'SET_STUDENT_IDS':
    return {
      ...state,
      registeredStudentIds: action.payload,
    }

  case 'SET_DUPLICATES':
    return {
      ...state,
      duplicateAttendanceEntries: action.payload,
    }

  case 'SET_GROUPED_STUDENTS':
    return {
      ...state,
      studentsByAbsenceLevel: action.payload,
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

  case 'UPDATE_SINGLE_RECORD':
    return {
      ...state,
      attendanceRecords: state.attendanceRecords.map((record) =>
        record.id === action.payload.id ? action.payload : record,
      ),
    }

  case 'DELETE_ATTENDANCE':
    return {
      ...state,
      attendanceRecords: state.attendanceRecords.filter((record) => record.id !== action.payload),
    }

  case 'REFRESH_DATA':
    return {
      ...state,
      attendanceRecords: action.payload.records,
      error: null,
    }

  case 'CREATE_ATTENDANCE':
    return {
      ...state,
      attendanceRecords: [...state.attendanceRecords, action.payload],
    }

  case 'SOFT_DELETE_ATTENDANCE':
    return {
      ...state,
      attendanceRecords: state.attendanceRecords.filter((record) => record.id !== action.payload),
      deletedRecords: [
        ...state.deletedRecords,
        state.attendanceRecords.find((r) => r.id === action.payload)!,
      ],
    }

  case 'RESTORE_ATTENDANCE':
    return {
      ...state,
      attendanceRecords: [
        ...state.attendanceRecords,
        state.deletedRecords.find((r) => r.id === action.payload)!,
      ],
      deletedRecords: state.deletedRecords.filter((r) => r.id !== action.payload),
    }

  case 'SET_STATS':
    return {
      ...state,
      stats: action.payload,
    }

  default:
    return state
  }
}

interface AttendanceContextType extends Omit<AttendanceState, 'isLoading' | 'error'> {
  // Méthodes
  createAttendanceRecord: (data: CreateAttendancePayload) => Promise<void>
  deleteAttendance: (id: string) => Promise<void>
  fetchAttendances: ({
    courseId,
    sessionId,
    checkToday,
  }: {
    courseId: string
    sessionId?: string
    checkToday?: boolean
  }) => Promise<void>
  getAttendanceById: (courseId: string, date: string) => Promise<any>
  getStudentAttendanceHistory: (studentId: string) => Promise<any>
  updateAttendanceRecord: (data: UpdateAttendancePayload) => Promise<void>
  restoreAttendance: (id: string) => Promise<void>
  softDeleteAttendance: (id: string) => Promise<void>

  // États additionnels
  error: string | null
  isLoading: boolean
  isPending: boolean
}

const AttendanceContext = createContext<AttendanceContextType | null>(null)

export const AttendancesProvider = ({
  children,
  initialAttendanceData = null,
}: AttendanceProviderProps) => {
  const { toast } = useToast()

  const initialState: AttendanceState = {
    attendanceRecords: [],
    isLoading: false,
    isLoadingAttendance: false,
    error: null,
    allAttendance: initialAttendanceData || [],
    checkOneAttendance: null,
    todayAttendance: null,
    duplicateAttendanceEntries: [],
    registeredStudentIds: [],
    studentsByAbsenceLevel: {
      critical: [],
      warning: [],
      normal: [],
    },
    stats: null,
    deletedRecords: [],
  }

  const [state, dispatch] = useReducer(attendanceReducer, initialState)
  const [isPending, startTransition] = useTransition()

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Attendance Error:', error)
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

  // Fonction pour récupérer les présences d'un cours
  const handleFetchAttendances = useCallback(
    async ({
      courseId,
      checkToday,
    }: {
      courseId: string
      sessionId?: string
      checkToday?: boolean
    }) => {
      try {
        dispatch({ type: 'SET_LOADING_ATTENDANCE', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })

        const response = await getAttendanceById(
          courseId,
          checkToday ? new Date().toISOString() : '',
        )
        if (!response.success) {
          throw new Error(response.error ?? 'Erreur lors de la récupération des présences')
        }

        const data = response.data as unknown
        if (checkToday) {
          if (Array.isArray(data)) {
            throw new Error('Données de présence invalides')
          }
          dispatch({ type: 'SET_TODAY_ATTENDANCE', payload: data as Attendance })
        } else {
          if (!Array.isArray(data)) {
            throw new Error('Données de présence invalides')
          }
          dispatch({ type: 'SET_ALL_ATTENDANCE', payload: data as Attendance[] })
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des présences:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Une erreur est survenue',
        })
      } finally {
        dispatch({ type: 'SET_LOADING_ATTENDANCE', payload: false })
      }
    },
    [],
  )

  // Fonction pour récupérer les détails d'une présence par ID
  const handleGetAttendanceById = useCallback(
    async (courseId: string, date: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })

        const response = await getAttendanceById(courseId, date)
        if (!response.success) {
          throw new Error(response.error ?? 'Erreur lors de la récupération de la présence')
        }

        const data = response.data as unknown
        if (Array.isArray(data)) {
          throw new Error('Données de présence invalides')
        }
        dispatch({ type: 'SET_ONE_ATTENDANCE', payload: data as Attendance })
        return data as Attendance
      } catch (error) {
        console.error('Erreur lors de la récupération de la présence:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Une erreur est survenue',
        })
        throw error
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [],
  )

  // Fonction pour récupérer l'historique des présences d'un étudiant
  const handleGetStudentAttendanceHistory = useCallback(
    async (studentId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })

        const response = await getStudentAttendanceHistory(studentId)
        if (!response.success) {
          throw new Error(response.error ?? 'Erreur lors de la récupération de l\'historique')
        }

        const data = response.data as unknown
        if (!Array.isArray(data)) {
          throw new Error('Données d\'historique invalides')
        }
        dispatch({ type: 'SET_ATTENDANCE_RECORDS', payload: data as AttendanceRecord[] })
        return data as AttendanceRecord[]
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Une erreur est survenue',
        })
        throw error
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [],
  )

  // Fonction pour créer un nouvel enregistrement de présence
  const handleCreateAttendanceRecord = useCallback(
    async (data: CreateAttendancePayload) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        startTransition(async () => {
          const response = await createAttendanceRecord(data)

          if (!response.success) {
            throw new Error(response.error ?? 'Erreur lors de la création de la présence')
          }

          toast({
            title: 'Succès',
            variant: 'success',
            description: 'Présence enregistrée avec succès',
          })

          // Rafraîchir les données si nécessaire
          if (data.courseId) {
            await handleFetchAttendances({ courseId: data.courseId })
          }
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la création de la présence')
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError, toast, handleFetchAttendances],
  )

  // Fonction pour supprimer un enregistrement de présence
  const handleDeleteAttendanceRecord = useCallback(
    async (id: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })

        const response = await deleteAttendance(id)
        if (!response.success) {
          throw new Error(response.error ?? 'Erreur lors de la suppression de la présence')
        }

        // Mettre à jour l'état en supprimant la présence
        if (state.allAttendance) {
          dispatch({
            type: 'SET_ALL_ATTENDANCE',
            payload: state.allAttendance.filter((attendance) => attendance.id !== id),
          })
        }

        toast({
          title: 'Succès',
          description: 'Présence supprimée avec succès',
        })
      } catch (error) {
        console.error('Erreur lors de la suppression de la présence:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Une erreur est survenue',
        })
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Une erreur est survenue',
          variant: 'destructive',
        })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [state.allAttendance, toast],
  )

  // Fonction pour mettre à jour un enregistrement de présence
  const handleUpdateAttendanceRecord = useCallback(
    async (data: UpdateAttendancePayload) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        startTransition(async () => {
          const response = await updateAttendanceRecord(data)

          if (!response.success) {
            throw new Error(response.error ?? 'Erreur lors de la mise à jour de la présence')
          }

          toast({
            title: 'Succès',
            variant: 'success',
            description: 'Présence mise à jour avec succès',
            duration: 3000,
          })
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la mise à jour de la présence')
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [handleError, toast],
  )

  // Fonction pour archiver un enregistrement de présence
  const handleSoftDeleteAttendance = useCallback(
    async (id: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })

        const response = await softDeleteAttendance(id)
        if (!response.success) {
          throw new Error(response.error ??
          'Erreur lors de la suppression temporaire de la présence')
        }

        // Mettre à jour l'état en marquant la présence comme supprimée
        if (state.allAttendance) {
          dispatch({
            type: 'SET_ALL_ATTENDANCE',
            payload: state.allAttendance.map((attendance) =>
              attendance.id === id ? { ...attendance, is_active: false } : attendance,
            ),
          })
        }

        toast({
          title: 'Succès',
          description: 'Présence supprimée temporairement avec succès',
        })
      } catch (error) {
        console.error('Erreur lors de la suppression temporaire de la présence:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Une erreur est survenue',
        })
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Une erreur est survenue',
          variant: 'destructive',
        })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [state.allAttendance, toast],
  )

  // Fonction pour restaurer un enregistrement de présence archivé
  const handleRestoreAttendance = useCallback(
    async (id: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })

        const response = await restoreAttendance(id)
        if (!response.success) {
          throw new Error(response.error ?? 'Erreur lors de la restauration de la présence')
        }

        // Mettre à jour l'état en restaurant la présence
        if (state.allAttendance) {
          dispatch({
            type: 'SET_ALL_ATTENDANCE',
            payload: state.allAttendance.map((attendance) =>
              attendance.id === id ? { ...attendance, is_active: true } : attendance,
            ),
          })
        }

        toast({
          title: 'Succès',
          description: 'Présence restaurée avec succès',
        })
      } catch (error) {
        console.error('Erreur lors de la restauration de la présence:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Une erreur est survenue',
        })
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Une erreur est survenue',
          variant: 'destructive',
        })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [state.allAttendance, toast],
  )

  // Compiler les valeurs du contexte
  const value = useMemo(
    () => ({
      ...state,
      isPending,
      createAttendanceRecord: handleCreateAttendanceRecord,
      deleteAttendance: handleDeleteAttendanceRecord,
      fetchAttendances: handleFetchAttendances,
      getAttendanceById: handleGetAttendanceById,
      getStudentAttendanceHistory: handleGetStudentAttendanceHistory,
      updateAttendanceRecord: handleUpdateAttendanceRecord,
      restoreAttendance: handleRestoreAttendance,
      softDeleteAttendance: handleSoftDeleteAttendance,
    }),
    [
      state,
      isPending,
      handleCreateAttendanceRecord,
      handleDeleteAttendanceRecord,
      handleFetchAttendances,
      handleGetAttendanceById,
      handleGetStudentAttendanceHistory,
      handleUpdateAttendanceRecord,
      handleRestoreAttendance,
      handleSoftDeleteAttendance,
    ],
  )

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>
}

export const useAttendances = () => {
  const context = useContext(AttendanceContext)
  if (!context) {
    throw new Error('useAttendances doit être utilisé à l\'intérieur d\'un AttendancesProvider')
  }
  return context
}
