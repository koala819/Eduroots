import { Metadata } from 'next'
import { Suspense } from 'react'

import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { getHighRiskStudents } from '@/server/actions/admin/high-risk-students'
import { getAllCourses } from '@/server/actions/api/courses'
import { getAllStudents } from '@/server/actions/api/students'
import { getAllTeachers } from '@/server/actions/api/teachers'
import { Dashboard } from '@/server/components/admin/pages/Dashboard'
import { createClient } from '@/server/utils/supabase'
import { CourseWithRelations } from '@/types/courses'
import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'

export const metadata: Metadata = {
  title: 'Bureau d\'administration',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin`,
  },
}

export default async function AdminHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.user_metadata?.role === 'admin'

  const highRiskStudents = await getHighRiskStudents()
  const nbHighRiskStudents = highRiskStudents.students.length

  const [studentsResponse, teachersResponse, coursesResponse] = await Promise.all([
    getAllStudents(),
    getAllTeachers(),
    getAllCourses(),
  ])
  const students = studentsResponse.success ? (studentsResponse.data as StudentResponse[]) : []
  const teachers = teachersResponse.success ? (teachersResponse.data as TeacherResponse[]) : []
  const courses = coursesResponse.success ? (coursesResponse.data as CourseWithRelations[]) : []

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Dashboard
        isAdmin={isAdmin}
        nbHighRiskStudents={nbHighRiskStudents}
        students={students}
        teachers={teachers}
        courses={courses} />
    </Suspense>
  )
}
