import { CustomLayout } from '@/components/template/CustomLayout'
import { createClient } from '@/utils/supabase/server'

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const navItems = [
    {
      href: '/teacher',
      label: 'Accueil',
      Icon: 'Home',
    },
    {
      href: '/teacher/classroom',
      label: 'Cours',
      Icon: 'CalendarIcon',
    },
    {
      href: '/teacher/messages',
      label: 'Messages',
      Icon: 'MessageSquareMore',
    },
    {
      href: '/teacher/profiles',
      label: 'Profil',
      Icon: 'Settings',
    },
  ]
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const teacher = {
    firstname: user?.user_metadata?.firstname || '',
    lastname: user?.user_metadata?.lastname || '',
    email: user?.email || '',
  }

  return (
    <CustomLayout navItems={navItems} teacher={teacher}>
      <div className="flex flex-col relative bg-gray-50  h-full">{children}</div>
    </CustomLayout>
  )
}
