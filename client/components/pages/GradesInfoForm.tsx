'use client'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
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
}: GradesInfoFormProps) {
  const [open, setOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setGradeDate(format(date, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  return (
    <Card className="shadow-lg bg-background
      hover:border-primary transition-all duration-200">
      <CardHeader className="pb-3 border-b
        bg-primary/5">
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          Informations de l&apos;évaluation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Ligne 1: Type et Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="type" className="text-foreground font-medium">
              Type d&apos;évaluation
            </Label>
            <Select
              value={gradeType}
              onValueChange={(value) =>
                setGradeType(value as GradeTypeEnum)
              }
            >
              <SelectTrigger className="w-full bg-input
                hover:border-primary focus:border-primary
                focus:ring-ring transition-colors">
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {Object.entries(GradeTypeEnum).map(([key, value]) => (
                  <SelectItem
                    key={key}
                    value={value}
                  >
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
                    'hover:border-primary focus:border-primary focus:ring-ring transition-colors',
                    !gradeDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {gradeDate ? format(new Date(gradeDate), 'dd MMMM yyyy') :
                    'Sélectionner une date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-background"
                align="start"
              >
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

        {/* Ligne 2: Session */}
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
                <SelectItem
                  key={session.id}
                  value={session.id}
                >
                  <div className="flex flex-col">
                    <span>{session.subject}</span>
                    <span>
                      Niveau {session.level} •
                      {formatDayOfWeek(session.courses_sessions_timeslot[0].day_of_week)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
