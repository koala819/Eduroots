import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { useToast } from '@/client/hooks/use-toast'
import { createGradeRecord } from '@/server/actions/api/grades'
import { CourseWithRelations } from '@/types/courses'
import type { CreateGradePayload } from '@/types/grade-payload'
import { GradeEntry, GradeTypeEnum } from '@/types/grades'

// Schéma de validation Zod
const gradeEntrySchema = z.object({
  id: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  gender: z.string().nullable(),
  value: z.number().min(0).max(20),
  isAbsent: z.boolean(),
  comment: z.string(),
}) satisfies z.ZodType<GradeEntry>

const createGradeFormSchema = z.object({
  selectedSession: z.string().min(1, 'Veuillez sélectionner une session'),
  gradeType: z.nativeEnum(GradeTypeEnum, {
    errorMap: () => ({ message: 'Veuillez sélectionner un type d\'évaluation' }),
  }),
  gradeDate: z.string().min(1, 'La date est requise'),
  gradeEntries: z.array(gradeEntrySchema).min(1, 'Au moins un élève est requis'),
})

export type CreateGradeFormData = z.infer<typeof createGradeFormSchema>

export function useCreateGradeForm(initialCourses: CourseWithRelations[]) {
  const router = useRouter()
  const { toast } = useToast()

  // État des étapes
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Formulaire avec React Hook Form
  const form = useForm<CreateGradeFormData>({
    resolver: zodResolver(createGradeFormSchema),
    defaultValues: {
      selectedSession: '',
      gradeType: GradeTypeEnum.Controle,
      gradeDate: format(new Date(), 'yyyy-MM-dd'),
      gradeEntries: [],
    },
    mode: 'onChange',
  })

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    trigger,
  } = form

  const selectedSession = watch('selectedSession')
  const gradeType = watch('gradeType')
  const gradeDate = watch('gradeDate')
  const gradeEntries = watch('gradeEntries')

  // Prendre le premier cours (ou le cours principal)
  const teacherCourses = initialCourses[0] || null

  const handleNextStep = useCallback(async () => {
    if (currentStep === 1) {
      // Validation de l'étape 1 : seulement gradeType et gradeDate
      const isValid = await trigger(['gradeType', 'gradeDate'])
      if (isValid) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      // Validation de l'étape 2 : selectedSession et gradeEntries
      const isValid = await trigger(['selectedSession', 'gradeEntries'])
      if (isValid) {
        setCurrentStep(3)
      }
    }
  }, [currentStep, trigger])

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
          setValue('gradeEntries', [])
          return
        }

        const initialRecords: GradeEntry[] = validStudents.map(
          (s) => ({
            id: s.users.id,
            firstname: s.users.firstname,
            lastname: s.users.lastname,
            gender: s.users.gender,
            value: 0,
            isAbsent: false,
            comment: '',
          }),
        )

        setValue('gradeEntries', initialRecords)
      }
    },
    [teacherCourses, setValue],
  )

  const updateGradeFormData = useCallback(
    (
      studentId: string,
      field: 'value' | 'isAbsent' | 'comment',
      value: string | number | boolean,
    ) => {
      const currentEntries = form.getValues('gradeEntries')
      const recordIndex = currentEntries.findIndex(
        (r) => r.id === studentId,
      )

      if (recordIndex === -1) return

      const newRecords = [...currentEntries]
      newRecords[recordIndex] = {
        ...newRecords[recordIndex],
        [field]: value,
      }

      setValue('gradeEntries', newRecords, { shouldValidate: true })
    },
    [setValue, form],
  )

  const getStudentRecord = useCallback(
    (studentId: string) => {
      return gradeEntries.find((record) => record.id === studentId)
    },
    [gradeEntries],
  )

  const onSubmit = async (data: CreateGradeFormData) => {
    // Validation avant soumission
    const gradedStudents = data.gradeEntries.filter((e) => !e.isAbsent && e.value > 0)
    const absentStudents = data.gradeEntries.filter((e) => e.isAbsent)
    const ungradedStudents = data.gradeEntries.filter((e) => !e.isAbsent && e.value === 0)

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

    const gradeData: CreateGradePayload = {
      course_session_id: data.selectedSession,
      date: data.gradeDate,
      type: data.gradeType,
      is_draft: false,
      records: data.gradeEntries.map((record) => ({
        student_id: record.id,
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
    }
  }

  return {
    // État
    currentStep,
    teacherCourses,

    // Formulaire
    form,
    selectedSession,
    gradeType,
    gradeDate,
    gradeEntries,
    errors,
    isSubmitting,
    isValid,

    // Actions
    handleNextStep,
    handlePreviousStep,
    handleSelectSession,
    updateGradeFormData,
    getStudentRecord,
    onSubmit: handleSubmit(onSubmit),
    setValue,
  }
}
