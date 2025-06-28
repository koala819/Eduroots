import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { Button } from '@/client/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import { LoadingSpinner } from '@/client/components/ui/loading-spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import { useToast } from '@/client/hooks/use-toast'
import { getAvailableTeachersForConstraints } from '@/server/actions/api/teachers'
import { SubjectNameEnum, TIME_SLOT_SCHEDULE, TimeSlotEnum } from '@/types/courses'
import { TeacherResponse } from '@/types/teacher-payload'

interface TeacherSelectionStepProps {
  form: UseFormReturn<any>
  onPreviousStep: () => void
  onSubmit: (data: any) => Promise<void>
  isStepValid: boolean
  isSubmitting: boolean
  studentId: string
}

export const TeacherSelectionStep = ({
  form,
  onPreviousStep,
  onSubmit,
  isStepValid,
  isSubmitting,
  studentId,
}: TeacherSelectionStepProps) => {
  const { toast } = useToast()
  const router = useRouter()
  const [availableTeachers, setAvailableTeachers] = useState<TeacherResponse[]>([])
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false)

  const selectedTimeSlot = form.watch('timeSlot')
  const selections = form.watch('selections')

  // Configuration des créneaux horaires
  const timeSlotConfigs = Object.entries(TIME_SLOT_SCHEDULE).map(([key, value]) => ({
    id: key as TimeSlotEnum,
    label: key,
    sessions: [
      { startTime: value.START, endTime: value.PAUSE },
      { startTime: value.PAUSE, endTime: value.FINISH },
    ],
  }))

  // Fonction pour récupérer les professeurs disponibles pour une session spécifique
  const fetchTeachersForSession = async (
    subject: SubjectNameEnum,
    timeSlot: TimeSlotEnum,
    startTime: string,
    endTime: string,
  ) => {
    if (!subject || !timeSlot || !startTime || !endTime) return []

    setIsLoadingTeachers(true)
    try {
      const result = await getAvailableTeachersForConstraints(subject, timeSlot, startTime, endTime)

      if (result.success) {
        return result.data || []
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message,
          duration: 5000,
        })
        return []
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des professeurs:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la récupération des professeurs',
        duration: 5000,
      })
      return []
    } finally {
      setIsLoadingTeachers(false)
    }
  }

  const handleSubmit = async (data: any) => {
    await onSubmit(data)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Sélection des professeurs</h2>
      <div className="space-y-4">
        {timeSlotConfigs
          .find((c) => c.id === selectedTimeSlot)
          ?.sessions.map((session, index) => {
            const selection = selections[index]
            const [sessionTeachers, setSessionTeachers] = useState<TeacherResponse[]>([])

            // Charger les professeurs quand la matière change
            const loadTeachers = async () => {
              if (selection?.subject) {
                const teachers = await fetchTeachersForSession(
                  selection.subject,
                  selectedTimeSlot,
                  session.startTime,
                  session.endTime,
                )
                setSessionTeachers(teachers)
              }
            }

            // Charger les professeurs au montage et quand la matière change
            useState(() => {
              loadTeachers()
            })

            return (
              <div key={`${selectedTimeSlot}_${index}`} className="p-4 border rounded-lg">
                <div className="flex items-center text-sm font-medium text-gray-900 mb-3">
                  <span className="mr-2">⏰</span>
                  {`${session.startTime} - ${session.endTime}`}
                  {selection?.subject && (
                    <span className="ml-2 text-primary">
                      - {selection.subject}
                    </span>
                  )}
                </div>

                {selection?.subject ? (
                  <FormField
                    control={form.control}
                    name={`selections.${index}.teacherId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professeur</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={sessionTeachers.length === 0 || isLoadingTeachers}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                isLoadingTeachers
                                  ? 'Chargement...'
                                  : sessionTeachers.length === 0
                                    ? 'Aucun professeur disponible'
                                    : 'Sélectionner un professeur'
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {sessionTeachers.map((teacher) => (
                                <SelectItem
                                  key={teacher.id}
                                  value={teacher.id}
                                >
                                  {teacher.firstname} {teacher.lastname}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    Veuillez d'abord sélectionner une matière
                  </p>
                )}
              </div>
            )
          })}
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
