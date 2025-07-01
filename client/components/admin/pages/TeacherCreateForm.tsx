'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import StepOne from '@/client/components/root/TeacherCreateStep1'
import StepTwo from '@/client/components/root/TeacherCreateStep2'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Form } from '@/client/components/ui/form'
import { useToast } from '@/client/hooks/use-toast'
import { createCourse } from '@/server/actions/api/courses'
import { createTeacher } from '@/server/actions/api/teachers'
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
  const { toast } = useToast()
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState<number>(1)

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
    startTransition(async () => {
      try {
        // Créer le professeur avec Server Action
        const teacherData: CreateTeacherPayload = {
          firstname: values.firstname,
          lastname: values.lastname,
          email: values.email,
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

        const teacherResult = await createTeacher(teacherData)

        if (!teacherResult.success || !teacherResult.data?.id) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description:
              teacherResult.message || 'Une erreur est survenue lors de la création du professeur',
          })
          return
        }

        // Créer le cours avec Server Action
        const courseData: CreateCoursePayload = {
          is_active: true,
          academic_year: '2024-2025',
          deleted_at: null,
          teacherIds: [teacherResult.data.id],
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

        const courseResult = await createCourse(courseData)

        if (!courseResult.success) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description:
              courseResult.message || 'Une erreur est survenue lors de la création du cours',
          })
          return
        }

        // Succès
        toast({
          variant: 'default',
          title: 'Succès',
          description: 'Professeur et cours créés avec succès !',
        })

        form.reset()
        setCurrentStep(1)
        router.push(`/admin/members/teacher/edit/${teacherResult.data.id}`)
      } catch (error: any) {
        console.error('Erreur lors de l\'ajout du professeur :', error)
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description:
              error instanceof Error
                ? error.message
                : 'Une erreur est survenue',
        })
      }
    })
  }

  return (
    <Card
      className="w-full max-w-2xl mx-auto shadow-lg rounded-lg bg-background border border-border"
    >
      <CardHeader className="border-b border-border">
        <CardTitle className="text-xl md:text-2xl text-primary font-semibold">
          Nouveau Professeur
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-border -z-10" />
          {steps.map((step) => (
            <div key={step.number} className="text-center flex-1">
              <div
                className={`
                  w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center
                  font-bold transition-all duration-300 shadow-sm
                  ${
            currentStep === step.number
              ? 'bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20'
              : currentStep > step.number
                ? 'bg-success text-white'
                : 'bg-muted text-muted-foreground'
            }
                `}
              >
                {step.number}
              </div>
              <div className="text-xs md:text-sm text-foreground font-medium">
                {step.label}
              </div>
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 1 && <StepOne form={form} />}
            {currentStep === 2 && <StepTwo form={form} />}

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  disabled={isPending}
                >
                  Précédent
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                className={`
                  px-6 py-2 font-medium transition-all duration-200
                  ${currentStep === 1 ? 'ml-auto' : ''}
                  ${
    currentStep === 2
      ? 'bg-success hover:bg-success-dark text-white shadow-md hover:shadow-lg'
      : 'bg-primary hover:bg-primary-dark text-primary-foreground shadow-md hover:shadow-lg'
    }
                `}
                disabled={isPending}
              >
                {isPending
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
