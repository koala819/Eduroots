'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { useToast } from '@/client/hooks/use-toast'

import { CourseSession, SubjectNameEnum } from '@/zUnused/types/course'
import { GenderEnum, UserRoleEnum, UserType } from '@/types/user'

import StepOne from '@/client//components/admin/atoms/NewStudentStep1'
import StepThree from '@/client//components/admin/atoms/NewStudentStep3'
import StepTwo from '@/client//components/admin/molecules/NewStudentStep2'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Form } from '@/client/components/ui/form'

import { useCourses } from '@/client/context/courses'
import { useStudents } from '@/client/context/students'
import { useTeachers } from '@/client/context/teachers'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import useCourseStore from '@/client/stores/useCourseStore'
import { TimeSlotEnum } from '@/types/courses'
import { Student } from '@/zUnused/types/user'

const studentSchema = z.object({
  firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  parentEmail1: z
    .string()
    .email('Email invalide')
    .optional()
    .default('user@mail.fr'),
  parentEmail2: z
    .string()
    .email('Email invalide')
    .optional()
    .default('user@mail.fr'),
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
})

// const studentSchema = z.object({})

export type FormData = z.infer<typeof studentSchema>;

const NewStudentForm = () => {
  const { addStudentToCourse } = useCourses()
  const { courses } = useCourseStore()
  const router = useRouter()
  const { createStudent } = useStudents()
  const { teachers, getAllTeachers } = useTeachers()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const form = useForm<FormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      parentEmail1: 'user@mail.fr',
      parentEmail2: 'user@mail.fr',
      gender: undefined,
      dateOfBirth: '',
      timeSlot: undefined,
      selections: [],
    },
  })

  useEffect(() => {
    getAllTeachers()
  }, [getAllTeachers])

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
      const studentData: Omit<
        Student,
        'id' | '_id' | 'createdAt' | 'updatedAt'
      > = {
        firstname: values.firstname,
        lastname: values.lastname,
        email: values.parentEmail1,
        hasInvalidEmail: values.parentEmail1 === 'user@mail.fr',
        secondaryEmail: values.parentEmail2,
        password: '',
        role: UserRoleEnum.Student,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
        type: UserType.Both,
        subjects: values.selections.map((s) => s.subject),
        schoolYear: '2024-2025',
        isActive: true,
      }

      const student = await createStudent(studentData)
      if (!student.id) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description:
            'Une erreur est survenue lors de la création de l\'étudiant',
        })
        throw new Error('Erreur lors de la création de l\'étudiant')
      }

      for (const selection of values.selections) {
        try {
          // 1. D'abord récupérer les cours du professeur
          const teacherCourse = courses.find(
            (course) =>
              Array.isArray(course.teacher) &&
              course.teacher.some(
                (teacherId) => teacherId === selection.teacherId,
              ),
          )

          if (!teacherCourse) {
            toast({
              variant: 'destructive',
              title: 'Erreur',
              description: 'Aucun cours trouvé pour le professeur',
            })
            throw new Error('Aucun cours trouvé pour le professeur')
          }

          // 2. Trouver la bonne session qui correspond à la sélection
          const targetSession = teacherCourse.sessions.find(
            (session: CourseSession) => {
              if (!session?.timeSlot) return false

              return (
                session.timeSlot.dayOfWeek === selection.dayOfWeek &&
                session.subject === selection.subject &&
                session.timeSlot.startTime === selection.startTime &&
                session.timeSlot.endTime === selection.endTime
              )
            },
          )

          if (!targetSession) {
            toast({
              variant: 'destructive',
              title: 'Erreur',
              description: `Session non trouvée pour ${selection.subject}`,
            })
            throw new Error(`Session non trouvée pour ${selection.subject}`)
          }

          // 3. Ajouter l'étudiant au cours
          await addStudentToCourse(teacherCourse.id, student.id, {
            dayOfWeek: selection.dayOfWeek,
            startTime: selection.startTime,
            endTime: selection.endTime,
            subject: selection.subject,
          })

          toast({
            title: 'Succès',
            variant: 'success',
            description: 'L\'étudiant a été créé avec succès',
          })
        } catch (error) {
          console.error(
            `Erreur lors de l'ajout au cours ${selection.subject}:`,
            error,
          )
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description:
              error instanceof Error
                ? error.message
                : 'Une erreur est survenue',
          })
        }
      }
    } catch (error: any) {
      console.error('Student creation error:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          error.message ||
          'Une erreur est survenue lors de la création de l\'étudiant',
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        window.location.reload()
        router.push('/admin/settings')
      }, 100)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Nouvel Étudiant</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stepper */}
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
            {currentStep === 2 && <StepTwo form={form} teachers={teachers} />}
            {currentStep === 3 && <StepThree form={form} teachers={teachers} />}
            {/* {currentStep === 3 && <StepThree form={form} teachers={teachers} />} */}

            {/* Navigation */}
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
                  currentStep === 3 ? 'bg-green-500 hover:bg-green-600' : ''
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
      </CardContent>
    </Card>
  )
}

export default NewStudentForm
