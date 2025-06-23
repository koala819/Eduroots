'use client'

import { format } from 'date-fns'
import { CalendarIcon, CheckCircle } from 'lucide-react'
import { useState } from 'react'

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
import { formatDayOfWeek } from '@/server/utils/helpers'
import { cn } from '@/server/utils/helpers'
import { CourseWithRelations } from '@/types/courses'
import { GradeTypeEnum } from '@/types/grades'

interface GradesInfoFormProps {
  gradeType: GradeTypeEnum
  setGradeType: (type: GradeTypeEnum) => void
  gradeDate: string
  setGradeDate: (date: string) => void
  selectedSession: string
  setSelectedSession: (session: string) => void
  teacherCourses: CourseWithRelations
  onSessionSelect: (sessionId: string) => void
  currentStep: number
  onNextStep: () => void
}

export function GradesInfoForm({
  gradeType,
  setGradeType,
  gradeDate,
  setGradeDate,
  selectedSession,
  setSelectedSession,
  teacherCourses,
  onSessionSelect,
  currentStep,
  onNextStep,
}: GradesInfoFormProps) {
  const [open, setOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setGradeDate(format(date, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  const isStep1Complete = gradeType && gradeDate
  const isStep2Complete = selectedSession
  const canProceed = isStep1Complete && isStep2Complete

  return (
    <div className="space-y-6">
      {/* Indicateur de progression */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            currentStep >= 1
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}>
            {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
          </div>
          <span className={cn(
            'text-sm font-medium',
            currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground',
          )}>
            Informations
          </span>
        </div>

        <div className="w-12 h-0.5 bg-muted"></div>

        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            currentStep >= 2
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}>
            {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
          </div>
          <span className={cn(
            'text-sm font-medium',
            currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground',
          )}>
            Classe
          </span>
        </div>
      </div>

      {/* Étape 1: Informations de base */}
      {currentStep === 1 && (
        <Card className="shadow-lg bg-background hover:border-primary transition-all duration-200">
          <CardHeader className="pb-3 border-b bg-primary/5">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Informations de l'évaluation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
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
                    className="w-full bg-input hover:border-primary focus:border-primary focus:ring-ring transition-colors"
                  >
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {Object.entries(GradeTypeEnum).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                        'w-full justify-start text-left font-normal bg-input ' +
                        'hover:border-primary focus:border-primary focus:ring-ring ' +
                        'transition-colors',
                        !gradeDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {gradeDate
                        ? format(new Date(gradeDate), 'dd MMMM yyyy')
                        : 'Sélectionner une date'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={gradeDate ? new Date(gradeDate) : undefined}
                      onSelect={handleDateSelect}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={onNextStep}
                disabled={!isStep1Complete}
                className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Continuer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Sélection de la classe */}
      {currentStep === 2 && (
        <Card className="shadow-lg bg-background hover:border-primary transition-all duration-200">
          <CardHeader className="pb-3 border-b bg-primary/5">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Sélectionner la classe et matière
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="space-y-3">
              <Label className="text-foreground font-medium">
                Classe et Matière
              </Label>
              <Select
                value={selectedSession}
                onValueChange={(sessionId) => {
                  const session = teacherCourses.courses_sessions.find(
                    (s) => s.id === sessionId,
                  )
                  if (session) {
                    setSelectedSession(sessionId)
                    onSessionSelect(sessionId)
                  }
                }}
              >
                <SelectTrigger className="w-full bg-input">
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent className="bg-background max-h-60">
                  {teacherCourses.courses_sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{session.subject}</span>
                        <span className="text-sm text-muted-foreground">
                          Niveau {session.level} • {
                            formatDayOfWeek(session.courses_sessions_timeslot[0].day_of_week)
                          }
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => onNextStep()}
                className="px-6 py-2"
              >
                Retour
              </Button>
              <Button
                onClick={onNextStep}
                disabled={!isStep2Complete}
                className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Commencer la saisie
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
