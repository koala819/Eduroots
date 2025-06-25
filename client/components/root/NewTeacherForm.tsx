'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import StepOne from '@/client/components/root/NewTeacherStep1'
import StepTwo from '@/client/components/root/NewTeacherStep2'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Form } from '@/client/components/ui/form'
import { useCourses } from '@/client/context/courses'
import { useTeachers } from '@/client/context/teachers'
import { useToast } from '@/client/hooks/use-toast'
import { CreateCoursePayload } from '@/types/course-payload'
import { LevelEnum, SubjectNameEnum, TimeSlotEnum } from '@/types/courses'
import { CreateTeacherPayload } from '@/types/teacher-payload'
import { UserRoleEnum } from '@/types/user'

const teacherSchema = z.object({
  firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  sessions: z
    .array(
      z.object({
        dayOfWeek: z.nativeEnum(TimeSlotEnum),
        timeSlot: z.object({
          startTime: z.string(),
          endTime: z.string(),
          classroomNumber: z.number().nullable(),
        }),
        subject: z.nativeEnum(SubjectNameEnum).nullable(),
        level: z.nativeEnum(LevelEnum).nullable(),
      }),
    )
    .min(2, 'Au moins 2 sessions sont requises')
    .max(6, 'Maximum 6 sessions autorisées'),
})

export type FormData = z.infer<typeof teacherSchema>

const NewTeacherForm = () => {
  const { createCourse } = useCourses()
  const { createTeacher } = useTeachers()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const form = useForm<FormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      sessions: [],
    },
  })

  const steps = [
    { number: 1, label: 'Informations personnelles' },
    { number: 2, label: 'Matières enseignées' },
  ]

  const validateStep1 = () => {
    return form.trigger(['firstname', 'lastname', 'email'])
  }

  const validateStep2 = () => {
    return form.trigger(['sessions'])
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await validateStep1()
      if (isValid) setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      const isValid = await validateStep2()
      if (isValid) await form.handleSubmit(onSubmit)()
    }
  }

  const onSubmit = async (values: FormData) => {
    // const values = {
    //   firstname: 'Jean',
    //   lastname: 'Martin',
    //   email: 'jean@yopmail.com',
    //   sessions: [
    //     {
    //       dayOfWeek: 'saturday_morning',
    //       timeSlot: {
    //         startTime: '09:00',
    //         endTime: '10:45',
    //         classroomNumber: 123,
    //       },
    //       subject: 'Arabe',
    //       level: '3-2',
    //     },
    //     {
    //       dayOfWeek: 'saturday_morning',
    //       timeSlot: {
    //         startTime: '10:45',
    //         endTime: '12:30',
    //         classroomNumber: 321,
    //       },
    //       subject: 'Education Culturelle',
    //       level: '3-2',
    //     },
    //   ],
    // }
    try {
      setIsLoading(true)

      const teacherData: CreateTeacherPayload = {
        firstname: values.firstname,
        lastname: values.lastname,
        email: values.email,
        password: '',
        role: UserRoleEnum.Teacher,
        type: null,
        subjects: [SubjectNameEnum.Arabe, SubjectNameEnum.EducationCulturelle],
        school_year: '2024-2025',
        is_active: true,
        deleted_at: null,
        date_of_birth: null,
        gender: null,
        stats_model: null,
        student_stats_id: null,
        teacher_stats_id: null,
        secondary_email: null,
        phone: null,
        has_invalid_email: false,
      }

      const teacher = await createTeacher(teacherData)

      if (!teacher.id) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la création du professeur',
        })
        throw new Error('Erreur lors de la création du professeur')
      }

      const courseData: CreateCoursePayload = {
        is_active: true,
        academic_year: '2024-2025',
        deleted_at: null,
        teacherIds: [teacher.id],
        sessions: values.sessions.map((session) => ({
          subject: session.subject as string,
          level: session.level as string,
          timeSlots: [{
            day_of_week: session.dayOfWeek,
            start_time: session.timeSlot.startTime,
            end_time: session.timeSlot.endTime,
            classroom_number: session.timeSlot.classroomNumber?.toString() || null,
          }],
        })),
      }

      await createCourse(courseData)
      form.reset()
      setCurrentStep(1)
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du professeur :', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Nouveau Professeur</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-10" />
          {steps.map((step) => (
            <div key={step.number} className="text-center flex-1">
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center
                  ${
            currentStep === step.number
              ? 'bg-blue-500 text-white'
              : currentStep > step.number
                ? 'bg-green-500 text-white'
                : 'bg-gray-200'
            }`}
              >
                {step.number}
              </div>
              <div className="text-sm">{step.label}</div>
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {currentStep === 1 && <StepOne form={form} />}
            {currentStep === 2 && <StepTwo form={form} />}

            <div className="flex justify-between mt-8 pt-4 border-t">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                >
                  Précédent
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                className={`${currentStep === 1 ? 'ml-auto' : ''} ${
                  currentStep === 2 ? 'bg-green-500 hover:bg-green-600' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading
                  ? 'Chargement...'
                  : currentStep === 2
                    ? 'Valider l\'inscription'
                    : 'Suivant'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default NewTeacherForm
