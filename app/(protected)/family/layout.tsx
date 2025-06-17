import { CustomLayout } from '@/client/components/pages/CustomLayout'

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
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
    <CustomLayout navItems={navItems} >
      {children}
    </CustomLayout>
  )
}
