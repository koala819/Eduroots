'use client'

import {useEffect, useMemo, useState} from 'react'
import {useForm} from 'react-hook-form'

import {useRouter} from 'next/navigation'

import {useToast} from '@/hooks/use-toast'

import {LevelEnum, SubjectNameEnum, TimeSlotEnum} from '@/types/course'
import {Teacher} from '@/types/user'

import EditTeacherStep1 from '@/components/root/EditTeacherStep1'
import EditTeacherStep2 from '@/components/root/EditTeacherStep2'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Form} from '@/components/ui/form'

import {useCourses} from '@/context/Courses/client'
import {useTeachers} from '@/context/Teachers/client'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import useCourseStore from '@/stores/useCourseStore'

const teacherSchema = z.object({
  firstname: z.string().min(2),
  lastname: z.string().min(2),
  email: z.string().email(),
  subjects: z.array(z.nativeEnum(SubjectNameEnum)),
  isActive: z.boolean(),
  sessions: z
    .array(
      z.object({
        id: z.string().optional(),
        dayOfWeek: z.nativeEnum(TimeSlotEnum),
        timeSlot: z.object({
          startTime: z.string(),
          endTime: z.string(),
          classroomNumber: z.number().min(1, 'La salle est requise'),
        }),
        subject: z.nativeEnum(SubjectNameEnum, {
          required_error: 'La matière est requise',
        }),
        level: z.nativeEnum(LevelEnum, {
          required_error: 'Le niveau est requis',
        }),
      }),
    )
    .min(2)
    .max(6),
})

interface EditTeacherFormProps {
  id: string
}

export interface TeacherFormData {
  firstname: string
  lastname: string
  email: string
  subjects: string[]
  isActive: boolean
  sessions: {
    id?: string
    dayOfWeek: TimeSlotEnum
    timeSlot: {
      startTime: string
      endTime: string
      classroomNumber: number | null
    }
    subject: SubjectNameEnum | null
    level: LevelEnum | null
  }[]
}

