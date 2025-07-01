'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { StepOne } from '@/client/components/admin/atoms/NewStudentStep1'
import StepThree from '@/client/components/admin/atoms/NewStudentStep3'
import StepTwo from '@/client/components/admin/molecules/NewStudentStep2'
import { Button } from '@/client/components/ui/button'
import { Form } from '@/client/components/ui/form'
import { useToast } from '@/client/hooks/use-toast'
import { createStudentWithCourses } from '@/server/actions/api/students'
import { CourseWithRelations, SubjectNameEnum, TimeSlotEnum } from '@/types/courses'
import { DayScheduleWithType } from '@/types/schedule'
import { CreateStudentPayload } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'
import { GenderEnum, UserRoleEnum, UserType } from '@/types/user'

interface NewStudentFormProps {
  teachers: TeacherResponse[]
  courses?: CourseWithRelations[]
  schedules?: DayScheduleWithType[] | null
}

const studentSchema = z.object({
  firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  parentEmail1: z
    .string()
    .min(1, 'L\'email du parent 1 est requis')
    .email('Email invalide'),
  parentEmail2: z
    .string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  gender: z.nativeEnum(GenderEnum, {
    errorMap: () => ({ message: 'Veuillez sélectionner un genre' }),
  }),
  dateOfBirth: z.string().optional(),
  timeSlot: z.nativeEnum(TimeSlotEnum, {
    errorMap: () => ({ message: 'Veuillez sélectionner un créneau' }),
  }),
  selections: z.array(
    z.object({
      dayOfWeek: z.nativeEnum(TimeSlotEnum),
      startTime: z.string(),
      endTime: z.string(),
      subject: z.nativeEnum(SubjectNameEnum),
      teacherId: z.string(),
    }),
  ),
  phone: z.string().optional(),
})
export type FormData = z.infer<typeof studentSchema>;

const NewStudentForm = ({ teachers = [], courses, schedules }: NewStudentFormProps) => {
  const router = useRouter()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const form = useForm<FormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      parentEmail1: '',
      parentEmail2: '',
      gender: GenderEnum.Masculin,
      dateOfBirth: '',
      timeSlot: undefined,
      selections: [],
    },
  })

  const steps = [
    { number: 1, label: 'Informations personnelles' },
    { number: 2, label: 'Choix de l\'enseignant' },
    { number: 3, label: 'Confirmation' },
  ]

  // Validation des étapes
  const validateStep1 = () => {
    return form.trigger([
      'firstname',
      'lastname',
      'parentEmail1',
      'parentEmail2',
      'gender',
      'dateOfBirth',
    ])
  }

  const validateStep2 = () => {
    return form.trigger(['timeSlot', 'selections'])
  }

  const handleNext = async () => {
    let isValid = false

    switch (currentStep) {
    case 1:
      isValid = await validateStep1()
      break
    case 2:
      isValid = await validateStep2()
      break
    case 3:
      await form.handleSubmit(onSubmit)()
      return
    }

    if (isValid && currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const onSubmit = async (values: FormData) => {
    // console.log('🚀 values from FORM:', values)
    // const values = {
    //   dateOfBirth: '2011-05-29',
    //   firstname: 'Fatima Ezahra',
    //   gender: GenderEnum.Feminin,
    //   lastname: 'MCHICHOU',
    //   parentEmail1: 'toto@gmail.com',
    //   parentEmail2: 'user@mail.fr',
    //   selections: [
    //     {
    //       dayOfWeek: 'sunday_morning',
    //       startTime: '09:00',
    //       endTime: '10:45',
    //       subject: SubjectNameEnum.Arabe,
    //       teacherId: '66a2949c663162c51e32f26d',
    //     },
    //     {
    //       dayOfWeek: 'sunday_morning',
    //       startTime: '10:45',
    //       endTime: '12:30',
    //       subject: SubjectNameEnum.EducationCulturelle,
    //       teacherId: '66a2949c663162c51e32f26d',
    //     },
    //   ],
    // }

    try {
      setIsLoading(true)

      const studentData: CreateStudentPayload = {
        email: values.parentEmail1,
        firstname: values.firstname,
        lastname: values.lastname,
        password: '', // Gérer le mot de passe
        role: UserRoleEnum.Student,
        type: UserType.Both,
        gender: values.gender,
        secondary_email: values.parentEmail2 || null,
        phone: values.phone ?? null,
        school_year: '2024-2025',
        subjects: values.selections.map((s) => s.subject),
        has_invalid_email: values.parentEmail1 === 'user@mail.fr',
        date_of_birth: values.dateOfBirth ? new Date(values.dateOfBirth) : null,
        is_active: true,
        deleted_at: null,
        stats_model: null,
        student_stats_id: null,
        teacher_stats_id: null,
      }

      const response = await createStudentWithCourses(studentData, values.selections)

      if (response.success) {
        toast({
          title: 'Succès',
          variant: 'success',
          description: 'L\'étudiant a été créé avec succès',
        })

        setTimeout(() => {
          router.push('/admin')
        }, 100)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: response.message || 'Une erreur est survenue',
        })
      }
    } catch (error: any) {
      console.error('Student creation error:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message ?? 'Une erreur est survenue',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Nouvel Étudiant
        </h1>
        <p className="text-muted-foreground">
          Créez un nouvel étudiant en 3 étapes simples
        </p>
      </div>

      {/* Stepper */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-10" />
        {steps.map((step) => (
          <div key={step.number} className="text-center flex-1">
            <div
              className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center
                text-sm font-medium
                ${
          currentStep === step.number
            ? 'bg-primary text-primary-foreground'
            : currentStep > step.number
              ? 'bg-success text-success-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
            >
              {step.number}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">{step.label}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 1 && <StepOne form={form} />}
          {currentStep === 2 && (
            <StepTwo
              form={form}
              teachers={teachers}
              courses={courses}
              schedules={schedules}
            />
          )}
          {currentStep === 3 && <StepThree form={form} teachers={teachers} />}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-border">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-6"
              >
                Précédent
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              className={`${currentStep === 1 ? 'ml-auto' : ''} px-6 ${
                currentStep === 3 ? 'bg-success hover:bg-success-dark' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading
                ? 'Chargement...'
                : currentStep === 3
                  ? 'Valider l\'inscription'
                  : 'Suivant'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default NewStudentForm
