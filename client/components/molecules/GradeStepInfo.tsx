'use client'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { FieldErrors } from 'react-hook-form'

import { Button } from '@/client/components/ui/button'
import { Calendar } from '@/client/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Label } from '@/client/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/client/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import { cn } from '@/server/utils/helpers'
import { GradeTypeEnum } from '@/types/grades'

interface GradeInfoProps {
  gradeType: GradeTypeEnum
  setGradeType: (type: GradeTypeEnum) => void
  gradeDate: string
  setGradeDate: (date: string) => void
  onNextStep: () => void
  errors?: FieldErrors<any>
}

export function GradeInfo({
  gradeType,
  setGradeType,
  gradeDate,
  setGradeDate,
  onNextStep,
  errors,
}: GradeInfoProps) {
  const [open, setOpen] = useState<boolean>(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setGradeDate(format(date, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  const isStepComplete = gradeType && gradeDate

  return (
    <Card className="bg-background border-border">
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="text-xl font-semibold text-foreground">
          Informations de l'évaluation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="type" className="text-foreground font-medium">
              Type d'évaluation
            </Label>
            <Select
              value={gradeType}
              onValueChange={(value) =>
                setGradeType(value as GradeTypeEnum)
              }
            >
              <SelectTrigger
                className={cn(
                  'w-full bg-input border-border hover:border-primary focus:border-primary ' +
                  'transition-colors',
                  errors?.gradeType && 'border-error focus:border-error',
                )}
              >
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {Object.entries(GradeTypeEnum).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.gradeType && (
              <p className="text-sm text-error">
                {errors.gradeType.message as string}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="grade-date" className="text-foreground font-medium">
              Date
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal bg-input border-border ' +
                    'hover:border-primary focus:border-primary transition-colors',
                    !gradeDate && 'text-muted-foreground',
                    errors?.gradeDate && 'border-error focus:border-error',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {gradeDate
                    ? format(new Date(gradeDate), 'dd MMMM yyyy')
                    : 'Sélectionner une date'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                <Calendar
                  mode="single"
                  selected={gradeDate ? new Date(gradeDate) : undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors?.gradeDate && (
              <p className="text-sm text-error">
                {errors.gradeDate.message as string}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={onNextStep}
            disabled={!isStepComplete}
            className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary-dark
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continuer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
