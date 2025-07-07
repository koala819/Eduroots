import { Suspense } from 'react'

import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { getFamilyDashboardData } from '@/server/actions/api/family'
import { FamilyProfile } from '@/server/components/organisms/FamilyProfile'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'

export default async function FamilyProfilePage() {
  const user = await getAuthenticatedUser()

  if (!user?.email) {
    return <ErrorContent message="Vous n'êtes pas connecté" />
  }

  const familyData = await getFamilyDashboardData(user.id)

  if (!familyData.data) {
    return <ErrorContent message="Aucune donnée trouvée" />
  }


  return (
    <Suspense fallback={<LoadingContent />}>
      <FamilyProfile data={familyData.data.familyStudents} />
    </Suspense>
  )
}