export const EditTeacherForm = ({id}: EditTeacherFormProps) => {
  const {updateCourse, isLoading: isLoadingCourse} = useCourses()
  const {fetchTeacherCourses} = useCourseStore()
  const router = useRouter()
  const {getOneTeacher, updateTeacher, isLoading: isLoadingTeacher} = useTeachers()
  const {toast} = useToast()

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true)

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      subjects: [],
      isActive: true,
      sessions: [],
    },
  })

  const formatSessions = useMemo(
    () => (sessions: any[]) => {
      return sessions.map((session) => ({
        id: session.id,
        dayOfWeek: session.timeSlot.dayOfWeek as TimeSlotEnum,
        timeSlot: {
          startTime: session.timeSlot.startTime,
          endTime: session.timeSlot.endTime,
          classroomNumber: session.timeSlot.classroomNumber,
        },
        subject: session.subject as SubjectNameEnum,
        level: session.level as LevelEnum,
      }))
    },
    [],
  )

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        setIsDataLoading(true)
        await fetchTeacherCourses(id) // Appel pour mettre à jour l'état des cours

        if (!isMounted) return

        const teacher = await getOneTeacher(id)
        const courses = useCourseStore.getState().courses // Récupération des cours depuis l'état

        const course = courses.find((course) => course.teacher.includes(id)) // Trouver le cours correspondant

        if (teacher && course && course.sessions) {
          const formattedSessions = formatSessions(course.sessions)

          form.reset({
            firstname: teacher.firstname,
            lastname: teacher.lastname,
            email: teacher.email,
            subjects: teacher.subjects,
            isActive: teacher.isActive,
            sessions: formattedSessions,
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger les données du professeur',
        })
      } finally {
        if (isMounted) {
          setIsDataLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [id, getOneTeacher, fetchTeacherCourses, form, toast, formatSessions])

  const isLoading = isLoadingTeacher || isLoadingCourse || isDataLoading

  const steps = [
    {number: 1, label: 'Informations personnelles'},
    {number: 2, label: 'Matières enseignées'},
  ]

  const validateStep1 = () => {
    return form.trigger(['firstname', 'lastname', 'email'])
  }

  // const validateStep2 = () => {
  //   return form.trigger(['sessions'])
  // }

  const validateStep2 = async () => {
    const sessions = form.getValues('sessions')
    const validationPromises = sessions.flatMap((_, index) => [
      form.trigger(`sessions.${index}.subject`),
      form.trigger(`sessions.${index}.level`),
      form.trigger(`sessions.${index}.timeSlot.classroomNumber`),
    ])

    const results = await Promise.all(validationPromises)
    return results.every((result) => result === true)
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await validateStep1()
      if (isValid) setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      const isValid = await validateStep2()
      if (isValid) {
        const validationResult = await teacherSchema.safeParseAsync(form.getValues())
        if (!validationResult.success) {
          // Affichez les erreurs
          const errors = validationResult.error.errors
          console.log('Validation errors:', errors)
          toast({
            variant: 'destructive',
            title: 'Erreur de validation',
            description: 'Veuillez remplir tous les champs requis',
          })
          return
        }
        // Si tout est valide
        await onSubmit(form.getValues())
      } else {
        // Afficher un message d'erreur si la validation échoue
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Veuillez remplir tous les champs obligatoires',
        })
      }
    }
  }

  const compareData = (original: any, current: any): boolean => {
    return JSON.stringify(original) === JSON.stringify(current)
  }

  // const compareSessions = (original: any[], current: any[]): boolean => {
  //   if (original.length !== current.length) return false

  //   // Normaliser la structure des sessions pour la comparaison
  //   const normalizeSession = (session: any) => ({
  //     dayOfWeek: session.dayOfWeek || session.timeSlot?.dayOfWeek,
  //     startTime: session.timeSlot?.startTime,
  //     endTime: session.timeSlot?.endTime,
  //     classroomNumber: session.timeSlot?.classroomNumber,
  //     subject: session.subject,
  //     level: session.level,
  //   })

  //   const sortSessions = (sessions: any[]) =>
  //     [...sessions].map(normalizeSession).sort((a, b) => {
  //       const dayCompare = (a.dayOfWeek || '').localeCompare(b.dayOfWeek || '')
  //       if (dayCompare !== 0) return dayCompare
  //       return (a.startTime || '').localeCompare(b.startTime || '')
  //     })

  //   const sortedOriginal = sortSessions(original)
  //   const sortedCurrent = sortSessions(current)

  //   return sortedOriginal.every((session, index) => compareData(session, sortedCurrent[index]))
  // }

  const onSubmit = async (values: TeacherFormData) => {
    try {
      setIsDataLoading(true)
      // let hasChanges = false

      // 1. Vérifier les changements dans les données du professeur
      const teacherData: Partial<Teacher> = {
        firstname: values.firstname,
        lastname: values.lastname,
        email: values.email,
        subjects: [SubjectNameEnum.Arabe, SubjectNameEnum.EducationCulturelle],
      }

      // Comparer avec les données originales du professeur
      const originalTeacher = form.getValues(['firstname', 'lastname', 'email'])
      const teacherChanged = !compareData(
        {
          firstname: originalTeacher[0],
          lastname: originalTeacher[1],
          email: originalTeacher[2],
        },
        teacherData,
      )

      // Si aucun changement, sortir tôt
      if (!teacherChanged) {
        toast({
          title: 'Info',
          description: 'Aucune modification des informations du professeur détectée',
        })
        setIsDataLoading(false)
        return
      }

      // 1. Mise à jour du professeur
      if (teacherChanged) {
        await updateTeacher(id, teacherData)
        // hasChanges = true
      }

      // 2. Vérifier les changements dans les sessions
      // const originalSessions = form.getValues('sessions')
      // console.log('🚀 ~ originalSessions:', originalSessions)
      // const newSessions = values.sessions.map((session) => ({
      //   id: session.id,
      //   dayOfWeek: session.dayOfWeek,
      //   timeSlot: {
      //     startTime: session.timeSlot.startTime,
      //     endTime: session.timeSlot.endTime,
      //     classroomNumber: session.timeSlot.classroomNumber || null,
      //   },
      //   subject: session.subject!,
      //   level: session.level!,
      // }))
      // console.log('🚀 ~ newSessions:', newSessions)

      // const sessionsChanged = !compareSessions(originalSessions, newSessions)

      // if (!sessionsChanged) {
      //   toast({
      //     title: 'Info',
      //     description: 'Aucune modification des sessions détectée',
      //   })
      //   setIsDataLoading(false)
      //   return
      // }

      // 2. Mise à jour du cours
      // if (sessionsChanged) {
      const courseData: Omit<any, 'students' | 'stats'> = {
        teacher: id,
        sessions: values.sessions.map(session => ({
          id: session.id,
          timeSlot: {
            dayOfWeek: session.dayOfWeek,
            startTime: session.timeSlot.startTime,
            endTime: session.timeSlot.endTime,
            classroomNumber: session.timeSlot.classroomNumber,
          },
          subject: session.subject!, // Assert que subject n'est pas null
          level: session.level!, // Assert que level n'est pas null
        })),
      }
      //todo fix courseData
      await updateCourse(id, courseData as any, false)
      // hasChanges = true
      // }

      // if (!hasChanges) {
      toast({
        title: 'Succès',
        variant: 'success',
        description: 'Les modifications ont été enregistrées',
        duration: 5000,
      })
      // }
      // form.reset()

      // setCurrentStep(1)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du professeur:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le professeur',
        duration: 5000,
      })
    } finally {
      setIsDataLoading(false)
      setTimeout(() => {
        window.location.reload()
        router.push('/admin/schedule')
      }, 100)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Modifier le Professeur</CardTitle>
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
          <form
            onSubmit={(e) => {
              // console.log('Form submitted')
              form.handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            {currentStep === 1 && <EditTeacherStep1 form={form} />}
            {currentStep === 2 && <EditTeacherStep2 form={form} />}

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
                    ? 'Enregistrer les modifications'
                    : 'Suivant'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
