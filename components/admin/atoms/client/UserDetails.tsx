'use client'

import {BiFemale, BiMale} from 'react-icons/bi'

import {GenderEnum} from '@/types/user'

interface UserDetailsClientProps {
  gender: GenderEnum
  dateOfBirth?: string | Date
}

export function UserDetailsClient({gender, dateOfBirth}: UserDetailsClientProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold text-sm text-gray-500">Genre</h4>
        <p>
          {gender === GenderEnum.Masculin ? (
            <BiMale className="text-blue-500 h-6 w-6 md:h-8 md:w-8" />
          ) : (
            <BiFemale className="text-pink-500 h-6 w-6 md:h-8 md:w-8" />
          )}
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-sm text-gray-500">Date de naissance</h4>
        <p>{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : 'Non spécifiée'}</p>
      </div>
    </div>
  )
}
