'use server'

import { Student } from '@/types/user'

import { getAllStudents } from '@/app/actions/context/students'
import { StudentProvider } from '@/context/Students/client'

interface StudentsServerComponentProps {
  children: React.ReactNode
  userId?: string
}

export default async function StudentsServerComponent({
  children,
}: StudentsServerComponentProps) {
  let initialStudents: Student[] | null = null

  const response = await getAllStudents()

  if (response.success && response.data) {
    // Convertir SerializedValue en Student[]
    const data = response.data as any
    if (Array.isArray(data)) {
      initialStudents = data as Student[]
    }
  }

  return (
    <StudentProvider initialStudentsData={initialStudents}>
      {children}
    </StudentProvider>
  )
}
