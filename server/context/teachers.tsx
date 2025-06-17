'use server'

import { TeacherProvider } from '@/client/context/teachers'
import { getAllTeachers } from '@/server/actions/api/teachers'
import { TeacherResponse } from '@/types/teacher-payload'

interface TeachersServerComponentProps {
  children: React.ReactNode
}

export default async function TeachersServerComponent({
  children,
}: Readonly<TeachersServerComponentProps>) {
  let initialTeachers: TeacherResponse[] | null = null

  const response = await getAllTeachers()

  if (response.success && response.data) {
    // Convertir SerializedValue en Teacher[]
    const data = response.data as any
    if (Array.isArray(data)) {
      initialTeachers = data as TeacherResponse[]
    }
  }

  return (
    <TeacherProvider initialTeachersData={initialTeachers}>
      {children}
    </TeacherProvider>
  )
}
