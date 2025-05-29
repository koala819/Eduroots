'use client'

import {useSession} from 'next-auth/react'
import {createContext, useContext, useEffect, useState} from 'react'

import {AppConfig, ThemeConfig} from '@/types/models'

import {fetchWithAuth} from '@/lib/fetchWithAuth'
import {generateDefaultTheme} from '@/lib/utils'

interface ConfigContextType {
  error: string | null
  loading: boolean
  theme: ThemeConfig
  academicYearStart: Date | null
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export const ConfigProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {data: session, status: sessionStatus} = useSession()
  const [state, setState] = useState<ConfigContextType>({
    error: null,
    loading: true,
    theme: generateDefaultTheme('student'),
    academicYearStart: null,
  })

  useEffect(() => {
    const loadTheme = async () => {
      if (sessionStatus !== 'authenticated') return

      const userRole = (session?.user?.role as keyof AppConfig['themes']) || 'student'
      const cacheKey = `appTheme_${userRole}`

      const isEqual = (obj1: any, obj2: any): boolean => {
        return JSON.stringify(obj1) === JSON.stringify(obj2)
      }

      const fetchFromAPI = async () => {
        try {
          const response = await fetchWithAuth('/api/config', {method: 'GET'})
          if (response.status === 200 && response.data) {
            // const apiTheme = response.data.themes[userRole]
            const defaultTheme = generateDefaultTheme(userRole)

            const newTheme = {
              buttonVariants: {
                ...defaultTheme.buttonVariants,
                // ...apiTheme.buttonVariants,
              },
              // cardHeader: apiTheme.cardHeader || defaultTheme.cardHeader,
              // loader: apiTheme.loader || defaultTheme.loader,
            }

            return {
              theme: newTheme,
              academicYearStart: new Date(response.data.academicYearStart),
            }
          } else {
            console.log('zOLDTHEME::Réponse invalide du serveur')
          }
        } catch (error) {
          console.error('Échec du chargement du thème:', error)
          throw error
        }
      }

      const cachedConfig = localStorage.getItem(cacheKey)
      let cachedData: {
        theme: any
        academicYearStart: any
      } | null = null
      if (cachedConfig) {
        cachedData = JSON.parse(cachedConfig)
        setState((prevState) => ({
          ...prevState,
          theme: cachedData?.theme,
          academicYearStart: new Date(cachedData?.academicYearStart),
          loading: false,
        }))
      }

      try {
        const freshData = await fetchFromAPI()

        if (
          !cachedData ||
          !isEqual(cachedData.theme, freshData?.theme) ||
          cachedData.academicYearStart !== freshData?.academicYearStart.toISOString()
        ) {
          // setState((prevState) => ({
          //   ...prevState,
          //   theme: freshData.theme,
          //   academicYearStart: freshData.academicYearStart,
          //   loading: false,
          // }))

          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              theme: freshData?.theme,
              academicYearStart: freshData?.academicYearStart.toISOString(),
            }),
          )
        }
      } catch (error) {
        setState((prevState) => ({
          ...prevState,
          error: 'Échec du chargement du thème. Utilisation du thème par défaut.',
          loading: false,
          theme: cachedData?.theme || generateDefaultTheme(userRole),
        }))
      }
    }

    loadTheme()
  }, [session?.user?.role, sessionStatus])

  return <ConfigContext.Provider value={state}>{children}</ConfigContext.Provider>
}

export const useConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error("useConfig doit être utilisé à l'intérieur d'un ConfigProvider")
  }
  return context
}
