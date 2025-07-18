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
import { getCurrentHolidays, saveHolidays } from '@/server/actions/api/holidays'
import { getAuthUser } from '@/server/actions/auth'
import { Holiday } from '@/types/holidays'

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

  // Ref pour éviter les appels multiples
  const hasLoadedRef = useRef(!!initialHolidaysData)

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

  const handleGetCurrentHolidays = useCallback(async () => {
    // Si nous avons déjà des données initiales ou déjà chargé, ne chargeons pas à nouveau
    if (initialHolidaysData || hasLoadedRef.current) {
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
        throw new Error(authResponse.message || 'Erreur d\'authentification')
      }

      const response = await getCurrentHolidays(user.id)

      if (!response.success) {
        throw new Error(response.message || 'Échec de la récupération des vacances')
      }

      // Extraire les vacances de la réponse
      const data = response.data as any
      const holidays = data.holidays ?? []

      dispatch({
        type: 'SET_HOLIDAYS',
        payload: holidays as Holiday[],
      })

      hasLoadedRef.current = true
    } catch (error) {
      handleError(error as Error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [handleError, initialHolidaysData, user, isAuthenticated])

  const handleSaveHolidays = useCallback(
    async (holidayData: SaveHolidayData) => {
      try {
        if (!isAuthenticated || !user) {
          throw new Error('Non authentifié')
        }

        // Utiliser getAuthUser pour récupérer l'utilisateur authentifié
        const authResponse = await getAuthUser(user.id)

        if (!authResponse.success || !authResponse.data) {
          throw new Error(authResponse.message || 'Erreur d\'authentification')
        }

        const response = await saveHolidays(holidayData)

        if (!response.success) {
          throw new Error(response.message || 'Échec de la mise à jour des vacances')
        }

        // Extraire les vacances de la réponse
        const data = response.data as any
        const holidays = data.holidays ?? []

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
        handleError(error as Error, 'Erreur lors de la sauvegarde des vacances')
      }
    },
    [handleError, toast, user, isAuthenticated],
  )

  // Effect for initializing data
  useEffect(() => {
    // If we already have initial holiday data, no need to load again
    if (initialHolidaysData) {
      return
    }

    // Only load when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated && user && !hasLoadedRef.current) {
      // Appel direct sans passer par le callback pour éviter la boucle
      const loadHolidays = async () => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true })

          if (!isAuthenticated || !user) {
            throw new Error('Non authentifié')
          }

          // Utiliser getAuthUser pour récupérer l'utilisateur authentifié
          const authResponse = await getAuthUser(user.id)

          if (!authResponse.success || !authResponse.data) {
            throw new Error(authResponse.message || 'Erreur d\'authentification')
          }

          const response = await getCurrentHolidays(user.id)

          if (!response.success) {
            throw new Error(response.message || 'Échec de la récupération des vacances')
          }

          // Extraire les vacances de la réponse
          const data = response.data as any
          const holidays = data.holidays ?? []

          dispatch({
            type: 'SET_HOLIDAYS',
            payload: holidays as Holiday[],
          })

          hasLoadedRef.current = true
        } catch (error) {
          handleError(error as Error)
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      }

      loadHolidays()
    }
  }, [initialHolidaysData, user, isAuthenticated, authLoading, handleError])

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
    throw new Error('useHolidays must be used within a HolidaysProvider')
  }
  return context
}
