import { Metadata } from 'next'
import { Suspense } from 'react'

import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { getAllStudents } from '@/server/actions/api/students'
import { getAllTeachers } from '@/server/actions/api/teachers'
import { MembersView } from '@/server/components/admin/pages/Members'
import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'

export const metadata: Metadata = {
  title: 'Membres Gestion',
  description: 'Gestion des membres de l\'école',
}

export default async function MembersPage() {
  const [studentsResponse, teachersResponse] = await Promise.all([
    getAllStudents(),
    getAllTeachers(),
  ])

  const students = studentsResponse.success ? (studentsResponse.data as StudentResponse[]) : []
  const teachers = teachersResponse.success ? (teachersResponse.data as TeacherResponse[]) : []

  return (
    <Suspense fallback={<LoadingScreen />}>
      <MembersView students={students} teachers={teachers} />
    </Suspense>
  )
}
