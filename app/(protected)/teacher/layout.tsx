import LoadingRoute from '@/client/components/atoms/LoadingRoute'
import { CustomLayout } from '@/client/components/pages/CustomLayout'
import { createClient } from '@/server/utils/supabase'

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
      pathPattern: '^/teacher$',
    },
    {
      href: '/teacher/classroom',
      label: 'Cours',
      Icon: 'CalendarIcon',
      pathPattern: '^/teacher/classroom',
    },
    {
      href: '/teacher/messages',
      label: 'Messages',
      Icon: 'MessageSquareMore',
      pathPattern: '^/teacher/messages',
    },
    {
      href: '/teacher/settings',
      label: 'Paramètres',
      Icon: 'Settings',
      pathPattern: '^/teacher/settings',
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
      <div className="flex flex-col relative bg-background h-full">
        <LoadingRoute />
        {children}
      </div>
    </CustomLayout>
  )
}
