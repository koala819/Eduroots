'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import StepOne from '@/client/components/admin/atoms/TeacherCreateStep1'
import StepTwo from '@/client/components/admin/molecules/TeacherCreateStep2'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Form } from '@/client/components/ui/form'
import { useToast } from '@/client/hooks/use-toast'
import { createCourse, updateCourse } from '@/server/actions/api/courses'
import { createTeacher, updateTeacher } from '@/server/actions/api/teachers'
import { CreateCoursePayload, UpdateCoursePayload } from '@/types/course-payload'
import { LevelEnum, SubjectNameEnum, TIME_SLOT_SCHEDULE, TimeSlotEnum } from '@/types/courses'
import { CreateTeacherPayload, UpdateTeacherPayload } from '@/types/teacher-payload'
import { UserRoleEnum } from '@/types/user'

const teacherSchema = z.object({
  firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  sessions: z
    .array(
      z.object({
        id: z.string().optional(), // Pour l'édition
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
    .min(1, 'Au moins 1 session est requise')
    .max(6, 'Maximum 6 sessions autorisées'),
})

export type TeacherFormData = z.infer<typeof teacherSchema>

interface TeacherFormProps {
  mode: 'create' | 'edit'
  initialData?: {
    teacher: any
    courses: any[]
  }
}

const TeacherForm = ({ mode, initialData }: TeacherFormProps) => {
  const { toast } = useToast()
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState<number>(1)

  const form = useForm<TeacherFormData>({
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

  // Charger les données initiales en mode édition
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const { teacher, courses } = initialData

      // Convertir les cours en sessions pour le formulaire
      const sessions = convertCoursesToSessions(courses)

      form.reset({
        firstname: teacher.firstname,
        lastname: teacher.lastname,
        email: teacher.email,
        sessions,
      })
    }
  }, [mode, initialData, form])

  // Fonction pour convertir les cours en format sessions du formulaire
  const convertCoursesToSessions = (courses: any[]) => {
    const allTimeslots: any[] = []

    // 1. Collecter tous les créneaux avec leurs infos de session
    courses.forEach((course) => {

      course.courses_sessions?.forEach((session: any) => {

        session.courses_sessions_timeslot?.forEach((timeslot: any) => {

          allTimeslots.push({
            sessionId: session.id,
            dayOfWeek: timeslot.day_of_week,
            startTime: timeslot.start_time,
            endTime: timeslot.end_time,
            classroomNumber: timeslot.classroom_number
              ? parseInt(timeslot.classroom_number)
              : null,
            subject: session.subject,
            level: session.level,
          })
        })
      })
    })

    // 2. Grouper par jour/subject/level et détecter les doubles heures
    const groupedSessions = new Map<string, any[]>()

    allTimeslots.forEach((timeslot) => {
      const key = `${timeslot.dayOfWeek}-${timeslot.subject}-${timeslot.level}`
      if (!groupedSessions.has(key)) {
        groupedSessions.set(key, [])
      }
      groupedSessions.get(key)!.push(timeslot)
    })

    const sessions: any[] = []

    // 3. Reconstruire les sessions en détectant les doubles heures
    groupedSessions.forEach((timeslots) => {
      if (timeslots.length === 1) {
        // Session simple
        const t = timeslots[0]
        const normalizeTime = (time: string) => time.substring(0, 5) // "09:00:00" -> "09:00"

        sessions.push({
          id: t.sessionId,
          dayOfWeek: t.dayOfWeek,
          timeSlot: {
            startTime: normalizeTime(t.startTime),
            endTime: normalizeTime(t.endTime),
            classroomNumber: t.classroomNumber,
          },
          subject: t.subject,
          level: t.level,
        })
      } else if (timeslots.length === 2) {
        // Potentielle double heure - vérifier si c'est consécutif
        const sorted = timeslots.sort((a, b) => a.startTime.localeCompare(b.startTime))
        const schedule = TIME_SLOT_SCHEDULE[sorted[0].dayOfWeek as keyof typeof TIME_SLOT_SCHEDULE]

        // Normaliser les heures pour la comparaison (enlever les secondes)
        const normalizeTime = (time: string) => time.substring(0, 5) // "09:00:00" -> "09:00"

        const isDoubleHour =
          normalizeTime(sorted[0].startTime) === schedule.START &&
          normalizeTime(sorted[0].endTime) === schedule.PAUSE &&
          normalizeTime(sorted[1].startTime) === schedule.PAUSE &&
          normalizeTime(sorted[1].endTime) === schedule.FINISH

        if (isDoubleHour) {
          // Reconstruire comme double heure
          sessions.push({
            id: sorted[0].sessionId, // Utiliser l'ID de la première session
            dayOfWeek: sorted[0].dayOfWeek,
            timeSlot: {
              startTime: normalizeTime(sorted[0].startTime),
              endTime: normalizeTime(sorted[1].endTime),
              classroomNumber: sorted[0].classroomNumber,
            },
            subject: sorted[0].subject,
            level: sorted[0].level,
          })
        } else {
          // Sessions séparées non consécutives
          sorted.forEach((t) => {
            sessions.push({
              id: t.sessionId,
              dayOfWeek: t.dayOfWeek,
              timeSlot: {
                startTime: normalizeTime(t.startTime),
                endTime: normalizeTime(t.endTime),
                classroomNumber: t.classroomNumber,
              },
              subject: t.subject,
              level: t.level,
            })
          })
        }
      } else {
        // Plus de 2 sessions - traiter individuellement
        const normalizeTime = (time: string) => time.substring(0, 5) // "09:00:00" -> "09:00"

        timeslots.forEach((t) => {
          sessions.push({
            id: t.sessionId,
            dayOfWeek: t.dayOfWeek,
            timeSlot: {
              startTime: normalizeTime(t.startTime),
              endTime: normalizeTime(t.endTime),
              classroomNumber: t.classroomNumber,
            },
            subject: t.subject,
            level: t.level,
          })
        })
      }
    })

    return sessions
  }

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

  const onSubmit = async (values: TeacherFormData) => {
    startTransition(async () => {
      try {
        if (mode === 'create') {
          await handleCreate(values)
        } else {
          await handleUpdate(values)
        }
      } catch (error: any) {
        console.error(`Erreur lors de ${mode === 'create'
          ? 'la création' : 'la mise à jour'}:`, error)
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Une erreur est survenue',
        })
      }
    })
  }

  const handleCreate = async (values: TeacherFormData) => {

    // Valider que toutes les sessions ont subject et level
    const invalidSessions = values.sessions.filter(
      (session) => !session.subject || !session.level,
    )

    if (invalidSessions.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Erreur',
        description: 'Toutes les sessions doivent avoir une matière et un niveau.',
      })
      console.error('❌ [CREATE_TEACHER] Sessions invalides:', invalidSessions)
      return
    }

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
      console.error('❌ [CREATE_TEACHER] Échec création professeur:', teacherResult)
      return
    }

    const courseData: CreateCoursePayload = {
      is_active: true,
      academic_year: 2024,
      deleted_at: null,
      teacherIds: [teacherResult.data.id],
      sessions: values.sessions.flatMap((session) => {
        const schedule = TIME_SLOT_SCHEDULE[session.dayOfWeek]
        const isDoubleHour =
          session.timeSlot.startTime === schedule.START &&
          session.timeSlot.endTime === schedule.FINISH

        if (isDoubleHour) {
          // Double heure : créer 2 sessions (1ère + 2ème heure)
          return [
            {
              subject: session.subject as SubjectNameEnum,
              level: session.level as LevelEnum,
              timeSlots: [{
                day_of_week: session.dayOfWeek,
                start_time: schedule.START,
                end_time: schedule.PAUSE,
                classroom_number: session.timeSlot.classroomNumber?.toString() || null,
              }],
            },
            {
              subject: session.subject as SubjectNameEnum,
              level: session.level as LevelEnum,
              timeSlots: [{
                day_of_week: session.dayOfWeek,
                start_time: schedule.PAUSE,
                end_time: schedule.FINISH,
                classroom_number: session.timeSlot.classroomNumber?.toString() || null,
              }],
            },
          ]
        } else {
          // Heure simple : créer 1 session
          return [{
            subject: session.subject as SubjectNameEnum,
            level: session.level as LevelEnum,
            timeSlots: [{
              day_of_week: session.dayOfWeek,
              start_time: session.timeSlot.startTime,
              end_time: session.timeSlot.endTime,
              classroom_number: session.timeSlot.classroomNumber?.toString() || null,
            }],
          }]
        }
      }),
    }

    const courseResult = await createCourse(courseData)

    if (!courseResult.success) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          courseResult.message || 'Une erreur est survenue lors de la création du cours',
      })
      console.error('❌ [CREATE_COURSE] Échec création cours:', courseResult)
      return
    }

    toast({
      variant: 'default',
      title: 'Succès',
      description: 'Professeur et cours créés avec succès !',
    })

    form.reset()
    setCurrentStep(1)
    router.push(`/admin/members/teacher/edit/${teacherResult.data.id}`)
  }

  const handleUpdate = async (values: TeacherFormData) => {
    if (!initialData?.teacher?.id) return

    // Mettre à jour le professeur
    const teacherData: UpdateTeacherPayload = {
      firstname: values.firstname,
      lastname: values.lastname,
      email: values.email,
      subjects: [SubjectNameEnum.Arabe, SubjectNameEnum.EducationCulturelle],
    }

    const teacherResult = await updateTeacher(initialData.teacher.id, teacherData)

    if (!teacherResult.success) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          teacherResult.message || 'Une erreur est survenue lors de la mise à jour du professeur',
      })
      return
    }

    // Mettre à jour les cours/sessions
    if (initialData.courses.length > 0) {

      const courseData: UpdateCoursePayload = {
        sessions: values.sessions.map((session) => ({
          id: session.id || '', // ID de la session existante
          subject: session.subject as string,
          level: session.level as string,
          timeSlot: {
            day_of_week: session.dayOfWeek,
            start_time: session.timeSlot.startTime,
            end_time: session.timeSlot.endTime,
            classroom_number: session.timeSlot.classroomNumber?.toString() || null,
          },
        })),
      }

      const courseResult = await updateCourse(courseData)

      if (!courseResult.success) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description:
            courseResult.message || 'Une erreur est survenue lors de la mise à jour du cours',
        })
        return
      }
    }

    // Succès
    toast({
      variant: 'default',
      title: 'Succès',
      description: 'Professeur et cours mis à jour avec succès !',
    })

    router.push('/admin/members')
  }

  const title = mode === 'create' ? 'Nouveau Professeur' : 'Modifier Professeur'
  const submitText = mode === 'create' ? 'Valider l\'inscription' : 'Sauvegarder les modifications'

  return (
    <Card
      className="w-full max-w-2xl mx-auto shadow-lg rounded-lg bg-background border border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-xl md:text-2xl text-primary font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Stepper */}
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

            {/* Navigation buttons */}
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
                    ? submitText
                    : 'Suivant'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default TeacherForm
