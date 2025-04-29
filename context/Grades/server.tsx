'use server'

import {PopulatedGrade} from '@/types/grade'

import {getTeacherGrades} from '@/app/actions/context/grades'
import {GradesProvider} from '@/context/Grades/client'

interface CoursesServerComponentProps {
  children: React.ReactNode
  teacherId?: string
}

export default async function CourseServerComponent({
  children,
  teacherId,
}: CoursesServerComponentProps) {
  // Si un teacherId est fourni, on pré-charge les données pour ce cours
  let initialGrades: PopulatedGrade[] | null = null

  if (teacherId) {
    // Récupération des données
    const response = await getTeacherGrades(teacherId)

    if (response.success && response.data) {
      // Vérifier si data est un tableau et le convertir explicitement en CourseDocument[]
      if (Array.isArray(response.data)) {
        initialGrades = response.data as unknown as PopulatedGrade[]
      } else {
        // Si ce n'est pas un tableau mais que la donnée existe, en faire un tableau d'un élément
        initialGrades = [response.data] as unknown as PopulatedGrade[]
      }
    }
  }

  return <GradesProvider initialGradeData={initialGrades}>{children}</GradesProvider>
}
