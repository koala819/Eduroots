import { createClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'

import { Student } from '@/types/mongo/user'

import StudentDashboard from '@/client//components/organisms/StudentDashboard'

import { getAllStudents } from '@/app/server/actions/context/students'

export const metadata = {
  title: 'Dashboard Étudiant | École',
  description: 'Visualisez les informations scolaires de vos enfants',
}

export default async function StudentPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const response = await getAllStudents()

  if (!response.success || !response.data) {
    redirect('/')
  }

  const students = response.data as unknown as Student[]
  const student = students.find((s) => s.id === user.id)

  if (!student) {
    redirect('/')
  }

  return <StudentDashboard familyStudents={[student]} />
}
