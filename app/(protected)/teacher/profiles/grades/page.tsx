'use client'

import { ChevronRight, CircleArrowLeft, Plus, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { SubjectNameEnum } from '@/types/mongo/course'
import { GradeTypeEnum, PopulatedGrade } from '@/types/mongo/grade'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGrades } from '@/context/Grades/client'
import { compareDesc, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'

const GradesPage = () => {
  const { toast } = useToast()
  const { getTeacherGrades, isLoading, teacherGrades } = useGrades()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        if (user?.id) {
          await getTeacherGrades(user.id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    }
    fetchGrades()
  }, [user?.id, getTeacherGrades])

  // Filtrer et trier les évaluations
  const filteredAndSortedGrades = useMemo(() => {
    if (!teacherGrades || !Array.isArray(teacherGrades)) {
      return []
    }

    // Créer une copie avec toutes les données nécessaires
    const processedGrades = teacherGrades.map((grade) => {
      // console.log('🚀 ~ processedGrades ~ grade:', grade)
      const matchingSession = grade.course.sessions.find(
        (session) => session._id === grade.sessionId,
      )

      return {
        ...grade,
        formattedDate: format(new Date(grade.date), 'dd MMM yyyy', {
          locale: fr,
        }),
        month: format(new Date(grade.date), 'MMMM yyyy', { locale: fr }),
        subject: matchingSession?.subject || 'Inconnu',
      }
    })

    // Filtrer selon la matière sélectionnée
    const filteredGrades =
      selectedSubject === 'all'
        ? processedGrades
        : processedGrades.filter((grade) => grade.subject === selectedSubject)

    // Trier par date (plus récente d'abord)
    return filteredGrades.sort((a, b) =>
      compareDesc(new Date(a.date), new Date(b.date)),
    )
  }, [teacherGrades, selectedSubject])

  // Regrouper par mois pour l'affichage
  const groupedByMonth = useMemo(() => {
    if (!filteredAndSortedGrades.length)
      return {} as Record<string, PopulatedGrade[]>

    return filteredAndSortedGrades.reduce(
      (acc: Record<string, PopulatedGrade[]>, grade) => {
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

  // Compter les matières pour les filtres
  const subjectCounts = useMemo(() => {
    if (!teacherGrades || !Array.isArray(teacherGrades))
      return {} as Record<SubjectNameEnum, number>

    return teacherGrades.reduce(
      (acc: Record<SubjectNameEnum | 'Inconnu', number>, grade) => {
        const matchingSession = grade.course.sessions.find(
          (session) => session._id === grade.sessionId,
        )
        const subject: SubjectNameEnum | 'Inconnu' =
          matchingSession?.subject || 'Inconnu'
        acc[subject] = (acc[subject] || 0) + 1
        return acc
      },
      { Inconnu: 0 } as Record<SubjectNameEnum | 'Inconnu', number>,
    )
  }, [teacherGrades])

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

  const getTypeBackgroundColor = (type: GradeTypeEnum) => {
    switch (type) {
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

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="link"
            className={`
              p-0 text-gray-500 hover:text-blue-600 -ml-1.5
              transition-colors
            `}
            onClick={() => router.push('/teacher/profiles')}
          >
            <CircleArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className={`
              h-8 w-8 flex items-center justify-center rounded-full
              bg-blue-100 text-blue-600
            `}>
              <span className="text-xs font-medium">
                {teacherGrades?.length || 0}
              </span>
            </div>
            <span className="text-sm text-gray-500">Évaluations</span>
          </div>
        </div>

        <div className="pb-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
        </div>

        <div className={`
          space-y-2 sm:space-y-0 md:flex overflow-x-auto gap-2
          pb-2 scrollbar-hide
        `}>
          <Button
            variant={selectedSubject === 'all' ? 'default' : 'outline'}
            className={`
              rounded-full text-sm whitespace-nowrap w-full
            `}
            onClick={() => setSelectedSubject('all')}
          >
            Toutes ({teacherGrades?.length || 0})
          </Button>

          {Object.values(SubjectNameEnum).map((subject) => (
            <Button
              key={subject}
              variant={selectedSubject === subject ? 'default' : 'outline'}
              className={`
                rounded-full text-sm whitespace-nowrap w-full
                ${selectedSubject === subject
              ? ''
              : getSubjectBackgroundColor(subject).replace(
                'text-',
                'hover:text-',
              )}
              `}
              onClick={() => setSelectedSubject(subject)}
            >
              {subject} ({subjectCounts[subject] || 0})
            </Button>
          ))}

          <Button
            variant="outline"
            className={`
              rounded-full text-sm whitespace-nowrap bg-blue-50
              hover:bg-blue-100 border-blue-200 ml-auto w-full
            `}
            onClick={() => {
              router.push('/teacher/profiles/grades/create')
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle
          </Button>
        </div>
      </div>

      {/* Liste des évaluations par mois */}
      <div className="space-y-8 mt-6 max-w-4xl mx-auto">
        {Object.entries(groupedByMonth).map(([month, grades]) => (
          <div key={month} className="space-y-3">
            <h2 className="text-sm font-medium text-gray-500 px-2">{month}</h2>

            <div className="space-y-3">
              {grades.map((grade) => {
                const matchingSession = grade.course.sessions.find(
                  (session) => session._id === grade.sessionId,
                )
                const subject = matchingSession?.subject || 'Inconnu'
                return (
                  <Card
                    key={grade.id}
                    className={`
                      shadow-sm border-l-4 ${getSubjectColor(subject)}
                      border-t-0 border-r-0 border-b-0 overflow-hidden
                      rounded-lg animate-fadeIn
                      ${grade.isDraft ? 'bg-gray-50' : 'bg-white'}
                      hover:shadow-md transition-all cursor-pointer
                    `}
                    onClick={() => {
                      router.push(`/teacher/profiles/grades/${grade.id}`)
                    }}
                  >
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {subject}
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                          {format(new Date(grade.date), 'dd MMM', {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 pb-3 px-4">
                      <div className={`
                        bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100
                        transition-colors duration-200
                      `}>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <div className={`
                            h-7 px-3 rounded-full flex items-center justify-center
                            ${getTypeBackgroundColor(grade.type)} text-xs font-medium
                          `}>
                            {grade.type}
                          </div>
                          <div className={`
                            h-7 px-3 rounded-full flex items-center justify-center
                            ${grade.isDraft
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-600'
                  } text-xs font-medium
                          `}>
                            {grade.isDraft ? 'En cours' : 'Terminé'}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            <div className="space-y-1">
                              <span className="text-xs text-gray-500">
                                Moyenne
                              </span>
                              <div className="font-medium text-gray-900">
                                {grade.stats.averageGrade.toFixed(1)}/20
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-xs text-gray-500">
                                Élèves notés
                              </span>
                              <div className="font-medium text-gray-900">
                                {`${grade.stats.totalStudents - grade.stats.absentCount}
                                /${grade.stats.totalStudents}`}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-xs text-gray-500">
                                Absents
                              </span>
                              <div className="font-medium text-gray-900">
                                {grade.stats.absentCount}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            {grade.isDraft ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`
                                  text-blue-600 hover:text-blue-800
                                  hover:bg-blue-50 p-2
                                `}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(
                                    `/teacher/profiles/grades/${grade.id}`,
                                  )
                                }}
                              >
                                Valider le brouillon
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            ) : (
                              <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <AccordionItem
                                  value={`detail-${grade.id}`}
                                  className="border-0"
                                >
                                  <div className="flex justify-end">
                                    <AccordionTrigger className={`
                                      py-0 px-2 hover:no-underline
                                      text-blue-600 hover:text-blue-800
                                      hover:bg-blue-50 rounded-md
                                    `}>
                                      <span className="text-sm font-medium">
                                        Voir détails
                                      </span>
                                    </AccordionTrigger>
                                  </div>
                                  <AccordionContent>
                                    <div className={`
                                      pt-3 border-t mt-3 border-gray-100
                                    `}>
                                      <div className={`
                                        grid grid-cols-2 sm:grid-cols-3
                                        gap-3 text-sm mb-4
                                      `}>
                                        <div>
                                          <span className={`
                                            text-gray-500 block text-xs
                                          `}>
                                            Note la plus haute
                                          </span>
                                          <span className="font-medium">
                                            {grade.stats.highestGrade}/20
                                          </span>
                                        </div>
                                        <div>
                                          <span className={`
                                            text-gray-500 block text-xs
                                          `}>
                                            Note la plus basse
                                          </span>
                                          <span className="font-medium">
                                            {grade.stats.lowestGrade}/20
                                          </span>
                                        </div>
                                        <div>
                                          <span className={`
                                            text-gray-500 block text-xs
                                          `}>
                                            Créée le
                                          </span>
                                          <span className="font-medium">
                                            {format(
                                              new Date(grade.createdAt),
                                              'dd/MM/yyyy',
                                              {
                                                locale: fr,
                                              },
                                            )}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="mt-3">
                                        <h4 className={`
                                          text-sm font-medium text-gray-700
                                          mb-2
                                        `}>
                                          Notes des élèves
                                        </h4>
                                        <div className={`
                                          max-h-60 overflow-y-auto rounded-md
                                          border border-gray-200
                                        `}>
                                          {grade.records.map(
                                            (record, index) => (
                                              <div
                                                key={record.student.id}
                                                className={`
                                                  p-2 text-sm flex justify-between
                                                  items-center
                                                  ${index % 2 === 0
                                                ? 'bg-gray-50'
                                                : 'bg-white'
                                              }
                                                `}
                                              >
                                                <div className="font-medium">
                                                  {record.student.firstname}{' '}
                                                  {record.student.lastname}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  {record.isAbsent ? (
                                                    <Badge
                                                      variant="outline"
                                                      className={`
                                                        bg-red-100
                                                        text-red-600
                                                      `}
                                                    >
                                                      Absent
                                                    </Badge>
                                                  ) : (
                                                    <span className="font-bold">
                                                      {record.value}/20
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedByMonth).length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center p-8
           bg-white rounded-lg shadow-sm">
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
              onClick={() => {
                router.push('/teacher/profiles/grades/create')
              }}
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

export default GradesPage
