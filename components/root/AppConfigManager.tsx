'use client'

import { useCallback, useEffect, useState } from 'react'

import { useToast } from '@/hooks/use-toast'

import { AppConfig, ButtonVariant, ThemeConfig } from '@/types/models'

import { PasswordInput } from '@/components/root/PasswordInput'
import { ThemeSection } from '@/components/root/ThemeSection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { generateDefaultTheme } from '@/lib/utils'
import { format, isValid } from 'date-fns'
import { debounce } from 'lodash'

const initialConfig: AppConfig = {
  studentPassword: '',
  academicYearStart: new Date(),
  teacherPassword: '',
  themes: {
    teacher: generateDefaultTheme('teacher'),
    student: generateDefaultTheme('student'),
    bureau: generateDefaultTheme('bureau'),
  },
}

export const AppConfigManager: React.FC = () => {
  const { toast } = useToast()

  const [config, setConfig] = useState<AppConfig>(initialConfig)
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [originalConfig, setOriginalConfig] = useState<AppConfig | null>(null)
  const [passwords, setPasswords] = useState({
    studentPassword: '',
    teacherPassword: '',
  })
  const [showPwd, setShowPwd] = useState<
    Record<'student' | 'teacher', boolean>
  >({
    student: false,
    teacher: false,
  })

  const debouncedSetConfig = useCallback(
    debounce((newConfig: AppConfig) => {
      setConfig(newConfig)
      setIsDirty(JSON.stringify(newConfig) !== JSON.stringify(originalConfig))
    }, 300),
    [originalConfig],
  )

  const handleThemeChange = useCallback(
    (
      userType: keyof AppConfig['themes'],
      themeSection: keyof ThemeConfig,
      key: string,
      value: string,
    ) => {
      setConfig((prevConfig) => {
        const newConfig = {
          ...prevConfig,
          themes: {
            ...prevConfig.themes,
            [userType]: {
              ...prevConfig.themes[userType],
              [themeSection]:
                themeSection === 'buttonVariants'
                  ? (() => {
                      const currentVariants =
                        prevConfig.themes[userType].buttonVariants
                      if (currentVariants instanceof Map) {
                        return new Map(currentVariants).set(
                          key as ButtonVariant,
                          value,
                        )
                      } else if (
                        typeof currentVariants === 'object' &&
                        !Array.isArray(currentVariants)
                      ) {
                        return {
                          ...(currentVariants as Record<string, string>),
                          [key]: value,
                        }
                      } else {
                        console.error(
                          'Unexpected type for buttonVariants:',
                          currentVariants,
                        )
                        return currentVariants
                      }
                    })()
                  : value,
            },
          },
        }
        setIsDirty(true)
        return newConfig
      })
    },
    [],
  )
  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    try {
      const response = await fetchWithAuth('/api/config', { method: 'GET' })
      if (response.status === 200) {
        const { studentPassword, teacherPassword, ...restConfig } =
          response.data
        setConfig(restConfig)
        setOriginalConfig(restConfig)
        setPasswords({
          studentPassword: studentPassword ? '[DÉFINI]' : '',
          teacherPassword: teacherPassword ? '[DÉFINI]' : '',
        })
      } else {
        throw new Error(response.statusText || 'Failed to fetch configuration')
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch configuration',
        variant: 'destructive',
      })
    }
  }

  function formatDate(dateString: string | Date) {
    if (dateString instanceof Date) {
      return format(dateString, 'yyyy-MM-dd')
    }

    if (typeof dateString === 'string') {
      // Essayer de parser la date
      const parsedDate = new Date(dateString)
      if (isValid(parsedDate)) {
        return format(parsedDate, 'yyyy-MM-dd')
      }
    }

    // Si tout échoue, retourner une chaîne vide ou une valeur par défaut
    console.error('Format de date invalide:', dateString)
    return ''
  }

  function handleChange(section: keyof AppConfig, key: string, value: string) {
    if (key === 'studentPassword' || key === 'teacherPassword') {
      setPasswords((prev) => ({ ...prev, [key]: value }))
      setIsDirty(true)
    } else if (config) {
      debouncedSetConfig({
        ...config,
        [section]:
          section === 'academicYearStart'
            ? new Date(value).toISOString()
            : value,
      })
    }
  }

  async function handleSave() {
    // console.log('config', config)
    try {
      const method = originalConfig ? 'PUT' : 'POST'
      const dataToSend = {
        ...config,
        studentPassword:
          passwords.studentPassword !== '[DÉFINI]'
            ? passwords.studentPassword
            : undefined,
        teacherPassword:
          passwords.teacherPassword !== '[DÉFINI]'
            ? passwords.teacherPassword
            : undefined,
      }
      // console.log('dataToSend', dataToSend)

      const response = await fetchWithAuth('/api/config', {
        method,
        body: dataToSend,
      })
      if (response.status === 200) {
        setOriginalConfig(config)
        setIsDirty(false)
        toast({
          title: 'Success',
          description: 'Configuration saved successfully',
          className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        })
      } else {
        throw new Error(response.statusText || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      })
    }
  }

  if (!config) return <div>Loading...</div>

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <CardHeader>
        <h2 className="text-2xl font-bold">Setup Management</h2>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="flex flex-col sm:flex-row">
            <TabsTrigger value="general" className="flex-1">
              General
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex-1">
              Themes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-8">
            <PasswordInput
              type="student"
              value={passwords.studentPassword}
              onChange={(value: string) =>
                handleChange('studentPassword', 'studentPassword', value)
              }
              showPwd={showPwd}
              setShowPwd={setShowPwd}
            />
            <div>
              <label className="block mb-1">Start of academic year</label>
              <Input
                value={formatDate(config.academicYearStart)}
                onChange={(e) =>
                  handleChange(
                    'academicYearStart',
                    'academicYearStart',
                    e.target.value,
                  )
                }
                type="date"
              />
            </div>
            <PasswordInput
              type="teacher"
              value={passwords.teacherPassword}
              onChange={(value: string) =>
                handleChange('teacherPassword', 'teacherPassword', value)
              }
              showPwd={showPwd}
              setShowPwd={setShowPwd}
            />
          </TabsContent>
          <TabsContent value="themes">
            <ThemeSection
              config={config}
              handleThemeChange={handleThemeChange}
            />
          </TabsContent>
        </Tabs>
        <Button
          onClick={handleSave}
          className="mt-4 w-full sm:w-auto"
          disabled={!isDirty}
        >
          Save config
        </Button>
      </CardContent>
    </Card>
  )
}
