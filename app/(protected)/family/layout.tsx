import { MenuHeader } from '@/client/components/organisms/HeaderMenu'
import { CustomLayout } from '@/client/components/pages/CustomLayout'
import { getFamilyDashboardData } from '@/server/actions/api/family'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()

  let familyStudents: Array<any> = []
  if (user?.id) {
    const response = await getFamilyDashboardData(user.id)
    if (response.success && response.data) {
      familyStudents = response.data.familyStudents
    }
  }

  const navItems = [
    {
      href: '/family',
      label: 'Scolarité',
      Icon: 'Home',
      pathPattern: '^/family$',
    },
    {
      href: '/family/messages',
      label: 'Messagerie',
      Icon: 'Mail',
      pathPattern: '^/family/messages$',
    },
    {
      href: '/family/profile',
      label: 'Profil',
      Icon: 'User',
      pathPattern: '^/family/profile$',
    },
  ]

  return (
    <CustomLayout navItems={navItems}>
      <MenuHeader
        selectedSession={undefined}
        courses={[]}
        grades={[]}
        familyStudents={familyStudents}
      />
      {children}
    </CustomLayout>
  )
}
