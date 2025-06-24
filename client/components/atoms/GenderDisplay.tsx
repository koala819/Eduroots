import { User } from 'lucide-react'
import { ReactElement } from 'react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { GenderEnum } from '@/types/user'


export const GenderDisplay = ({
  gender,
  size = 'w-5 h-5',
}: {
  gender: GenderEnum |string | null | undefined
  size?: string
  }): ReactElement => {

  if (!gender) {
    return <User className={`${size} text-muted-foreground`} />
  }

  const normalizedGender = typeof gender === 'string'
    ? gender.toLowerCase()
    : gender

  return (
    <div className="flex-shrink-0">
      {normalizedGender === GenderEnum.Masculin ? (
        <BiMale className={`${size} text-info-dark`} />
      ) : (
        <BiFemale className={`${size} text-pink`} />
      )}
    </div>
  )
}

