import { memo, useCallback, useEffect, useState } from 'react'

import { AppConfig, ThemeConfig } from '@/zUnused/mongo/models'

import { ButtonPreview } from '@/server/components/root/ButtonPreview'
import ThemeInput from '@/client/components/root/ThemeInput'
import { Card, CardContent, CardHeader } from '@/client/components/ui/card'
import { Input } from '@/client/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/components/ui/tabs'

type UserType = 'teacher' | 'student' | 'bureau'

interface ThemeSectionProps {
  config: AppConfig
  handleThemeChange: (
    userType: keyof AppConfig['themes'],
    themeSection: keyof ThemeConfig,
    key: string,
    value: string,
  ) => void
}

const ButtonVariantInput: React.FC<{
  userType: UserType
  buttonKey: string
  value: string
  onChange: (value: string) => void
}> = memo(function ButtonVariantInput({ userType, buttonKey, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <ButtonPreview className={value} title={buttonKey} />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Classes pour le bouton ${buttonKey}`}
        />
      </div>
    </div>
  )
})

export const ThemeSection: React.FC<ThemeSectionProps> = ({ config, handleThemeChange }) => {
  const userTypes: UserType[] = ['teacher', 'student', 'bureau']
  const [localConfig, setLocalConfig] = useState(config)

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  const handleLocalChange = useCallback(
    (userType: UserType, themeSection: keyof ThemeConfig, key: string, value: string) => {
      setLocalConfig((prevConfig) => {
        const newConfig = {
          ...prevConfig,
          themes: {
            ...prevConfig.themes,
            [userType]: {
              ...prevConfig.themes[userType],
              [themeSection]:
                themeSection === 'buttonVariants'
                  ? {
                    ...prevConfig.themes[userType].buttonVariants,
                    [key]: value,
                  }
                  : value,
            },
          },
        }
        return newConfig
      })
      handleThemeChange(userType, themeSection, key, value)
    },
    [handleThemeChange],
  )

  const renderThemeInputs = useCallback(
    (userType: UserType) => (
      <Card>
        <CardHeader />
        <CardContent className="space-y-6">
          {/* Loader */}
          <ThemeInput
            userType={userType}
            themeKey="Loader"
            value={localConfig.themes[userType].loader || ''}
            onChange={(value) => handleLocalChange(userType, 'loader', `${userType}Loader`, value)}
            label="Loader Background"
            placeholder="e.g. bg-blue-500"
          />

          {/* Card Header */}
          <ThemeInput
            userType={userType}
            themeKey="CardHeader"
            value={localConfig.themes[userType].cardHeader || ''}
            onChange={(value) =>
              handleLocalChange(userType, 'cardHeader', `${userType}CardHeader`, value)
            }
            label="Card Header"
            placeholder="e.g. bg-gradient-to-r from-blue-500 to-purple-600"
          />

          <div className="space-y-4">
            <h4 className="font-medium">BUTTONS</h4>
            {Object.entries(localConfig.themes[userType].buttonVariants).map(([key, value]) => (
              <ButtonVariantInput
                key={key}
                userType={userType}
                buttonKey={key}
                value={value}
                onChange={(newValue) =>
                  handleLocalChange(userType, 'buttonVariants', key, newValue)
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>
    ),
    [localConfig, handleLocalChange],
  )

  return (
    <Tabs defaultValue="teacher">
      <TabsList className="w-full">
        <TabsTrigger value="teacher" className="w-1/3">
          Teachers
        </TabsTrigger>
        <TabsTrigger value="student" className="w-1/3">
          Students
        </TabsTrigger>
        <TabsTrigger value="bureau" className="w-1/3">
          Office
        </TabsTrigger>
      </TabsList>
      {userTypes.map((type) => (
        <TabsContent key={type} value={type}>
          {renderThemeInputs(type)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
