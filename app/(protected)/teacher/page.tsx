import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { TeacherWelcome } from '@/client/components/pages/TeacherWelcome'

export default async function TeacherDashboardPage() {
  const user = await getAuthenticatedUser()

  const teacher = {
    firstname: user?.user_metadata?.firstname || '',
    lastname: user?.user_metadata?.lastname || '',
  }

  return <TeacherWelcome user={teacher} />
}
