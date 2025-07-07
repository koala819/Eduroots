import { Suspense } from 'react'

import { LoadingContent } from '@/client/components/atoms/StatusContent'
import { FamilyDashboard } from '@/client/components/pages/FamilyDashboard'

export const metadata = {
  title: 'Dashboard Famille | École',
  description: 'Visualisez les informations scolaires de vos enfants',
}

export default async function FamilyPage() {

  return (
    <Suspense fallback={<LoadingContent />}>
      <FamilyDashboard />
    </Suspense>
  )
}
