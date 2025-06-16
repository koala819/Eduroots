'use client'

import { createClient } from '@/client/utils/supabase'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'

import { useToast } from '@/client/hooks/use-toast'

import { TimeSlotEnum } from '@/types/courses'
import { DaySchedule, Period } from '@/types/schedule'

import { getCurrentSchedule, saveSchedules } from '@/server/actions/context/schedules'

interface ScheduleState {
  schedules: {
    [key in TimeSlotEnum]?: DaySchedule
  }
  isLoading: boolean
  error: string | null
}

interface SchedulesProviderProps {
  children: ReactNode
  initialSchedulesData?: DaySchedule[] | null
}

type ScheduleAction =
  | {
      type: 'SET_SCHEDULES'
      payload: {[key in TimeSlotEnum]?: DaySchedule}
    }
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_ERROR'; payload: string | null}
  | {
      type: 'UPDATE_DAY_SCHEDULE'
      payload: {dayType: TimeSlotEnum; periods: Period[]}
    }

function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
  case 'SET_SCHEDULES':
    return {
      ...state,
      schedules: action.payload,
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
  case 'UPDATE_DAY_SCHEDULE':
    return {
      ...state,
      schedules: {
        ...state.schedules,
        [action.payload.dayType]: {
          periods: action.payload.periods,
        },
      },
    }
  default:
    return state
  }
}

interface SaveScheduleData {
  updatedBy: string
  [key: string]: any // pour les daySchedules
}

interface ScheduleContextType extends ScheduleState {
  getCurrentSchedule: () => Promise<void>
  saveSchedules: (scheduleData: SaveScheduleData) => Promise<void>
}

const ScheduleContext = createContext<ScheduleContextType | null>(null)

export const SchedulesProvider = ({
  children,
  initialSchedulesData = null,
}: SchedulesProviderProps) => {
  const { toast } = useToast()

  // Convertir les données initiales en format attendu par l'état
  const convertInitialData = (): {[key in TimeSlotEnum]?: DaySchedule} => {
    // console.log('Initial data received:', initialSchedulesData)
    if (!initialSchedulesData) return {}

    const result: {[key in TimeSlotEnum]?: DaySchedule} = {}

    initialSchedulesData.forEach((schedule) => {
      console.log('Processing schedule:', schedule)
      if (
        schedule &&
        typeof schedule === 'object' &&
        'dayType' in schedule &&
        'periods' in schedule
      ) {
        const dayType = schedule.dayType as string
        // Vérifier que dayType est une valeur valide de TimeSlotEnum
        if (Object.values(TimeSlotEnum).includes(dayType as TimeSlotEnum)) {
          result[dayType as TimeSlotEnum] = {
            periods: schedule.periods,
          }
        } else {
          console.warn(`Invalid dayType value: ${dayType}`)
        }
      }
    })

    // console.log('Converted result:', result)
    return result
  }

  const initialState: ScheduleState = {
    schedules: convertInitialData(),
    isLoading: !initialSchedulesData,
    error: null,
  }

  const [state, dispatch] = useReducer(scheduleReducer, initialState)

  // État Supabase
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Utilisez une ref pour suivre si nous avons déjà fait le chargement
  const hasLoadedRef = useRef(!!initialSchedulesData)

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
        console.error('Erreur récupération utilisateur:', error)
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
      console.error('Schedule Error:', error)
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

  const handleGetCurrentSchedule = useCallback(async () => {
    // Référence locale à hasLoadedRef pour éviter de dépendre du state
    if (hasLoadedRef.current) return

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      if (!isAuthenticated || !user) {
        throw new Error('Non authentifié')
      }

      const response = await getCurrentSchedule(user.id)

      if (!response.success) {
        throw new Error(response.message || 'Échec de la récupération des horaires')
      }

      // console.log('API response data:', response.data)

      // Convertir les données de la réponse dans le format attendu
      const data = response.data as any
      const formattedSchedules: {[key in TimeSlotEnum]?: DaySchedule} = {}

      if (data && typeof data === 'object' && data.daySchedules) {
        // Parcourir les propriétés de daySchedules et les transformer
        Object.entries(data.daySchedules).forEach(([key, value]) => {
          // Vérifier que la clé est une valeur valide de TimeSlotEnum
          if (
            Object.values(TimeSlotEnum).includes(key as TimeSlotEnum) &&
            value &&
            typeof value === 'object'
          ) {
            formattedSchedules[key as TimeSlotEnum] = value as DaySchedule
          }
        })
      }

      // console.log('Formatted schedules:', formattedSchedules)

      dispatch({
        type: 'SET_SCHEDULES',
        payload: formattedSchedules,
      })

      // Une fois les données chargées, marquer comme chargé
      hasLoadedRef.current = true
    } catch (error) {
      handleError(error as Error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError, user, isAuthenticated])

  const handleSaveSchedules = useCallback(
    async (scheduleData: SaveScheduleData) => {
      try {
        const response = await saveSchedules(scheduleData)

        if (!response.success) {
          throw new Error(response.message || 'Échec de l\'enregistrement des horaires')
        }

        // console.log('Save response data:', response.data)

        // Convertir les données de la réponse dans le format attendu
        const data = response.data as any
        const formattedSchedules: {[key in TimeSlotEnum]?: DaySchedule} = {}

        if (data && typeof data === 'object' && data.daySchedules) {
          // Parcourir les propriétés de daySchedules et les transformer
          Object.entries(data.daySchedules).forEach(([key, value]) => {
            if (
              Object.values(TimeSlotEnum).includes(key as TimeSlotEnum) &&
              value &&
              typeof value === 'object'
            ) {
              formattedSchedules[key as TimeSlotEnum] = value as DaySchedule
            }
          })
        }

        // console.log('Formatted schedules after save:', formattedSchedules)

        dispatch({
          type: 'SET_SCHEDULES',
          payload: formattedSchedules,
        })

        toast({
          title: 'Succès',
          description: 'Horaires enregistrés avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error)
      }
    },
    [handleError, toast],
  )

  useEffect(() => {
    // Seulement charger si pas encore chargé et utilisateur disponible
    if (!hasLoadedRef.current && !authLoading && isAuthenticated && user?.id) {
      handleGetCurrentSchedule()
    }
  }, [handleGetCurrentSchedule, user, isAuthenticated, authLoading])

  const value = useMemo(
    () => ({
      ...state,
      getCurrentSchedule: handleGetCurrentSchedule,
      saveSchedules: handleSaveSchedules,
    }),
    [state, handleGetCurrentSchedule, handleSaveSchedules],
  )

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}

export const useSchedules = () => {
  const context = useContext(ScheduleContext)
  if (!context) {
    throw new Error('useSchedules must be used within a SchedulesProvider')
  }
  return context
}
