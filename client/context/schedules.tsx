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
  useState,
} from 'react'

import { useToast } from '@/client/hooks/use-toast'
import { createClient } from '@/client/utils/supabase'
import { getCurrentSchedule, saveSchedules } from '@/server/actions/api/schedules'
import { getAuthUser } from '@/server/actions/auth'
import { TimeSlotEnum } from '@/types/courses'
import { DaySchedule, Period } from '@/types/schedule'

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

  const handleGetCurrentSchedule = useCallback(async () => {
    // Si nous avons déjà des données initiales ou déjà chargé, ne chargeons pas à nouveau
    if (initialSchedulesData || hasLoadedRef.current) {
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      if (!isAuthenticated || !user) {
        throw new Error('Non authentifié')
      }

      // Utiliser getAuthUser pour récupérer l'utilisateur authentifié
      const authResponse = await getAuthUser(user.id)

      if (!authResponse.success || !authResponse.data) {
        // Si l'utilisateur n'est pas trouvé dans education.users,
        // on ne charge simplement pas les schedules (pas d'erreur critique)
        if (authResponse.message?.includes('non trouvé')) {
          console.warn('Utilisateur non trouvé dans education.users, schedules non chargés')
          hasLoadedRef.current = true
          return
        }
        throw new Error(authResponse.message || 'Erreur d\'authentification')
      }

      const response = await getCurrentSchedule(user.id)

      if (!response.success) {
        throw new Error(response.message || 'Échec de la récupération des horaires')
      }

      // Extraire les horaires de la réponse
      const data = response.data as any
      const schedules = data.schedules ?? []

      // Convertir les données en format attendu
      const convertedSchedules: {[key in TimeSlotEnum]?: DaySchedule} = {}
      schedules.forEach((schedule: any) => {
        if (schedule && schedule.dayType && schedule.periods) {
          convertedSchedules[schedule.dayType as TimeSlotEnum] = {
            periods: schedule.periods,
          }
        }
      })

      dispatch({
        type: 'SET_SCHEDULES',
        payload: convertedSchedules,
      })

      hasLoadedRef.current = true
    } catch (error) {
      handleError(error as Error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError, initialSchedulesData, user, isAuthenticated])

  const handleSaveSchedules = useCallback(
    async (scheduleData: SaveScheduleData) => {
      try {
        if (!isAuthenticated || !user) {
          throw new Error('Non authentifié')
        }

        // Utiliser getAuthUser pour récupérer l'utilisateur authentifié
        const authResponse = await getAuthUser(user.id)

        if (!authResponse.success || !authResponse.data) {
          // Si l'utilisateur n'est pas trouvé dans education.users,
          // on ne peut pas sauvegarder les schedules
          if (authResponse.message?.includes('non trouvé')) {
            throw new Error('Impossible de sauvegarder : utilisateur non trouvé dans la base de données')
          }
          throw new Error(authResponse.message || 'Erreur d\'authentification')
        }

        const response = await saveSchedules(scheduleData)

        if (!response.success) {
          throw new Error(response.message || 'Échec de la mise à jour des horaires')
        }

        // Extraire les horaires de la réponse
        const data = response.data as any
        const schedules = data.schedules ?? []

        // Convertir les données en format attendu
        const convertedSchedules: {[key in TimeSlotEnum]?: DaySchedule} = {}
        schedules.forEach((schedule: any) => {
          if (schedule && schedule.dayType && schedule.periods) {
            convertedSchedules[schedule.dayType as TimeSlotEnum] = {
              periods: schedule.periods,
            }
          }
        })

        dispatch({
          type: 'SET_SCHEDULES',
          payload: convertedSchedules,
        })

        toast({
          title: 'Succès',
          description: 'Horaires enregistrés avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error, 'Erreur lors de la sauvegarde des horaires')
      }
    },
    [handleError, toast, user, isAuthenticated],
  )

  // Effect for initializing data
  useEffect(() => {
    // If we already have initial schedule data, no need to load again
    if (initialSchedulesData) {
      console.log('Using initial schedule data, skipping fetch')
      return
    }

    // Only load when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated && user && !hasLoadedRef.current) {
      // Appel direct sans passer par le callback pour éviter la boucle
      const loadSchedules = async () => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true })

          if (!isAuthenticated || !user) {
            throw new Error('Non authentifié')
          }

          // Utiliser getAuthUser pour récupérer l'utilisateur authentifié
          const authResponse = await getAuthUser(user.id)

          if (!authResponse.success || !authResponse.data) {
            // Si l'utilisateur n'est pas trouvé dans education.users,
            // on ne charge simplement pas les schedules (pas d'erreur critique)
            if (authResponse.message?.includes('non trouvé')) {
              console.warn('Utilisateur non trouvé dans education.users, schedules non chargés')
              hasLoadedRef.current = true
              return
            }
            throw new Error(authResponse.message || 'Erreur d\'authentification')
          }

          const response = await getCurrentSchedule(user.id)

          if (!response.success) {
            throw new Error(response.message || 'Échec de la récupération des horaires')
          }

          // Extraire les horaires de la réponse
          const data = response.data as any
          const schedules = data.schedules ?? []

          // Convertir les données en format attendu
          const convertedSchedules: {[key in TimeSlotEnum]?: DaySchedule} = {}
          schedules.forEach((schedule: any) => {
            if (schedule && schedule.dayType && schedule.periods) {
              convertedSchedules[schedule.dayType as TimeSlotEnum] = {
                periods: schedule.periods,
              }
            }
          })

          dispatch({
            type: 'SET_SCHEDULES',
            payload: convertedSchedules,
          })

          hasLoadedRef.current = true
        } catch (error) {
          handleError(error as Error)
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      }

      loadSchedules()
    }
  }, [initialSchedulesData, user, isAuthenticated, authLoading, handleError])

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
