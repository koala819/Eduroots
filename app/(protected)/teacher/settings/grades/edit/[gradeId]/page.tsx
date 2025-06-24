import { Suspense } from 'react'

import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { EditForm } from '@/client/components/pages/GradesFormEdit'
import { getGradeById } from '@/server/actions/api/grades'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'

type Params = Promise<{ gradeId: string }>

export default async function GradeEditPage({ params }: { params: Params }) {
  const { gradeId } = await params

  try {
    await getAuthenticatedUser()
  } catch (error) {
    console.error('🔍 [SERVER] GradeEditPage - error:', error)
    return <ErrorContent message="Accès non autorisé" />
  }

  try {
    const gradeResponse = await getGradeById(gradeId)

    if (!gradeResponse.success || !gradeResponse.data) {
      return (
        <ErrorContent
          message={gradeResponse.error || 'Impossible de charger les données de l\'évaluation'}
        />
      )
    }

    return (
      <Suspense fallback={<LoadingContent />}>
        <EditForm
          gradeId={gradeId}
          initialGradeData={gradeResponse.data}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'évaluation:', error)
    return <ErrorContent message="Erreur lors de la récupération de l'évaluation." />
  }
}
