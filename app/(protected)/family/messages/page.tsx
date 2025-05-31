import { getFamilyStudents } from '@/lib/family'
import { MessagesCenter } from '@/components/pages/client/MessagesCenter'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'



export default async function TempSocketioPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/')
  }

  const familyStudents = await getFamilyStudents(session.user.email)

  return <MessagesCenter familyStudents={familyStudents} userType="family" />
}
