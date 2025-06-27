import { Metadata } from 'next'
import { Suspense } from 'react'

import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { getAllStudents } from '@/server/actions/api/students'
import { getAllTeachers } from '@/server/actions/api/teachers'
import { PeopleView } from '@/server/components/admin/pages/People'
import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'

export const metadata: Metadata = {
  title: 'Personnel - Administration',
  description: 'Gestion unifiée du personnel de l\'école',
}

export default async function PeoplePage() {
  const [studentsResponse, teachersResponse] = await Promise.all([
    getAllStudents(),
    getAllTeachers(),
  ])

  const students = studentsResponse.success ? (studentsResponse.data as StudentResponse[]) : []
  const teachers = teachersResponse.success ? (teachersResponse.data as TeacherResponse[]) : []

  return (
    <Suspense fallback={<LoadingScreen />}>
      <PeopleView students={students} teachers={teachers} />
    </Suspense>
  )
}
