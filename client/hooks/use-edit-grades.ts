import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { useGrades } from '@/client/context/grades'
import { useToast } from '@/client/hooks/use-toast'
import { formatDayOfWeek } from '@/client/utils/timeSlots'
import { SubjectNameEnum, TimeSlotEnum } from '@/types/courses'
import type { CreateGradePayload } from '@/types/grade-payload'
import {
  GradeRecordWithUser,
  GradeTypeEnum,
  Student,
} from '@/types/grades'

// Schéma de validation pour l'édition
const editGradeFormSchema = z.object({
  gradeEntries: z.array(z.object({
    student_id: z.string(),
    value: z.number().min(0).max(20).nullable(),
    is_absent: z.boolean(),
    comment: z.string().nullable(),
  })).min(1, 'Au moins un élève est requis'),
})

export type EditGradeFormData = z.infer<typeof editGradeFormSchema>

interface GradeInfo {
  id: string
  date: Date
  type: GradeTypeEnum
  courseLevel: string
  dayOfWeek: string
  subject?: SubjectNameEnum
  is_draft: boolean
}

interface UseEditGradeFormProps {
  gradeId: string
  initialGradeData?: any
}

export function useEditGradeForm({ gradeId, initialGradeData }: UseEditGradeFormProps) {
  const { updateGradeRecord } = useGrades()
  const router = useRouter()
  const { toast } = useToast()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [gradeInfo, setGradeInfo] = useState<GradeInfo | null>(null)
  const [gradeEntries, setGradeEntries] = useState<{
    students: Student[]
    records: GradeRecordWithUser[]
  }>({
    students: [],
    records: [],
  })

  // Formulaire avec React Hook Form
  const form = useForm<EditGradeFormData>({
    resolver: zodResolver(editGradeFormSchema),
    defaultValues: {
      gradeEntries: [],
    },
    mode: 'onChange',
  })

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = form

  const formGradeEntries = watch('gradeEntries')

  // Initialiser les données avec les données côté serveur
  useEffect(() => {
    if (initialGradeData) {
      try {
        const grade = initialGradeData
        const courseSession = grade.courses_sessions

        setGradeInfo({
          id: grade.id,
          date: new Date(grade.date),
          type: grade.type as GradeTypeEnum,
          courseLevel: courseSession.level,
          dayOfWeek: courseSession.courses_sessions_timeslot?.[0]?.day_of_week ?? '',
          subject: courseSession.subject as SubjectNameEnum,
          is_draft: grade.is_draft,
        })

        // Préparer les données des élèves et leurs notes
        const convertedRecords = grade.grades_records.map((record: any) => ({
          ...record,
          student: record.users,
        }))

        const convertedStudents = grade.grades_records.map((record: any) => record.users)

        setGradeEntries({
          students: convertedStudents,
          records: convertedRecords,
        })

        // Initialiser le formulaire
        setValue('gradeEntries', convertedRecords.map((record: any) => ({
          student_id: record.users.id,
          value: record.value ?? 0,
          is_absent: record.is_absent,
          comment: record.comment ?? null,
        })))
      } catch (err) {
        console.error('🔍 [CLIENT] useEditGradeForm - error initializing data:', err)
        setError('Erreur lors de l\'initialisation des données')
      }
    }
  }, [initialGradeData, setValue])

  // Calcul des statistiques pour la progression
  const stats = useMemo(() => {
    if (!gradeEntries.records.length)
      return { completed: 0, total: 0, percent: 0, average: '0.0' }

    const total = gradeEntries.records.length
    const absentCount = gradeEntries.records.filter((r) => r.is_absent).length
    const gradedCount = gradeEntries.records.filter(
      (r) => !r.is_absent && r.value !== null && r.value > 0,
    ).length
    const sum = gradeEntries.records.reduce(
      (acc, r) => acc + (r.is_absent || r.value === null ? 0 : r.value),
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
      field: keyof Omit<GradeRecordWithUser, 'users'>,
      value: number | string | boolean,
    ) => {
      setGradeEntries((prev) => {
        const recordIndex = prev.records.findIndex(
          (r) => r.users.id === studentId,
        )

        if (recordIndex === -1) return prev

        const newRecords = [...prev.records]
        newRecords[recordIndex] = {
          ...newRecords[recordIndex],
          [field]: value,
          // Si marqué absent, réinitialiser la note
          ...(field === 'is_absent' && value === true ? { value: 0 } : {}),
        }

        return {
          ...prev,
          records: newRecords,
        }
      })

      // Mettre à jour le formulaire
      const formIndex = formGradeEntries.findIndex(
        (r) => r.student_id === studentId,
      )
      if (formIndex !== -1) {
        const newFormEntries = [...formGradeEntries]
        newFormEntries[formIndex] = {
          ...newFormEntries[formIndex],
          [field]: value,
          ...(field === 'is_absent' && value === true ? { value: 0 } : {}),
        }
        setValue('gradeEntries', newFormEntries, { shouldValidate: true })
      }
    },
    [formGradeEntries, setValue],
  )

  const getStudentRecord = useCallback(
    (studentId: string) => {
      return gradeEntries.records.find((record) => record.users.id === studentId)
    },
    [gradeEntries.records],
  )

  const onSubmit = async (data: EditGradeFormData) => {
    if (!gradeInfo) return

    setLoading(true)
    const updateData: CreateGradePayload = {
      date: gradeInfo.date.toISOString(),
      type: gradeInfo.type,
      is_draft: false,
      course_session_id: gradeInfo.id,
      records: data.gradeEntries.map((record) => ({
        student_id: record.student_id,
        value: record.value,
        is_absent: record.is_absent,
        comment: record.comment ?? null,
      })),
    }

    try {
      const success = await updateGradeRecord(gradeId, updateData)

      if (success) {
        toast({
          variant: 'success',
          title: 'Notes validées',
          description: 'Les modifications ont été enregistrées avec succès',
          duration: 3000,
        })
        router.push('/teacher/settings/grades')
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la mise à jour des notes',
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

  // Fonctions utilitaires pour les couleurs et labels
  const getTypeColor = useCallback((type: GradeTypeEnum) => {
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
  }, [])

  const getSubjectColor = useCallback((subject: SubjectNameEnum | undefined) => {
    if (!subject) return 'bg-gray-100 text-gray-600'

    switch (subject) {
    case SubjectNameEnum.Arabe:
      return 'bg-emerald-100 text-emerald-600'
    case SubjectNameEnum.EducationCulturelle:
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
    }
  }, [])

  const getGradeTypeLabel = useCallback((type: GradeTypeEnum) => {
    switch (type) {
    case GradeTypeEnum.Examen:
      return 'Examen'
    case GradeTypeEnum.Devoir:
      return 'Devoir'
    case GradeTypeEnum.Controle:
      return 'Contrôle'
    default:
      return type
    }
  }, [])

  const getFormattedDayOfWeek = useCallback((dayOfWeek: string) => {
    return formatDayOfWeek(dayOfWeek as TimeSlotEnum)
  }, [])

  return {
    // État
    error,
    loading,
    gradeInfo,
    gradeEntries,
    stats,

    // Formulaire
    form,
    formGradeEntries,
    errors,
    isSubmitting,
    isValid,

    // Actions
    handleGradeUpdate,
    getStudentRecord,
    onSubmit: handleSubmit(onSubmit),
    setValue,

    // Utilitaires
    getTypeColor,
    getSubjectColor,
    getGradeTypeLabel,
    getFormattedDayOfWeek,
  }
}
