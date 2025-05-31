import {CustomLayout} from '@/components/template/CustomLayout'

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: '/family', label: 'Scolarité', Icon: 'Home' },
    { href: '/family/messages', label: 'Messagerie', Icon: 'Mail' },
    { href: '/family/profile', label: 'Profil', Icon: 'User' },
  ]

  return (
    <CustomLayout navItems={navItems} >
      {children}
    </CustomLayout>
  )
}