'use server'

import {Teacher} from '@/types/user'

import {getAllTeachers} from '@/app/actions/context/teachers'
import {TeacherProvider} from '@/context/Teachers/client'

interface TeachersServerComponentProps {
  children: React.ReactNode
}

export default async function TeachersServerComponent({children}: TeachersServerComponentProps) {
  let initialTeachers: Teacher[] | null = null

  const response = await getAllTeachers()

  if (response.success && response.data) {
    // Convertir SerializedValue en Teacher[]
    const data = response.data as any
    if (Array.isArray(data)) {
      initialTeachers = data as Teacher[]
    }
  }

  return <TeacherProvider initialTeachersData={initialTeachers}>{children}</TeacherProvider>
}
