import { GradeEdit } from '@/client/components/pages/TeacherGradesEdit'
import { getGradeById } from '@/server/actions/api/grades'

type Params = Promise<{ gradeId: string }>

export default async function GradeEditPage({ params }: { params: Params }) {
  const { gradeId } = await params

  console.log('🔍 [SERVER] GradeEditPage - gradeId:', gradeId)

  // Récupérer les données du grade côté serveur
  const gradeResponse = await getGradeById(gradeId)

  console.log('🔍 [SERVER] GradeEditPage - gradeResponse:', {
    success: gradeResponse.success,
    hasData: !!gradeResponse.data,
    error: gradeResponse.error,
  })

  if (!gradeResponse.success || !gradeResponse.data) {
    console.error('🔍 [SERVER] GradeEditPage - Failed to load grade:', gradeResponse.error)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600">
            {gradeResponse.error || 'Impossible de charger les données de l\'évaluation'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <GradeEdit
      gradeId={gradeId}
      initialGradeData={gradeResponse.data}
    />
  )
}
