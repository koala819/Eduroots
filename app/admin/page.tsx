import { Metadata } from 'next'

import { Dashboard } from '@/server/components/admin/pages/Dashboard'

export const metadata: Metadata = {
  title: 'Bureau d\'administration',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin`,
  },
}

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header admin professionnel */}


      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-6">
        <Dashboard />
      </div>
    </div>
  )
}
