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

import { Holiday } from '@/zUnused/mongo/holidays'

import { getCurrentHolidays, saveHolidays } from '@/server/actions/context/holidays'

interface HolidayState {
  holidays: Holiday[]
  isLoading: boolean
  error: string | null
}

interface HolidaysProviderProps {
  children: ReactNode
  initialHolidaysData?: Holiday[] | null
}

type HolidayAction =
  | {type: 'SET_HOLIDAYS'; payload: Holiday[]}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_ERROR'; payload: string | null}

function holidayReducer(state: HolidayState, action: HolidayAction): HolidayState {
  switch (action.type) {
  case 'SET_HOLIDAYS':
    return {
      ...state,
      holidays: action.payload,
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
  default:
    return state
  }
}

interface SaveHolidayData {
  updatedBy: string
  holidays: Holiday[]
}

interface HolidayContextType extends HolidayState {
  getCurrentHolidays: () => Promise<void>
  saveHolidays: (holidayData: SaveHolidayData) => Promise<void>
}

const HolidayContext = createContext<HolidayContextType | null>(null)

export const HolidaysProvider = ({
  children,
  initialHolidaysData = null,
}: HolidaysProviderProps) => {
  const { toast } = useToast()

  // Utiliser les données initiales si disponibles
  const initialState: HolidayState = {
    holidays: initialHolidaysData || [],
    isLoading: !initialHolidaysData, // Marquer comme chargé si nous avons déjà des données
    error: null,
  }

  const [state, dispatch] = useReducer(holidayReducer, initialState)

  // État Supabase
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

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
      console.error('Holiday Error:', error)
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

  const handleGetCurrentHolidays = useCallback(async () => {
    // Si nous avons déjà des données initiales, ne chargeons pas à nouveau
    if (initialHolidaysData && initialHolidaysData.length > 0 && !state.isLoading) {
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      if (!isAuthenticated || !user) {
        throw new Error('Non authentifié')
      }

      const response = await getCurrentHolidays(user.id)

      if (!response.success) {
        throw new Error(response.message || 'Échec de la récupération des vacances')
      }

      // Extraire les vacances de la réponse
      const data = response.data as any
      const holidays = data.holidays || []

      dispatch({
        type: 'SET_HOLIDAYS',
        payload: holidays as Holiday[],
      })
    } catch (error) {
      handleError(error as Error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError, initialHolidaysData, user, isAuthenticated, state.isLoading])

  const handleSaveHolidays = useCallback(
    async (holidayData: SaveHolidayData) => {
      try {
        const response = await saveHolidays(holidayData)

        if (!response.success) {
          throw new Error(response.message || 'Échec de la mise à jour des vacances')
        }

        // Extraire les vacances de la réponse
        const data = response.data as any
        const holidays = data.holidays || []

        dispatch({
          type: 'SET_HOLIDAYS',
          payload: holidays as Holiday[],
        })

        toast({
          title: 'Succès',
          description: 'Vacances enregistrées avec succès',
          duration: 3000,
        })
      } catch (error) {
        handleError(error as Error)
      }
    },
    [handleError, toast],
  )

  // Utilisez une ref pour suivre si nous avons déjà fait le chargement
  const hasLoadedRef = useRef(!!initialHolidaysData)

  useEffect(() => {
    // Seulement charger si pas encore chargé et utilisateur disponible
    if (!initialHolidaysData && !hasLoadedRef.current &&
        !authLoading && isAuthenticated && user?.id) {
      handleGetCurrentHolidays()
      hasLoadedRef.current = true
    }
  }, [user, isAuthenticated, authLoading, initialHolidaysData, handleGetCurrentHolidays])

  const value = useMemo(
    () => ({
      ...state,
      getCurrentHolidays: handleGetCurrentHolidays,
      saveHolidays: handleSaveHolidays,
    }),
    [state, handleGetCurrentHolidays, handleSaveHolidays],
  )

  return <HolidayContext.Provider value={value}>{children}</HolidayContext.Provider>
}

export const useHolidays = () => {
  const context = useContext(HolidayContext)
  if (!context) {
    throw new Error('useHolidays must be used within a HolidayProvider')
  }
  return context
}
