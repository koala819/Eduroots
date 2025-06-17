import { Metadata } from 'next'

import { Dashboard } from '@/client/components/admin/pages/Dashboard'

export const metadata: Metadata = {
  title: 'Bureau d’administration',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin`,
  },
}

export default function AdminHomePage() {
  return <Dashboard />
}
