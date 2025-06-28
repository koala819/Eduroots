import { ChevronRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { Button } from '@/client/components/ui/button'
import { TimeSlotCard } from '@/server/components/root/EditStudentTimeSlotCard'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { TIME_SLOT_SCHEDULE, TimeSlotEnum } from '@/types/courses'

interface TimeSlotSelectionStepProps {
  form: UseFormReturn<any>
  onNextStep: () => void
  isStepValid: boolean
}

export const TimeSlotSelectionStep = ({
  form,
  onNextStep,
  isStepValid,
}: TimeSlotSelectionStepProps) => {
  const selectedTimeSlot = form.watch('timeSlot')

  // Configuration des créneaux horaires (déplacée ici)
  const timeSlotConfigs = Object.entries(TIME_SLOT_SCHEDULE).map(([key, value]) => ({
    id: key as TimeSlotEnum,
    label: formatDayOfWeek(key as TimeSlotEnum),
    sessions: [
      { startTime: value.START, endTime: value.PAUSE },
      { startTime: value.PAUSE, endTime: value.FINISH },
    ],
  }))

  const handleTimeSlotChange = (timeSlot: TimeSlotEnum) => {
    form.setValue('timeSlot', timeSlot)

    // Réinitialiser les sélections pour le nouveau créneau
    const timeSlotConfig = timeSlotConfigs.find((c) => c.id === timeSlot)
    if (timeSlotConfig) {
      const newSelections = timeSlotConfig.sessions.map((session) => ({
        dayOfWeek: timeSlot,
        startTime: session.startTime,
        endTime: session.endTime,
        subject: '' as any,
        teacherId: '',
      }))
      form.setValue('selections', newSelections)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Sélectionnez un créneau</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {timeSlotConfigs.map((config) => (
          <TimeSlotCard
            key={config.id}
            config={config}
            isSelected={selectedTimeSlot === config.id}
            onSelect={handleTimeSlotChange}
          />
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onNextStep}
          disabled={!isStepValid}
          className="flex items-center gap-2"
        >
          <span>Continuer</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
