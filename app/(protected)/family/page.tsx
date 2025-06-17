import { redirect } from 'next/navigation'

import StudentDashboard from '@/client/components/organisms/StudentDashboard'
import { getAllStudents } from '@/server/actions/api/students'
import { createClient } from '@/server/utils/supabase'
import { User } from '@/types/db'
import { UserRoleEnum } from '@/types/user'

export const metadata = {
  title: 'Dashboard Famille | École',
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

  const students = response.data as Array<User & { role: UserRoleEnum.Student }>
  const student = students.find((s) => s.id === user.id)

  if (!student) {
    redirect('/')
  }

  return <StudentDashboard familyStudents={[student]} />
}
