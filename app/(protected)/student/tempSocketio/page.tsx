import { getFamilyStudents } from '@/lib/family'
import MessageForm from './MessageForm'
import {getServerSession} from 'next-auth'
import {authOptions} from '@/lib/authOptions'
import {redirect} from 'next/navigation'



export default async function TempSocketioPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/')
  }

  const familyStudents = await getFamilyStudents(session.user.email)

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow bg-white dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-4">Test envoi message (NestJS + JWT)</h1>
      <MessageForm familyStudents={familyStudents} />
    </div>
  )
}
