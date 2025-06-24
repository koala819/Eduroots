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
  studentName?: string
  studentGender?: string | null
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

  // État des étapes
  const [currentStep, setCurrentStep] = useState(1)

  // État du formulaire
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [gradeType, setGradeType] = useState<GradeTypeEnum>(GradeTypeEnum.Controle)
  const [gradeDate, setGradeDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

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

  const handleNextStep = useCallback(() => {
    if (currentStep === 1) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(3)
    }
  }, [currentStep])

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      const session = teacherCourses?.courses_sessions.find(
        (s) => s.id === sessionId,
      )
      if (session) {
        // Vérification de sécurité pour s'assurer que les données users sont présentes
        const validStudents = session.courses_sessions_students.filter(
          (s) => s.users && s.users.id,
        )

        if (validStudents.length === 0) {
          console.warn('Aucun élève valide trouvé dans cette session')
          setGradeEntries([])
          return
        }

        const initialRecords: GradeEntry[] = validStudents.map(
          (s) => ({
            student: s.users.id,
            studentName: `${s.users.firstname} ${s.users.lastname}`,
            studentGender: s.users.gender,
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
    // Validation avant soumission
    const gradedStudents = gradeEntries.filter((e) => !e.isAbsent && e.value > 0)
    const absentStudents = gradeEntries.filter((e) => e.isAbsent)
    const ungradedStudents = gradeEntries.filter((e) => !e.isAbsent && e.value === 0)

    if (ungradedStudents.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Notes manquantes',
        description: `${ungradedStudents.length} élève(s) n'ont pas encore de note.
        Voulez-vous continuer ?`,
        duration: 5000,
      })
      return
    }

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
          title: 'Évaluation créée avec succès !',
          description: `${gradedStudents.length} note(s) enregistrée(s)
          ${absentStudents.length > 0 ? `, ${absentStudents.length} absence(s)` : ''}`,
          duration: 5000,
        })
        router.push('/teacher/settings/grades')
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur lors de la création',
          description: result.message || 'Une erreur est survenue lors de l\'enregistrement',
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
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
            Suivez les étapes pour créer une évaluation et saisir les notes de vos élèves.
          </p>
        </div>

        {/* Formulaire en étapes */}
        <div className="space-y-8">
          {/* Étapes 1-2: Informations et sélection de classe */}
          {currentStep <= 2 && (
            <GradesInfoForm
              gradeType={gradeType}
              setGradeType={setGradeType}
              gradeDate={gradeDate}
              setGradeDate={setGradeDate}
              selectedSession={selectedSession}
              setSelectedSession={setSelectedSession}
              teacherCourses={teacherCourses}
              onSessionSelect={handleSelectSession}
              currentStep={currentStep}
              onNextStep={handleNextStep}
            />
          )}

          {/* Étape 3: Saisie des notes */}
          {currentStep === 3 && selectedSession && (
            <div className="space-y-6">
              {/* Résumé de l'évaluation */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-foreground mb-2">
                  Résumé de l'évaluation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium">{gradeType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(gradeDate), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Élèves:</span>
                    <span className="ml-2 font-medium">{gradeEntries.length}</span>
                  </div>
                </div>
              </div>

              {/* Liste des élèves */}
              <GradesStudentList
                gradeEntries={gradeEntries}
                selectedSession={selectedSession}
                getStudentRecord={getStudentRecord}
                handleGradeUpdate={handleGradeUpdate}
              />

              {/* Actions */}
              <div className="flex justify-between items-center pt-6">
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-2 border border-border bg-background
                    text-foreground rounded-[--radius] hover:bg-muted
                    transition-all duration-200"
                >
                  Retour
                </button>

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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
