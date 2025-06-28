'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { SessionConfigurationStep } from '@/client/components/root/EditStudentCourseSessionStep'
import { TimeSlotSelectionStep } from '@/client/components/root/EditStudentCourseTimeSlotStep'
import { Form } from '@/client/components/ui/form'
import { useToast } from '@/client/hooks/use-toast'
import { updateStudentCourses } from '@/server/actions/api/courses'
import {
  CourseWithRelations,
  SubjectNameEnum,
  TimeSlotEnum,
} from '@/types/courses'
import { TeacherResponse } from '@/types/teacher-payload'

// Schéma simplifié avec validation des heures
const CourseSessionSchema = z.object({
  timeSlot: z.nativeEnum(TimeSlotEnum, {
    required_error: 'Veuillez sélectionner un créneau',
  }),
  selections: z.array(
    z.object({
      dayOfWeek: z.nativeEnum(TimeSlotEnum),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM requis'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM requis'),
      subject: z.nativeEnum(SubjectNameEnum, {
        required_error: 'La matière est requise',
      }),
      teacherId: z.string().min(1, 'Veuillez sélectionner un professeur'),
    }).refine((data) => {
      const startMinutes = parseInt(data.startTime
        .split(':')[0]) * 60 + parseInt(data.startTime.split(':')[1])
      const endMinutes = parseInt(data.endTime
        .split(':')[0]) * 60 + parseInt(data.endTime.split(':')[1])
      return endMinutes > startMinutes
    }, {
      message: 'L\'heure de fin doit être après l\'heure de début',
      path: ['endTime'],
    }),
  ),
})

type FormData = z.infer<typeof CourseSessionSchema>

interface EditCourseStudentProps {
  studentId: string
  initialData: {
    existingCourses: CourseWithRelations[]
    availableTeachers: TeacherResponse[]
    timeSlotConfigs: Array<{
      id: TimeSlotEnum
      label: string
      sessions: Array<{ startTime: string; endTime: string }>
    }>
  }
}

export const EditCourseStudent = ({ studentId, initialData }: EditCourseStudentProps) => {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Valeurs par défaut simplifiées
  const defaultTimeSlot = initialData.timeSlotConfigs[0]?.id || TimeSlotEnum.SATURDAY_MORNING

  const defaultSelections = (() => {
    try {
      // Essayer de récupérer les cours existants
      const existingSelections = initialData.existingCourses
        ?.filter((course) => course.courses_sessions && Array.isArray(course.courses_sessions))
        ?.flatMap((course) =>
          course.courses_sessions.map((session) => ({
            dayOfWeek: session.courses_sessions_timeslot[0]?.day_of_week || defaultTimeSlot,
            startTime: session.courses_sessions_timeslot[0]?.start_time || '09:00',
            endTime: session.courses_sessions_timeslot[0]?.end_time || '10:00',
            subject: session.subject as SubjectNameEnum,
            teacherId: course.courses_teacher[0]?.users?.id || '',
          })),
        ) || []

      // Si on a des sélections existantes, les utiliser
      if (existingSelections.length > 0) {
        return existingSelections
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des cours existants:', error)
    }

    // Sinon, utiliser la configuration par défaut
    const defaultConfig = initialData.timeSlotConfigs.find((c) => c.id === defaultTimeSlot)
    return defaultConfig?.sessions.map((session) => ({
      dayOfWeek: defaultTimeSlot,
      startTime: session.startTime,
      endTime: session.endTime,
      subject: '' as SubjectNameEnum,
      teacherId: '',
    })) || []
  })()

  const form = useForm<FormData>({
    resolver: zodResolver(CourseSessionSchema),
    defaultValues: {
      timeSlot: defaultTimeSlot,
      selections: defaultSelections,
    },
  })

  const selectedTimeSlot = form.watch('timeSlot')
  const selections = form.watch('selections')

  // Validation des étapes
  const isStep1Valid = !!selectedTimeSlot
  const isStep2Valid = selections.every((selection) =>
    selection.subject && selection.teacherId,
  )

  const handleNextStep = () => {
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/root/student/edit/${studentId}`)
  }

  const handleTimeSlotChange = (timeSlot: TimeSlotEnum) => {
    form.setValue('timeSlot', timeSlot)

    // Réinitialiser les sélections avec le nouveau créneau
    const timeSlotConfig = initialData.timeSlotConfigs.find((c) => c.id === timeSlot)
    if (timeSlotConfig) {
      const newSelections = timeSlotConfig.sessions.map((session) => ({
        dayOfWeek: timeSlot,
        startTime: session.startTime,
        endTime: session.endTime,
        subject: '' as SubjectNameEnum,
        teacherId: '',
      }))
      form.setValue('selections', newSelections)
    }
  }

  async function onSubmit(data: FormData) {
    try {
      setIsSubmitting(true)
      const result = await updateStudentCourses(studentId, data.selections)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: 'Succès',
        variant: 'success',
        description: 'Les modifications ont été enregistrées',
        duration: 5000,
      })

      setTimeout(() => {
        router.push('/admin')
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2
            ${currentStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep >= 1 ? 'bg-primary text-white border-primary' : 'border-gray-300'
            }`}>
              {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <span className="font-medium">Créneau</span>
          </div>
          <div className="w-8 h-1 bg-gray-300" />
          <div className={`flex items-center space-x-2
            ${currentStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep >= 2 ? 'bg-primary text-white border-primary' : 'border-gray-300'
            }`}>
              {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
            </div>
            <span className="font-medium">Sessions</span>
          </div>
        </div>

        {/* Étape 1: Sélection du créneau */}
        {currentStep === 1 && (
          <TimeSlotSelectionStep
            timeSlotConfigs={initialData.timeSlotConfigs}
            selectedTimeSlot={selectedTimeSlot}
            onTimeSlotChange={handleTimeSlotChange}
            onNextStep={handleNextStep}
            isStepValid={isStep1Valid}
          />
        )}

        {/* Étape 2: Configuration des sessions */}
        {currentStep === 2 && (
          <SessionConfigurationStep
            selectedTimeSlot={selectedTimeSlot}
            timeSlotConfigs={initialData.timeSlotConfigs}
            form={form}
            onPreviousStep={handlePreviousStep}
            onCancel={handleCancel}
            onSubmit={onSubmit}
            isStepValid={isStep2Valid}
            isSubmitting={isSubmitting}
          />
        )}
      </form>
    </Form>
  )
}
