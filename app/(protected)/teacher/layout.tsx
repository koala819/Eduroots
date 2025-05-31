import {CustomLayout} from '@/components/template/CustomLayout'

export default function TeacherLayout({
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

  return (
    <CustomLayout navItems={navItems}>
      <div className="flex flex-col relative bg-gray-50  h-full">{children}</div>
    </CustomLayout>
  )
}
