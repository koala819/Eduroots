import { createClient } from '@/utils/supabase/server'
import { TeacherWelcome } from './TeacherWelcome'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const teacher = {
    firstname: user?.user_metadata?.firstname || '',
    lastname: user?.user_metadata?.lastname || '',
  }

  return <TeacherWelcome user={teacher} />
}
