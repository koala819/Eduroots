import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import StudentDashboard from '@/components/organisms/client/StudentDashboard'
import { authOptions } from '@/lib/authOptions'
import { getFamilyStudents } from '@/lib/messages'

export const metadata = {
  title: 'Dashboard Étudiant | École',
  description: 'Visualisez les informations scolaires de vos enfants',
}

export default async function StudentPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/')
  }

  const familyStudents = await getFamilyStudents(session.user.email)


  return <StudentDashboard familyStudents={familyStudents} />
}
