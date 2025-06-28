import { ChevronRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { Button } from '@/client/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import { SubjectNameEnum, TIME_SLOT_SCHEDULE, TimeSlotEnum } from '@/types/courses'

interface SubjectSelectionStepProps {
  form: UseFormReturn<any>
  onPreviousStep: () => void
  onNextStep: () => void
  isStepValid: boolean
}

export const SubjectSelectionStep = ({
  form,
  onPreviousStep,
  onNextStep,
  isStepValid,
}: SubjectSelectionStepProps) => {
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

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Sélection des matières</h2>
      <div className="space-y-4">
        {timeSlotConfigs
          .find((c) => c.id === selectedTimeSlot)
          ?.sessions.map((session, index) => (
            <div key={`${selectedTimeSlot}_${index}`} className="p-4 border rounded-lg">
              <div className="flex items-center text-sm font-medium text-gray-900 mb-3">
                <span className="mr-2">⏰</span>
                {`${session.startTime} - ${session.endTime}`}
              </div>

              <FormField
                control={form.control}
                name={`selections.${index}.subject`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matière</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value: SubjectNameEnum) => {
                          field.onChange(value)
                          // Réinitialiser le professeur quand la matière change
                          form.setValue(`selections.${index}.teacherId`, '')
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une matière" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SubjectNameEnum).map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
