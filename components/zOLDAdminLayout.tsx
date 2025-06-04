
import { CustomLayout } from '@/components/template/CustomLayout'
import { createClient } from '@/utils/supabase/server'

const navItems = [
  { href: '/admin', label: 'Tableau de bord', Icon: 'Home' },
  { href: '/admin/schedule', label: 'Emplois du temps', Icon: 'Calendar' },
  { href: '/admin/messages/inbox', label: 'Messages', Icon: 'MessageSquare' },
  { href: '/admin/settings', label: 'Paramètres', Icon: 'Settings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const isAdmin = session?.user?.user_metadata?.role === 'admin'



  return (
    <CustomLayout navItems={navItems} isAdmin={isAdmin}>
      {children}
    </CustomLayout>
  )
}

