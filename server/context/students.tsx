'use server'

import { getAllStudents } from '@/server/actions/api/students'
import { StudentProvider } from '@/client/context/students'
import { StudentResponse } from '@/types/student-payload'
import { UserType, GenderEnum } from '@/types/user'
import { SubjectNameEnum } from '@/types/courses'

interface StudentsServerComponentProps {
  children: React.ReactNode
}

function convertToStudent(response: StudentResponse): StudentResponse {
  return {
    ...response,
    type: response.type as UserType || UserType.Student,
    gender: response.gender as GenderEnum || undefined,
    subjects: response.subjects as SubjectNameEnum[] || undefined,
  }
}

export default async function StudentsServerComponent({
  children,
}: Readonly<StudentsServerComponentProps>) {
  let initialStudents: StudentResponse[] | null = null

  const response = await getAllStudents()

  if (response.success && response.data) {
    const data = response.data
    if (Array.isArray(data)) {
      initialStudents = data.map(convertToStudent)
    }
  }

  return (
    <StudentProvider initialStudentsData={initialStudents}>
      {children}
    </StudentProvider>
  )
}
