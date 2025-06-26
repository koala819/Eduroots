import { Metadata } from 'next'

import { Dashboard } from '@/server/components/admin/pages/Dashboard'
import { createClient } from '@/server/utils/supabase'

export const metadata: Metadata = {
  title: 'Bureau d\'administration',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin`,
  },
}

export default async function AdminHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.user_metadata?.role === 'admin'

  return <Dashboard isAdmin={isAdmin} />
}
