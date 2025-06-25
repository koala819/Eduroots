import { redirect } from 'next/navigation'

import StudentDashboard from '@/client/components/organisms/StudentDashboard'
import { getFamilyStudents } from '@/server/actions/api/students'
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

  // Récupérer tous les enfants de la fratrie
  const response = await getFamilyStudents(user.id)

  if (!response.success || !response.data) {
    redirect('/')
  }

  const familyStudents = response.data.map((student) => ({
    ...student,
    role: UserRoleEnum.Student,
  } as User & { role: UserRoleEnum.Student }))

  return <StudentDashboard familyStudents={familyStudents} />
}
