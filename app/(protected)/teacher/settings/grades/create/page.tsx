'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon, CircleArrowLeft, ClipboardEdit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Checkbox } from '@/client/components/ui/checkbox'
import { Input } from '@/client/components/ui/input'
import { Label } from '@/client/components/ui/label'
import { Progress } from '@/client/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import { useCourses } from '@/client/context/courses'
import { useGrades } from '@/client/context/grades'
import { useToast } from '@/client/hooks/use-toast'
import useCourseStore from '@/client/stores/useCourseStore'
import { createClient } from '@/client/utils/supabase'
import { formatDayOfWeek } from '@/server/utils/helpers'
import type { CourseWithRelations } from '@/types/courses'
import { SubjectNameEnum } from '@/types/courses'
import type { CreateGradePayload } from '@/types/grade-payload'
import { GradeTypeEnum, Student } from '@/types/grades'

type GradeEntry = {
  student: string
  value: number
  isAbsent: boolean
  comment: string
}

export default function CreateGradePage() {
  const { teacherCourses, isLoading } = useCourses()
  const { fetchTeacherCourses } = useCourseStore()
  const { createGradeRecord, isLoading: isLoadingGrade } = useGrades()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)

  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date>()
  const [gradeEntries, setGradeEntries] = useState<{
    students: Student[]
    records: GradeEntry[]
  }>({
    students: [],
    records: [],
  })

  const [selectedType, setSelectedType] = useState<GradeTypeEnum>()
  const [selectedSession, setSelectedSession] = useState<{
    id: string
    courseId: string
    sessionId: string
    subject?: SubjectNameEnum
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

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

  // Charger les cours dès que possible
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (user?.id) {
          await fetchTeacherCourses(user.id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    }
    fetchCourses()
  }, [user?.id, fetchTeacherCourses])

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

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      const session = (teacherCourses as CourseWithRelations).courses_sessions.find(
        (s) => s.id === sessionId,
      )
      if (session) {
        const initialRecords: GradeEntry[] = session.courses_sessions_students.map(
          (s) => ({
            student: s.users.id,
            value: 0,
            isAbsent: false,
            comment: '',
          }),
        )

        setGradeEntries({
          students: session.courses_sessions_students.map((s) => ({
            id: s.users.id,
            firstname: s.users.firstname,
            lastname: s.users.lastname,
          })),
          records: initialRecords,
        })
      }
    },
    [teacherCourses],
  )

  const handleGradeUpdate = useCallback(
    (
      studentId: string,
      field: keyof Omit<GradeEntry, 'student'>,
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
    setLoading(true)
    const gradeData: CreateGradePayload = {
      course_session_id: selectedSession?.sessionId ?? '',
      date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      type: selectedType ?? GradeTypeEnum.Controle,
      is_draft: isDraft,
      records: gradeEntries.records.map((record) => ({
        student_id: record.student,
        value: record.value,
        is_absent: record.isAbsent,
        comment: record.comment || null,
      })),
    }

    try {
      const status = await createGradeRecord(gradeData)

      if (status === 200) {
        toast({
          variant: 'success',
          title: isDraft ? 'Brouillon enregistré' : 'Notes validées',
          description: 'Les notes ont été enregistrées avec succès',
          duration: 3000,
        })
        router.push('/teacher/settings/grades')
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description:
            'Une erreur est survenue lors de l\'enregistrement des notes',
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

  if (isLoading || !teacherCourses) {
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
            className={`
              p-0 text-gray-500 hover:text-blue-600 -ml-1.5
              transition-colors
            `}
            onClick={() => router.push('/teacher/settings/grades')}
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
                {gradeEntries.students.length}
              </span>
            </div>
            <span className="text-sm text-gray-500">Élèves</span>
          </div>
        </div>

        <div className="pb-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Nouvelle évaluation
          </h1>
        </div>

        {/* Informations de l'évaluation */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-700">
              Informations de l&apos;évaluation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            {/* Ligne 1: Type et Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type d&apos;évaluation</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) =>
                    setSelectedType(value as GradeTypeEnum)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GradeTypeEnum).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade-date">Date</Label>
                <Input
                  id="grade-date"
                  type="date"
                  value={date ? format(date, 'yyyy-MM-dd') : ''}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) =>
                    setDate(
                      e.target.value ? new Date(e.target.value) : undefined,
                    )
                  }
                  className="opacity-0 absolute pointer-events-none"
                />
                <div
                  className={`
                    w-full h-10 border rounded-md flex items-center px-3
                    cursor-pointer hover:border-blue-500 transition-colors
                  `}
                  onClick={() =>
                    (
                      document.getElementById('grade-date') as HTMLInputElement
                    ).showPicker()
                  }
                >
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                  {date
                    ? format(date, 'dd MMMM yyyy', { locale: fr })
                    : 'Sélectionner une date'}
                </div>
              </div>
            </div>

            {/* Ligne 2: Session */}
            <div className="space-y-2">
              <Label>Classe et Matière</Label>
              <Select
                value={selectedSession?.id}
                onValueChange={(sessionId) => {
                  const session = (teacherCourses as CourseWithRelations).courses_sessions.find(
                    (s) => s.id === sessionId,
                  )
                  if (session) {
                    setSelectedSession({
                      id: sessionId,
                      courseId: teacherCourses.id,
                      sessionId: session.id,
                      subject: session.subject as SubjectNameEnum,
                    })
                    handleSelectSession(sessionId)
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {(teacherCourses as CourseWithRelations).courses_sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {`${session.subject} - Niveau ${session.level} -
                        ${formatDayOfWeek(session.courses_sessions_timeslot[0].day_of_week)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  className={`
                    shadow-sm border-l-4 overflow-hidden rounded-lg
                    animate-fadeIn transition-all
                    ${record?.isAbsent
                  ? 'border-l-red-400 bg-red-50/30'
                  : isGraded
                    ? 'border-l-green-500'
                    : 'border-l-yellow-400'
                }
                  `}
                >
                  <CardContent className="p-4">
                    <div className={`
                      flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4
                    `}>
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
                              className={`
                                bg-red-100 text-red-600 text-xs
                              `}
                            >
                              Absent
                            </Badge>
                          )}
                          {isGraded && (
                            <Badge
                              variant="outline"
                              className={`
                                bg-green-100 text-green-600 text-xs
                              `}
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
        ) : selectedSession ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm mt-6">
            <div className="text-gray-400 mb-3">
              <ClipboardEdit className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              Aucun élève dans cette classe
            </h3>
            <p className="text-gray-500 mb-4">
              Cette session ne contient pas d&apos;élèves à noter.
            </p>
          </div>
        ) : null}
      </div>

      {/* Statistiques récapitulatives avant les boutons d'action */}
      {gradeEntries.students.length > 0 &&
        selectedSession &&
        selectedType &&
        date && (
        <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex flex-wrap gap-3 mb-3">
            <Badge variant="outline" className={getTypeColor(selectedType)}>
              {selectedType}
            </Badge>
            {selectedSession.subject && (
              <Badge
                variant="outline"
                className={getSubjectColor(selectedSession.subject)}
              >
                {selectedSession.subject}
              </Badge>
            )}
            <Badge variant="outline" className="bg-gray-100 text-gray-700">
              {format(date, 'dd MMMM', { locale: fr })}
            </Badge>
          </div>
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
              disabled={!date || !selectedType || !selectedSession || loading}
              onClick={() => handleSubmit(true)}
            >
              {isLoadingGrade
                ? 'Enregistrement...'
                : 'Enregistrer comme brouillon'}
            </Button>
            <Button
              disabled={!date || !selectedType || !selectedSession || loading}
              className="flex-1 h-12 w-full"
              onClick={() => handleSubmit(false)}
            >
              Valider les notes
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className={`
          fixed top-4 left-1/2 transform -translate-x-1/2
          flex items-center justify-center gap-2 text-red-600
          bg-red-50 px-4 py-3 rounded-lg shadow-md z-50
        `}>
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  )
}
