'use client'

import { Eye, EyeOff } from 'lucide-react'

import { TogglePasswordVisibilityProps } from '@/types/mongo/models'

const TogglePasswordVisibility: React.FC<TogglePasswordVisibilityProps> = ({
  showPwd,
  setShowPwd,
}) => {
  const Icon = showPwd ? Eye : EyeOff
  return (
    <Icon
      size={25}
      className="cursor-pointer"
      data-testid="toggle-icon"
      onClick={() => setShowPwd((prevState) => !prevState)}
    />
  )
}

export default TogglePasswordVisibility
