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

import {useToast} from '@/hooks/use-toast'

import {AttendanceStats, GroupedAbsences} from '@/types/attendance'
import {
  AttendanceRecord,
  CreateAttendancePayload,
  DuplicateRecords,
  UpdateAttendancePayload,
} from '@/types/attendance'
import {AttendanceDocument} from '@/types/mongoose'

import {
  createAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceById,
  getStudentAttendanceHistory,
  restoreAttendance,
  softDeleteAttendance,
  updateAttendanceRecord,
} from '@/app/actions/context/attendances'

interface AttendanceState {
  attendanceRecords: AttendanceRecord[]
  duplicateAttendanceEntries: DuplicateRecords[]
  error: string | null
  isLoading: boolean
  isLoadingAttendance: boolean
  registeredStudentIds: string[]
  studentsByAbsenceLevel: GroupedAbsences
  stats: AttendanceStats | null
  deletedRecords: AttendanceRecord[]
  allAttendance: AttendanceDocument[] | null
  checkOneAttendance: AttendanceDocument | null
  todayAttendance: AttendanceDocument | null
}

interface AttendanceProviderProps {
  children: ReactNode
  initialAttendanceData?: AttendanceDocument[] | null
}

type AttendanceAction =
  | {type: 'SET_LOADING_ATTENDANCE'; payload: boolean}
  | {type: 'SET_ALL_ATTENDANCE'; payload: AttendanceDocument[]}
  | {type: 'SET_ONE_ATTENDANCE'; payload: AttendanceDocument}
  | {type: 'SET_TODAY_ATTENDANCE'; payload: AttendanceDocument}
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
  | {type: 'SET_GROUPED_STUDENTS'; payload: Record<string, any[]>}
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
        attendanceRecords: state.attendanceRecords.map((record) =>
          record.id === action.payload
            ? {...record, isActive: false, deletedAt: new Date()}
            : record,
        ),
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
          {
            ...state.deletedRecords.find((r) => r.id === action.payload)!,
            isActive: true,
            deletedAt: null,
          },
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
  deleteAttendanceRecord: (id: string) => Promise<void>
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
  const {toast} = useToast()

  const initialState: AttendanceState = {
    attendanceRecords: [],
    registeredStudentIds: [],
    duplicateAttendanceEntries: [],
    studentsByAbsenceLevel: {},
    isLoading: false,
    isLoadingAttendance: false,
    error: null,
    stats: null,
    deletedRecords: [],
    allAttendance: initialAttendanceData || [],
    checkOneAttendance: null,
    todayAttendance: null,
  }

  const [state, dispatch] = useReducer(attendanceReducer, initialState)
  const [isPending, startTransition] = useTransition()

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Attendance Error:', error)
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

  // Fonction pour récupérer les présences d'un cours
  const handleFetchAttendances = useCallback(
    async ({
      courseId,
      sessionId,
      checkToday,
    }: {
      courseId: string
      sessionId?: string
      checkToday?: boolean
    }) => {
      dispatch({type: 'SET_LOADING_ATTENDANCE', payload: true})
      try {
        const response = await getAttendanceById(courseId, sessionId || '', checkToday)
        // Check if the response is successful and has data
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch attendance data')
        }

        if (sessionId) {
          dispatch({
            type: 'SET_ONE_ATTENDANCE',
            payload: response.data as any,
          })
        } else if (checkToday) {
          dispatch({
            type: 'SET_TODAY_ATTENDANCE',
            payload: response.data as any,
          })
        } else {
          dispatch({
            type: 'SET_ALL_ATTENDANCE',
            payload: response.data as any,
          })
        }
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la récupération des présences')
      } finally {
        dispatch({type: 'SET_LOADING_ATTENDANCE', payload: false})
      }
    },
    [handleError],
  )

  // Fonction pour récupérer les détails d'une présence par ID
  const handleGetAttendanceById = useCallback(
    async (courseId: string, date: string) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        const response = await getAttendanceById(courseId, date)
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch attendance data')
        }
        return response.data
      } catch (error) {
        handleError(
          error as Error,
          `Erreur lors de la récupération de la présence pour le cours ${courseId}`,
        )
        return null
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError],
  )

  // Fonction pour récupérer l'historique des présences d'un étudiant
  const handleGetStudentAttendanceHistory = useCallback(
    async (studentId: string) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        const response = await getStudentAttendanceHistory(studentId)
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch attendance history')
        }
        return response.data
      } catch (error) {
        handleError(
          error as Error,
          `Erreur lors de la récupération de l'historique des présences de l'étudiant ${studentId}`,
        )
        return []
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError],
  )

  // Fonction pour créer un nouvel enregistrement de présence
  const handleCreateAttendanceRecord = useCallback(
    async (data: CreateAttendancePayload) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        startTransition(async () => {
          const response = await createAttendanceRecord(data)

          if (!response.success) {
            throw new Error(response.error || 'Erreur lors de la création de la présence')
          }

          toast({
            title: 'Succès',
            variant: 'success',
            description: 'Présence enregistrée avec succès',
          })

          // Rafraîchir les données si nécessaire
          if (data.courseId) {
            await handleFetchAttendances({courseId: data.courseId})
          }
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la création de la présence')
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError, toast, handleFetchAttendances],
  )

  // Fonction pour supprimer un enregistrement de présence
  const handleDeleteAttendanceRecord = useCallback(
    async (id: string) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        startTransition(async () => {
          const response = await deleteAttendanceRecord(id)

          if (!response.success) {
            throw new Error(response.error || 'Erreur lors de la suppression de la présence')
          }

          dispatch({type: 'DELETE_ATTENDANCE', payload: id})

          toast({
            title: 'Succès',
            description: 'Présence supprimée avec succès',
            duration: 3000,
          })
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la suppression de la présence')
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError, toast],
  )

  // Fonction pour mettre à jour un enregistrement de présence
  const handleUpdateAttendanceRecord = useCallback(
    async (data: UpdateAttendancePayload) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        startTransition(async () => {
          const response = await updateAttendanceRecord(data)

          if (!response.success) {
            throw new Error(response.error || 'Erreur lors de la mise à jour de la présence')
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
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError, toast],
  )

  // Fonction pour archiver un enregistrement de présence
  const handleSoftDeleteAttendance = useCallback(
    async (id: string) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        startTransition(async () => {
          const response = await softDeleteAttendance(id)

          if (
            !response ||
            (typeof response === 'object' && 'success' in response && !response.success)
          ) {
            throw new Error("Erreur lors de l'archivage de la présence")
          }

          dispatch({type: 'SOFT_DELETE_ATTENDANCE', payload: id})

          toast({
            title: 'Succès',
            description: 'Enregistrement archivé avec succès',
          })
        })
      } catch (error) {
        handleError(error as Error, "Erreur lors de l'archivage de la présence")
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError, toast],
  )

  // Fonction pour restaurer un enregistrement de présence archivé
  const handleRestoreAttendance = useCallback(
    async (id: string) => {
      dispatch({type: 'SET_LOADING', payload: true})
      try {
        startTransition(async () => {
          const response = await restoreAttendance(id)

          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la restauration de la présence')
          }

          dispatch({type: 'RESTORE_ATTENDANCE', payload: id})

          toast({
            title: 'Succès',
            description: 'Enregistrement restauré avec succès',
          })
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la restauration de la présence')
      } finally {
        dispatch({type: 'SET_LOADING', payload: false})
      }
    },
    [handleError, toast],
  )

  // Compiler les valeurs du contexte
  const value = useMemo(
    () => ({
      ...state,
      createAttendanceRecord: handleCreateAttendanceRecord,
      deleteAttendanceRecord: handleDeleteAttendanceRecord,
      fetchAttendances: handleFetchAttendances,
      getAttendanceById: handleGetAttendanceById,
      getStudentAttendanceHistory: handleGetStudentAttendanceHistory,
      updateAttendanceRecord: handleUpdateAttendanceRecord,
      softDeleteAttendance: handleSoftDeleteAttendance,
      restoreAttendance: handleRestoreAttendance,
      isPending,
    }),
    [
      state,
      handleCreateAttendanceRecord,
      handleDeleteAttendanceRecord,
      handleFetchAttendances,
      handleGetAttendanceById,
      handleGetStudentAttendanceHistory,
      handleUpdateAttendanceRecord,
      handleSoftDeleteAttendance,
      handleRestoreAttendance,
      isPending,
    ],
  )

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>
}

export const useAttendance = () => {
  const context = useContext(AttendanceContext)
  if (!context) {
    throw new Error('useAttendance must be used within an AttendancesProvider')
  }
  return context
}
