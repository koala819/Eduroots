'use server'

import { Student } from '@/zUnused/types/user'

import { getAllStudents } from '@/server/actions/context/students'
import { StudentProvider } from '@/client/context/students'

interface StudentsServerComponentProps {
  children: React.ReactNode
}

export default async function StudentsServerComponent({
  children,
}: Readonly<StudentsServerComponentProps>) {
  let initialStudents: Student[] | null = null

  const response = await getAllStudents()

  if (response.success && response.data) {
    // Convertir SerializedValue en Student[]
    const data = response.data as any
    if (Array.isArray(data)) {
      initialStudents = data as Student[]
    }
  }

  return <StudentProvider initialStudentsData={initialStudents}>{children}</StudentProvider>
}
