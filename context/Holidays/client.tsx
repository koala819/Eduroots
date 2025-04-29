'use client'

import {useSession} from 'next-auth/react'
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

import {useToast} from '@/hooks/use-toast'

import {Holiday} from '@/types/holidays'

import {getCurrentHolidays, saveHolidays} from '@/app/actions/context/holidays'

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

export const HolidaysProvider = ({children, initialHolidaysData = null}: HolidaysProviderProps) => {
  const {toast} = useToast()

  // Utiliser les données initiales si disponibles
  const initialState: HolidayState = {
    holidays: initialHolidaysData || [],
    isLoading: !initialHolidaysData, // Marquer comme chargé si nous avons déjà des données
    error: null,
  }

  const [state, dispatch] = useReducer(holidayReducer, initialState)
  const {data: session} = useSession()

  const handleError = useCallback(
    (error: Error, customMessage?: string) => {
      console.error('Holiday Error:', error)
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

  const handleGetCurrentHolidays = useCallback(async () => {
    // Si nous avons déjà des données initiales, ne chargeons pas à nouveau
    if (initialHolidaysData && initialHolidaysData.length > 0 && !state.isLoading) {
      return
    }

    dispatch({type: 'SET_LOADING', payload: true})

    try {
      if (!session || !session.user) {
        throw new Error('Non authentifié')
      }

      const response = await getCurrentHolidays(session.user._id)

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
      dispatch({type: 'SET_LOADING', payload: false})
    }
  }, [handleError, initialHolidaysData, session, state.isLoading])

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
    // Seulement charger si pas encore chargé et session disponible
    if (!initialHolidaysData && !hasLoadedRef.current && session?.user?._id) {
      handleGetCurrentHolidays()
      hasLoadedRef.current = true
    }
  }, [session, initialHolidaysData, handleGetCurrentHolidays])

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
