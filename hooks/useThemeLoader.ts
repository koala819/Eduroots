import {useState} from 'react'

import {ThemeConfig} from '@/types/models'

import {fetchWithAuth} from '@/lib/fetchWithAuth'

export function useThemeLoader() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTheme = async (userRole: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchWithAuth('/api/config', {method: 'GET'})

      if (response.status === 200 && response.data) {
        const themeData = response.data.themes[userRole]

        setTheme(themeData)
        localStorage.setItem(`theme_${userRole}`, JSON.stringify(themeData))
      } else {
        throw new Error('Invalid server response')
      }
    } catch (err) {
      console.error('Failed to load theme:', err)
      setError('Error loading theme')
    } finally {
      setLoading(false)
    }
  }

  return {theme, loading, error, loadTheme}
}
