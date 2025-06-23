'use client'

import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { GradesInfoForm } from '@/client/components/pages/GradesInfoForm'
import { GradesStudentList } from '@/client/components/pages/GradesStudentList'
import { useToast } from '@/client/hooks/use-toast'
import { createGradeRecord } from '@/server/actions/api/grades'
import { CourseWithRelations } from '@/types/courses'
import type { CreateGradePayload } from '@/types/grade-payload'
import { GradeTypeEnum } from '@/types/grades'

type GradeEntry = {
  student: string
  value: number
  isAbsent: boolean
  comment: string
}

interface CreateGradeFormProps {
  initialCourses: CourseWithRelations[]
}

export function CreateGradeForm({ initialCourses }: CreateGradeFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [selectedSession, setSelectedSession] = useState<string>('')
  const [gradeType, setGradeType] = useState<GradeTypeEnum>(GradeTypeEnum.Controle)
  const [gradeDate, setGradeDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)

  // Prendre le premier cours (ou le cours principal)
  const teacherCourses = initialCourses[0] || null

  // Calcul des statistiques pour la progression
  const stats = useMemo(() => {
    if (!gradeEntries.length)
      return { completed: 0, total: 0, percent: 0, average: 0 }

    const total = gradeEntries.length
    const absentCount = gradeEntries.filter((r) => r.isAbsent).length
    const gradedCount = gradeEntries.filter(
      (r) => !r.isAbsent && r.value > 0,
    ).length
    const sum = gradeEntries.reduce(
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
  }, [gradeEntries])

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      const session = teacherCourses?.courses_sessions.find(
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

        setGradeEntries(initialRecords)
      }
    },
    [teacherCourses],
  )

  const handleGradeUpdate = useCallback(
    (
      studentId: string,
      field: 'value' | 'isAbsent' | 'comment',
      value: string | number | boolean,
    ) => {
      setGradeEntries((prev) => {
        const recordIndex = prev.findIndex(
          (r) => r.student === studentId,
        )

        if (recordIndex === -1) return prev

        const newRecords = [...prev]
        newRecords[recordIndex] = {
          ...newRecords[recordIndex],
          [field]: value,
        }

        return newRecords
      })
    },
    [],
  )

  const getStudentRecord = useCallback(
    (studentId: string) => {
      return gradeEntries.find((record) => record.student === studentId)
    },
    [gradeEntries],
  )

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const gradeData: CreateGradePayload = {
      course_session_id: selectedSession,
      date: gradeDate,
      type: gradeType,
      is_draft: false,
      records: gradeEntries.map((record) => ({
        student_id: record.student,
        value: record.value,
        is_absent: record.isAbsent,
        comment: record.comment || null,
      })),
    }

    try {
      const result = await createGradeRecord(gradeData)

      if (result.success) {
        toast({
          variant: 'success',
          title: 'Notes validées',
          description: 'Les notes ont été enregistrées avec succès',
          duration: 3000,
        })
        router.push('/teacher/settings/grades')
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description:
            result.message ||
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
      setIsSubmitting(false)
    }
  }

  // Obtenir la couleur en fonction du type d'évaluation
  const getTypeColor = (type: GradeTypeEnum | undefined) => {
    switch (type) {
    case GradeTypeEnum.Controle:
      return 'bg-blue-100 text-blue-600'
    case GradeTypeEnum.Devoir:
      return 'bg-green-100 text-green-600'
    case GradeTypeEnum.Examen:
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground
            bg-gradient-to-r from-primary to-primary-accent
            bg-clip-text">
            Créer une nouvelle évaluation
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Remplissez les informations ci-dessous pour créer une évaluation
            et saisir les notes de vos élèves.
          </p>
        </div>

        {/* Formulaire */}
        <div className="space-y-8">
          {/* Informations de base */}
          <GradesInfoForm
            gradeType={gradeType}
            setGradeType={setGradeType}
            gradeDate={gradeDate}
            setGradeDate={setGradeDate}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            teacherCourses={teacherCourses}
            onSessionSelect={handleSelectSession}
          />

          {/* Liste des élèves */}
          {selectedSession && (
            <GradesStudentList
              gradeEntries={gradeEntries}
              selectedSession={selectedSession}
              getStudentRecord={getStudentRecord}
              handleGradeUpdate={handleGradeUpdate}
            />
          )}

          {/* Actions */}
          {selectedSession && gradeEntries.length > 0 && (
            <div className="flex justify-center pt-6">
              <button
                onClick={handleSubmit}
                disabled={!gradeDate || !gradeType || !selectedSession || isSubmitting}
                className="px-8 py-3 bg-primary text-primary-foreground
                  rounded-[--radius] font-medium hover:bg-primary-dark
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-lg hover:shadow-xl
                  transform hover:scale-105"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground
                      border-t-transparent rounded-full animate-spin"></div>
                    Création en cours...
                  </div>
                ) : (
                  'Créer l\'évaluation'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Message d'état */}
        {message && (
          <div className={`fixed top-4 right-4 p-4 rounded-[--radius] shadow-lg
            transition-all duration-300 ${
          message.type === 'success'
            ? 'bg-success text-success-foreground'
            : 'bg-error text-error-foreground'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
