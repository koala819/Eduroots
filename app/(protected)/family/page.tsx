import { Suspense } from 'react'

import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { FamilyDashboard } from '@/client/components/pages/FamilyDashboard'
import { getFamilyDashboardData } from '@/server/actions/api/family'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'

export const metadata = {
  title: 'Dashboard Famille | École',
  description: 'Visualisez les informations scolaires de vos enfants',
}

export default async function FamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>
}) {
  const user = await getAuthenticatedUser()

  if (!user?.id) {
    return null
  }

  const resolvedSearchParams = await searchParams
  const selectedStudentId = resolvedSearchParams?.student

  const response = await getFamilyDashboardData(user.id, selectedStudentId)

  if (!response.success || !response.data) {
    return <ErrorContent message='Erreur lors du chargement des données familiales' />
  }

  const { familyStudents, selectedStudentData } = response.data

  return (
    <Suspense fallback={<LoadingContent />}>
      <FamilyDashboard
        familyStudents={familyStudents}
        selectedStudentData={selectedStudentData}
        selectedStudentId={selectedStudentId}
      />
    </Suspense>
  )
}
