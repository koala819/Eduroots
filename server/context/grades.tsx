'use server'

import { GradesProvider, PopulatedGrade } from '@/client/context/grades'
import { getTeacherGrades } from '@/server/actions/api/grades'

interface GradesServerComponentProps {
  children: React.ReactNode
  teacherId?: string
}

export default async function GradesServerComponent({
  children,
  teacherId,
}: Readonly<GradesServerComponentProps>) {
  // Si un teacherId est fourni, on pré-charge les données pour ce cours
  let initialGrades: PopulatedGrade[] | null = null

  if (teacherId) {
    try {
      // Récupération des données
      const response = await getTeacherGrades(teacherId)

      if (response.success && response.data) {
        // Transformation des données pour inclure les records
        initialGrades = Array.isArray(response.data)
          ? response.data.map((grade: any) => ({
            ...grade,
            records: grade.grades_records ?? [],
          }))
          : [{
            ...response.data,
            records: response.data.grades_records ?? [],
          }]
      }
    } catch (error) {
      console.warn('[GradesServerComponent] Erreur lors du chargement des grades:', error)
      // En cas d'erreur, on continue sans données initiales
    }
  }

  return (
    <GradesProvider
      initialGradeData={initialGrades}
    >
      {children}
    </GradesProvider>
  )
}
