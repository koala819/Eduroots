'use client'

import { compareDesc, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Edit, Plus, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { getSubjectColors } from '@/server/utils/helpers'
import { GradeWithRelations } from '@/types/grades'

export function TeacherGrades({
  initialGrades,
}: {
  initialGrades: GradeWithRelations[]
}) {
  const router = useRouter()
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  // Écouter les changements du header
  useEffect(() => {
    const handleHeaderSubjectChange = (event: CustomEvent) => {
      const { subject } = event.detail
      setSelectedSubject(subject)
    }

    window.addEventListener(
      'headerGradesSubjectChanged',
      handleHeaderSubjectChange as any,
    )

    return () => {
      window.removeEventListener(
        'headerGradesSubjectChanged',
        handleHeaderSubjectChange as any,
      )
    }
  }, [])

  // Filtrer les notes par matière
  const filteredGrades = selectedSubject === 'all'
    ? initialGrades
    : initialGrades.filter((grade) => grade.courses_sessions?.subject === selectedSubject)

  // Trier par date décroissante
  const sortedGrades = filteredGrades
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col space-y-4 max-w-4xl mx-auto">

        {/* Bouton Créer une évaluation */}
        <div className="flex justify-end">
          <Button
            variant="default"
            onClick={() => router.push('/teacher/settings/grades/create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une évaluation
          </Button>
        </div>
      </div>

      <div className="space-y-4 mt-6 max-w-4xl mx-auto">
        {sortedGrades.map((grade) => (
          <Card key={grade.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle
                    className={`text-sm p-2 rounded-lg text-center
                    ${getSubjectColors(grade.courses_sessions?.subject)}`}>
                    {grade.courses_sessions?.subject || 'Matière inconnue'}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(grade.date), 'dd MMMM yyyy', { locale: fr })} • {grade.type}
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push(`/teacher/settings/grades/edit/${grade.id}`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Moyenne</span>
                  <p className="font-semibold">{grade.stats_average_grade.toFixed(1)}/20</p>
                </div>
                <div>
                  <span className="text-gray-500">Élèves notés</span>
                  <p className="font-semibold">
                    {grade.stats_total_students - grade.stats_absent_count}/
                    {grade.stats_total_students}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Absents</span>
                  <p className="font-semibold">
                    {grade.stats_absent_count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedGrades.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 bg-white
          rounded-lg shadow-sm">
            <div className="text-gray-400 mb-3">
              <Trophy className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              Aucune évaluation trouvée
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {selectedSubject === 'all'
                ? 'Vous n\'avez pas encore créé d\'évaluations.'
                : `Aucune évaluation pour la matière "${selectedSubject}" n'a été trouvée.`}
            </p>
            <Button onClick={() => router.push('/teacher/settings/grades/create')}>
              <Plus className="h-4 w-4 mr-1" />
              Créer une évaluation
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
