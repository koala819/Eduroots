'use server'

import { GradesProvider, PopulatedGrade } from '@/client/context/grades'
import { getTeacherGrades } from '@/server/actions/api/grades'

interface CoursesServerComponentProps {
  children: React.ReactNode
  teacherId?: string
}

export default async function CourseServerComponent({
  children,
  teacherId,
}: Readonly<CoursesServerComponentProps>) {
  // Si un teacherId est fourni, on pré-charge les données pour ce cours
  let initialGrades: PopulatedGrade[] | null = null

  if (teacherId) {
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
  }

  return <GradesProvider initialGradeData={initialGrades}>{children}</GradesProvider>
}
