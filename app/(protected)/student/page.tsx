import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import { Student } from '@/types/user'

import StudentDashboard from '@/components/organisms/client/StudentDashboard'

import { getAllStudents } from '@/app/actions/context/students'

export const metadata = {
  title: 'Dashboard Étudiant | École',
  description: 'Visualisez les informations scolaires de vos enfants',
}

export default async function StudentPage() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  const response = await getAllStudents()

  if (!response.success || !response.data) {
    redirect('/')
  }

  const students = response.data as unknown as Student[]
  const student = students.find((s) => s.id === session.user.id)

  if (!student) {
    redirect('/')
  }

  return <StudentDashboard familyStudents={[student]} />
}
