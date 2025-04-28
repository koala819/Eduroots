import { memo, useEffect, useState } from 'react'

import { BackGroundPreview } from '@/components/root/BackGroundPreview'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ThemeInputProps {
  userType: string
  themeKey: string
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
}

const ThemeInput: React.FC<ThemeInputProps> = memo(function ThemeInput({
  userType,
  themeKey,
  value,
  onChange,
  label,
  placeholder,
}) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  return (
    <div className="space-y-2">
      <Label htmlFor={`${userType}-${themeKey}`}>{label}</Label>
      <BackGroundPreview className={localValue} />
      <Input
        id={`${userType}-${themeKey}`}
        value={localValue}
        onChange={(e) => {
          const newValue = e.target.value
          setLocalValue(newValue)
          onChange(newValue)
        }}
        placeholder={placeholder}
      />
    </div>
  )
})

export default ThemeInput
