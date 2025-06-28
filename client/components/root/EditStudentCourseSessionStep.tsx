import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { SessionConfig } from '@/client/components/root/EditStudentSessionConfig'
import { Button } from '@/client/components/ui/button'
import { LoadingSpinner } from '@/client/components/ui/loading-spinner'
import { useToast } from '@/client/hooks/use-toast'
import { getAvailableTeachersForConstraints } from '@/server/actions/api/teachers'
import { SubjectNameEnum, TIME_SLOT_SCHEDULE, TimeSlotEnum } from '@/types/courses'
import { TeacherResponse } from '@/types/teacher-payload'

interface SessionConfigurationStepProps {
  form: UseFormReturn<any>
  onPreviousStep: () => void
  onSubmit: (data: any) => Promise<void>
  isStepValid: boolean
  isSubmitting: boolean
  studentId: string
}

export const SessionConfigurationStep = ({
  form,
  onPreviousStep,
  onSubmit,
  isStepValid,
  isSubmitting,
  studentId,
}: SessionConfigurationStepProps) => {
  const { toast } = useToast()
  const router = useRouter()
  const [availableTeachers, setAvailableTeachers] = useState<TeacherResponse[]>([])
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false)

  const selectedTimeSlot = form.watch('timeSlot')

  // Configuration des créneaux horaires
  const timeSlotConfigs = Object.entries(TIME_SLOT_SCHEDULE).map(([key, value]) => ({
    id: key as TimeSlotEnum,
    label: key,
    sessions: [
      { startTime: value.START, endTime: value.PAUSE },
      { startTime: value.PAUSE, endTime: value.FINISH },
    ],
  }))

  const fetchTeachers = async (
    subject: SubjectNameEnum,
    timeSlot: TimeSlotEnum,
    startTime: string,
    endTime: string,
  ) => {
    if (!subject || !timeSlot || !startTime || !endTime) return

    setIsLoadingTeachers(true)
    try {
      const result = await getAvailableTeachersForConstraints(subject, timeSlot, startTime, endTime)

      if (result.success) {
        setAvailableTeachers(result.data || [])
        if (result.data?.length === 0) {
          toast({
            title: 'Aucun professeur disponible',
            description: `Aucun professeur disponible pour ${subject} sur ce créneau`,
            duration: 3000,
          })
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message,
          duration: 5000,
        })
        setAvailableTeachers([])
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des professeurs:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la récupération des professeurs',
        duration: 5000,
      })
      setAvailableTeachers([])
    } finally {
      setIsLoadingTeachers(false)
    }
  }

  const handleSubmit = async (data: any) => {
    await onSubmit(data)
  }

  if (isLoadingTeachers) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Configuration des sessions</h2>
      <div className="space-y-4">
        {timeSlotConfigs
          .find((c) => c.id === selectedTimeSlot)
          ?.sessions.map((session, index) => (
            <SessionConfig
              key={`${selectedTimeSlot}_${index}`}
              startTime={session.startTime}
              endTime={session.endTime}
              form={form}
              availableTeachers={availableTeachers}
              index={index}
              timeSlot={selectedTimeSlot}
              onFetchTeachers={fetchTeachers}
            />
          ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onPreviousStep}
        >
          Retour
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="destructive"
            onClick={() => router.push(`/admin/root/student/edit/${studentId}`)}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isStepValid}
            onClick={form.handleSubmit(handleSubmit)}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="w-4 h-4" />
                <span>Sauvegarde en cours...</span>
              </>
            ) : (
              <>
                <span>Sauvegarder</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
