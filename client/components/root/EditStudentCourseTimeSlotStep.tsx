import { ChevronRight } from 'lucide-react'

import { Button } from '@/client/components/ui/button'
import { TimeSlotCard } from '@/server/components/root/EditStudentTimeSlotCard'
import { TimeSlotEnum } from '@/types/courses'

interface TimeSlotSelectionStepProps {
  timeSlotConfigs: Array<{
    id: TimeSlotEnum
    label: string
    sessions: Array<{ startTime: string; endTime: string }>
  }>
  selectedTimeSlot: TimeSlotEnum
  onTimeSlotChange: (timeSlot: TimeSlotEnum) => void
  onNextStep: () => void
  isStepValid: boolean
}

export const TimeSlotSelectionStep = ({
  timeSlotConfigs,
  selectedTimeSlot,
  onTimeSlotChange,
  onNextStep,
  isStepValid,
}: TimeSlotSelectionStepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Sélectionnez un créneau</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {timeSlotConfigs.map((config) => (
          <TimeSlotCard
            key={config.id}
            config={config}
            isSelected={selectedTimeSlot === config.id}
            onSelect={onTimeSlotChange}
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
