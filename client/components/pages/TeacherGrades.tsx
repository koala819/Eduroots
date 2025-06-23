'use client'

import { compareDesc, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { GradesHeader } from '@/client/components/atoms/GradesHeader'
import { GradeCard } from '@/client/components/molecules/GradeCard'
import { SubjectFilter } from '@/client/components/molecules/GradesSubjectFilter'
import { Button } from '@/client/components/ui/button'
import { useGrades } from '@/client/context/grades'
import { useToast } from '@/client/hooks/use-toast'
import { SubjectNameEnum } from '@/types/courses'
import { GradeTypeEnum, GradeWithRelations } from '@/types/grades'

type ProcessedGrade = {
  id: string
  date: Date
  type: GradeTypeEnum
  formattedDate: string
  month: string
  subject: SubjectNameEnum | 'Inconnu'
  stats: {
    averageGrade: number
    highestGrade: number
    lowestGrade: number
    absentCount: number
    totalStudents: number
  }
}

type GroupedGrades = Record<string, ProcessedGrade[]>

export function GradesClient({ teacherId }: { teacherId: string }) {
  const { toast } = useToast()
  const { getTeacherGrades, isLoading, teacherGrades } = useGrades()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        if (teacherId) {
          await getTeacherGrades(teacherId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    }
    fetchGrades()
  }, [teacherId, getTeacherGrades])

  const filteredAndSortedGrades = useMemo(() => {
    if (!teacherGrades || !Array.isArray(teacherGrades)) {
      return []
    }

    const processedGrades: ProcessedGrade[] = (
      teacherGrades as unknown as GradeWithRelations[]
    ).map((grade) => {
      const session = grade.courses_sessions

      return {
        id: grade.id,
        date: new Date(grade.date),
        type: grade.type as GradeTypeEnum,
        formattedDate: format(new Date(grade.date), 'dd MMM yyyy', { locale: fr }),
        month: format(new Date(grade.date), 'MMMM yyyy', { locale: fr }),
        subject: session?.subject as SubjectNameEnum || 'Inconnu',
        stats: {
          averageGrade: grade.stats_average_grade,
          highestGrade: grade.stats_highest_grade,
          lowestGrade: grade.stats_lowest_grade,
          absentCount: grade.stats_absent_count,
          totalStudents: grade.stats_total_students,
        },
      }
    })

    const filteredGrades =
      selectedSubject === 'all'
        ? processedGrades
        : processedGrades.filter((grade) => grade.subject === selectedSubject)

    return filteredGrades.sort((a, b) =>
      compareDesc(new Date(a.date), new Date(b.date)),
    )
  }, [teacherGrades, selectedSubject])

  const groupedByMonth = useMemo(() => {
    if (!filteredAndSortedGrades.length) return {} as GroupedGrades

    return filteredAndSortedGrades.reduce(
      (acc: GroupedGrades, grade) => {
        const month = grade.month
        if (!acc[month]) {
          acc[month] = []
        }
        acc[month].push(grade)
        return acc
      },
      {},
    )
  }, [filteredAndSortedGrades])

  const subjectCounts = useMemo(() => {
    if (!teacherGrades || !Array.isArray(teacherGrades))
      return { Inconnu: 0 } as Record<SubjectNameEnum | 'Inconnu', number>

    return (teacherGrades as unknown as GradeWithRelations[]).reduce(
      (acc: Record<SubjectNameEnum | 'Inconnu', number>, grade) => {
        const subject = grade.courses_sessions.subject || 'Inconnu'
        const subjectKey = subject as SubjectNameEnum | 'Inconnu'
        acc[subjectKey] = (acc[subjectKey] || 0) + 1
        return acc
      },
      { Inconnu: 0 } as Record<SubjectNameEnum | 'Inconnu', number>,
    )
  }, [teacherGrades])

  const getSubjectColor = (subject: string) => {
    switch (subject) {
    case SubjectNameEnum.Arabe:
      return 'border-l-blue-500'
    case SubjectNameEnum.EducationCulturelle:
      return 'border-l-green-500'
    default:
      return 'border-l-gray-500'
    }
  }

  const getSubjectBackgroundColor = (subject: string) => {
    switch (subject) {
    case SubjectNameEnum.Arabe:
      return 'bg-blue-100 text-blue-600'
    case SubjectNameEnum.EducationCulturelle:
      return 'bg-green-100 text-green-600'
    default:
      return 'bg-gray-100 text-gray-600'
    }
  }

  const getTypeBackgroundColor = (type: string) => {
    switch (type as GradeTypeEnum) {
    case GradeTypeEnum.Controle:
      return 'bg-purple-100 text-purple-600'
    case GradeTypeEnum.Devoir:
      return 'bg-yellow-100 text-yellow-600'
    case GradeTypeEnum.Examen:
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1" />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    )
  }

  if (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: `Error: ${error}`,
      duration: 3000,
    })
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col space-y-4 max-w-4xl mx-auto">
        <GradesHeader totalGrades={teacherGrades?.length || 0} />

        <SubjectFilter
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          subjectCounts={subjectCounts}
          totalGrades={teacherGrades?.length || 0}
          getSubjectBackgroundColor={getSubjectBackgroundColor}
        />
      </div>

      <div className="space-y-8 mt-6 max-w-4xl mx-auto">
        {Object.entries(groupedByMonth).map(([month, grades]) => (
          <div key={month} className="space-y-3">
            <h2 className="text-sm font-medium text-gray-500 px-2">{month}</h2>
            <div className="space-y-3">
              {grades.map((grade) => (
                <GradeCard
                  key={grade.id}
                  grade={grade as unknown as GradeWithRelations}
                  getSubjectColor={getSubjectColor}
                  getTypeBackgroundColor={getTypeBackgroundColor}
                />
              ))}
            </div>
          </div>
        ))}

        {Object.keys(groupedByMonth).length === 0 && !isLoading && (
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
            <Button
              onClick={() => router.push('/teacher/settings/grades/create')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Créer une évaluation
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
