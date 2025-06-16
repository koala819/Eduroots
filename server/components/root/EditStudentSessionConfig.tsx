import { Clock } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { SubjectNameEnum } from '@/types/courses'

import { Card } from '@/client/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import {
  Select,
  SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/client/components/ui/select'
import { TeacherResponse } from '@/types/teacher-payload'

interface SessionSelection {
  subject: SubjectNameEnum
  teacherId: string
}

interface SessionFormData {
  selections: SessionSelection[]
}

interface SessionConfigProps {
  startTime: string
  endTime: string
  form: UseFormReturn<SessionFormData>
  availableTeachers: TeacherResponse[]
  index: number
  onSubjectSelect: (index: number) => void
  onTeacherSelect: (
    startTime: string,
    endTime: string,
    subject: SubjectNameEnum,
    teacherId: string,
    index: number,
  ) => void
}

export const SessionConfig = ({
  startTime,
  endTime,
  form,
  availableTeachers,
  index,
  onSubjectSelect,
  onTeacherSelect,
}: SessionConfigProps) => {
  const selections = form.watch('selections')
  const currentSelection = selections?.[index]

  return (
    <Card className="p-3 md:p-4">
      <div className="flex items-center text-xs md:text-sm font-medium text-gray-900 mb-3 md:mb-4">
        <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 text-primary" />
        {`${startTime} - ${endTime}`}
      </div>

      <div className="space-y-3 md:space-y-4">
        <FormField
          control={form.control}
          name={`selections.${index}.subject`}
          render={({ field }) => (
            <FormItem className="space-y-1.5 md:space-y-2">
              <FormLabel className="text-sm md:text-base">Matière</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value: SubjectNameEnum) => {
                    field.onChange(value)
                    onSubjectSelect(index)
                  }}
                  value={field.value}
                >
                  <SelectTrigger className="text-xs md:text-sm">
                    <SelectValue placeholder="Sélectionner une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SubjectNameEnum).map((subject) => (
                      <SelectItem key={subject} value={subject} className="text-xs md:text-sm">
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage className="text-xs md:text-sm" />
            </FormItem>
          )}
        />

        {currentSelection?.subject && (
          <FormField
            control={form.control}
            name={`selections.${index}.teacherId`}
            render={({ field }) => (
              <FormItem className="space-y-1.5 md:space-y-2">
                <FormLabel className="text-sm md:text-base">Professeur</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      onTeacherSelect(startTime, endTime, currentSelection.subject, value, index)
                    }}
                    value={field.value}
                    disabled={availableTeachers.length === 0}
                  >
                    <SelectTrigger className="text-xs md:text-sm">
                      <SelectValue placeholder="Sélectionner un professeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem
                          key={teacher.id}
                          value={teacher.id}
                          className="text-xs md:text-sm"
                        >
                          {teacher.firstname} {teacher.lastname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-xs md:text-sm" />
              </FormItem>
            )}
          />
        )}
      </div>
    </Card>
  )
}
