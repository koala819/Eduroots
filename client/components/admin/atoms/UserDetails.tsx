'use client'


import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { GenderEnum } from '@/types/user'

interface UserDetailsClientProps {
  gender: GenderEnum
  dateOfBirth?: string | Date
}

export function UserDetailsClient({ gender, dateOfBirth }: Readonly<UserDetailsClientProps>) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold text-sm text-gray-500">Genre</h4>
        <GenderDisplay gender={gender} />
      </div>
      <div>
        <h4 className="font-semibold text-sm text-gray-500">Date de naissance</h4>
        <p>{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : 'Non spécifiée'}</p>
      </div>
    </div>
  )
}
