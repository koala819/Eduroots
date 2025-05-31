'use client'

import { CircleArrowLeft, ClipboardEdit } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { useToast } from '@/hooks/use-toast'

import { SubjectNameEnum, TimeSlotEnum } from '@/types/course'
import { GradeRecord, GradeTypeEnum, UpdateGradeDTO } from '@/types/grade'
import { Student } from '@/types/user'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

import { useGrades } from '@/context/Grades/client'
import { formatDayOfWeek } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const GradeEdit = ({ gradeId }: { gradeId: string }) => {

  const {
    teacherGrades,
    updateGradeRecord,
    isLoading: isLoadingGrade,
    getTeacherGrades,
  } = useGrades()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [gradeInfo, setGradeInfo] = useState<{
    id: string
    date: Date
    type: GradeTypeEnum
    courseLevel: string
    dayOfWeek: string
    subject?: SubjectNameEnum
    isDraft: boolean
  } | null>(null)

  const [gradeEntries, setGradeEntries] = useState<{
    students: Student[]
    records: GradeRecord[]
  }>({
    students: [],
    records: [],
  })

  // Charger les données du grade
  useEffect(() => {
    const fetchGradeData = async () => {
      try {
        if (session?.user?.id && !teacherGrades) {
          await getTeacherGrades(session.user.id)
        }

        if (teacherGrades) {
          const grade = teacherGrades.find((g) => g.id === gradeId)
          if (grade) {
            const matchingSession = grade.course.sessions.find(
              (session) => session._id === grade.sessionId,
            )

            setGradeInfo({
              id: grade.id,
              date: new Date(grade.date),
              type: grade.type,
              courseLevel: matchingSession?.level || '',
              dayOfWeek: matchingSession?.timeSlot.dayOfWeek || '',
              subject: matchingSession?.subject,
              isDraft: true,
            })

            // Préparer les données des élèves et leurs notes
            const convertedRecords: GradeRecord[] = grade.records.map(
              (record) => ({
                student: record.student.id,
                value: record.value,
                isAbsent: record.isAbsent,
                comment: record.comment || '',
              }),
            )

            const convertedStudents = grade.records.map((record) => ({
              ...record.student,
              id: record.student.id,
            }))

            setGradeEntries({
              students: convertedStudents,
              records: convertedRecords,
            })
          } else {
            setError(`Évaluation avec l'ID ${gradeId} non trouvée`)
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Une erreur est survenue lors du chargement des données',
        )
      }
    }

    fetchGradeData()
  }, [session?.user?.id, gradeId, teacherGrades, getTeacherGrades])

  // Calcul des statistiques pour la progression
  const stats = useMemo(() => {
    if (!gradeEntries.records.length)
      return { completed: 0, total: 0, percent: 0, average: 0 }

    const total = gradeEntries.records.length
    const absentCount = gradeEntries.records.filter((r) => r.isAbsent).length
    const gradedCount = gradeEntries.records.filter(
      (r) => !r.isAbsent && r.value > 0,
    ).length
    const sum = gradeEntries.records.reduce(
      (acc, r) => acc + (r.isAbsent ? 0 : r.value),
      0,
    )
    const average = gradedCount > 0 ? sum / gradedCount : 0

    return {
      completed: gradedCount,
      total: total - absentCount,
      percent:
        total === absentCount
          ? 100
          : Math.round((gradedCount / (total - absentCount)) * 100),
      average: average.toFixed(1),
    }
  }, [gradeEntries.records])

  const handleGradeUpdate = useCallback(
    (
      studentId: string,
      field: keyof Omit<GradeRecord, 'student'>,
      value: number | string | boolean,
    ) => {
      setGradeEntries((prev) => {
        const recordIndex = prev.records.findIndex(
          (r) => r.student === studentId,
        )

        if (recordIndex === -1) return prev

        const newRecords = [...prev.records]
        newRecords[recordIndex] = {
          ...newRecords[recordIndex],
          [field]: value,
          // Si marqué absent, réinitialiser la note
          ...(field === 'isAbsent' && value === true ? { value: 0 } : {}),
        }

        return {
          ...prev,
          records: newRecords,
        }
      })
    },
    [],
  )

  const getStudentRecord = useCallback(
    (studentId: string) => {
      return gradeEntries.records.find((record) => record.student === studentId)
    },
    [gradeEntries.records],
  )

  const handleSubmit = async (isDraft: boolean) => {
    if (!gradeInfo) return

    setLoading(true)
    const updateData: UpdateGradeDTO = {
      date: gradeInfo.date,
      type: gradeInfo.type,
      isDraft: isDraft,
      records: gradeEntries.records.map((record) => ({
        student: record.student,
        value: record.value,
        isAbsent: record.isAbsent,
        comment: record.comment || undefined,
      })),
    }

    try {
      const status = await updateGradeRecord(gradeId, updateData)

      if (status === 200) {
        toast({
          variant: 'success',
          title: isDraft ? 'Brouillon mis à jour' : 'Notes validées',
          description: 'Les modifications ont été enregistrées avec succès',
          duration: 3000,
        })
        router.push('/teacher/profiles/grades')
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description:
            'Une erreur est survenue lors de la mise à jour des notes',
          duration: 3000,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Une erreur est survenue',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtenir la couleur en fonction du type d'évaluation
  const getTypeColor = (type: GradeTypeEnum | undefined) => {
    if (!type) return 'bg-gray-100 text-gray-600'

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

  // Obtenir la couleur en fonction de la matière
  const getSubjectColor = (subject: SubjectNameEnum | undefined) => {
    if (!subject) return 'bg-gray-100 text-gray-600'

    switch (subject) {
      case SubjectNameEnum.Arabe:
        return 'bg-emerald-100 text-emerald-600'
      case SubjectNameEnum.EducationCulturelle:
        return 'bg-blue-100 text-blue-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (isLoadingGrade || !gradeInfo) {
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

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="link"
            className="p-0 text-gray-500 hover:text-blue-600 -ml-1.5 transition-colors"
            onClick={() => router.push('/teacher/profiles/grades')}
          >
            <CircleArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <span className="text-xs font-medium">
                {gradeEntries.students.length}
              </span>
            </div>
            <span className="text-sm text-gray-500">Élèves</span>
          </div>
        </div>

        <div className="pb-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Modifier les notes
          </h1>
        </div>

        {/* Informations de l'évaluation */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-700">
              Informations de l&apos;évaluation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className={getTypeColor(gradeInfo.type)}>
                {gradeInfo.type}
              </Badge>

              {gradeInfo.subject && (
                <Badge
                  variant="outline"
                  className={getSubjectColor(gradeInfo.subject)}
                >
                  {gradeInfo.subject}
                </Badge>
              )}

              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                {format(gradeInfo.date, 'dd MMMM yyyy', { locale: fr })}
              </Badge>

              {gradeInfo.isDraft && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-700"
                >
                  Brouillon
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Niveau</p>
                <p className="font-medium">{`${gradeInfo.courseLevel ? `  ${gradeInfo.courseLevel}` : ''}`}</p>
              </div>

              {gradeInfo.dayOfWeek && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Jour</p>
                  <p className="font-medium">
                    {formatDayOfWeek(gradeInfo.dayOfWeek as TimeSlotEnum)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Liste des élèves */}
        {gradeEntries.students.length > 0 ? (
          <div className="space-y-4 mt-2">
            <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">
              Notes des élèves
            </h2>

            {gradeEntries.students.map((student) => {
              const record = getStudentRecord(student.id)
              const isGraded = !record?.isAbsent && (record?.value || 0) > 0

              return (
                <Card
                  key={student.id}
                  className={`shadow-sm border-l-4 overflow-hidden rounded-lg animate-fadeIn transition-all ${
                    record?.isAbsent
                      ? 'border-l-red-400 bg-red-50/30'
                      : isGraded
                        ? 'border-l-green-500'
                        : 'border-l-yellow-400'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {student.firstname} {student.lastname}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <Checkbox
                              id={`absent-${student.id}`}
                              checked={record?.isAbsent || false}
                              onCheckedChange={(checked) => {
                                handleGradeUpdate(
                                  student.id,
                                  'isAbsent',
                                  checked as boolean,
                                )
                              }}
                              className="mr-2"
                            />
                            <Label
                              htmlFor={`absent-${student.id}`}
                              className="text-sm text-gray-700"
                            >
                              Absent
                            </Label>
                          </div>
                          {record?.isAbsent && (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-600 text-xs"
                            >
                              Absent
                            </Badge>
                          )}
                          {isGraded && (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-600 text-xs"
                            >
                              Noté
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="w-full sm:w-32 flex-shrink-0">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            disabled={record?.isAbsent || false}
                            value={
                              record?.value && record.value > 0
                                ? record.value
                                : ''
                            }
                            onChange={(e) => {
                              const value = parseFloat(e.target.value)
                              handleGradeUpdate(
                                student.id,
                                'value',
                                isNaN(value)
                                  ? 0
                                  : Math.min(20, Math.max(0, value)),
                              )
                            }}
                            className="text-center"
                            placeholder="Note /20"
                          />
                          <span className="ml-2 text-sm text-gray-500">
                            /20
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label
                        htmlFor={`comment-${student.id}`}
                        className="text-sm mb-1 block"
                      >
                        Commentaire
                      </Label>
                      <Input
                        id={`comment-${student.id}`}
                        placeholder="Ajouter un commentaire (optionnel)"
                        value={record?.comment || ''}
                        onChange={(e) =>
                          handleGradeUpdate(
                            student.id,
                            'comment',
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm mt-6">
            <div className="text-gray-400 mb-3">
              <ClipboardEdit className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              Aucun élève à afficher
            </h3>
            <p className="text-gray-500 mb-4">
              Aucune donnée d&apos;élève n&apos;est disponible pour cette
              évaluation.
            </p>
          </div>
        )}
      </div>

      {/* Statistiques récapitulatives avant les boutons d'action */}
      {gradeEntries.students.length > 0 && (
        <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Progression: {stats.completed}/{stats.total} élèves notés
              </span>
              <span>Moyenne: {stats.average}/20</span>
            </div>
            <Progress value={stats.percent} className="h-2" />
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      {gradeEntries.students.length > 0 && (
        <div className="mt-6 sticky bottom-0 left-0 right-0 bg-white border-t p-4 shadow-md z-10">
          <div className="space-y-2 sm:space-y-0 md:flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-12 w-full"
              disabled={loading}
              onClick={() => handleSubmit(true)}
            >
              {loading ? 'Enregistrement...' : 'Mettre à jour le brouillon'}
            </Button>
            <Button
              className="flex-1 h-12 w-full"
              disabled={loading}
              onClick={() => handleSubmit(false)}
            >
              {loading ? 'Enregistrement...' : 'Valider les notes'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg shadow-md z-50">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  )
}

