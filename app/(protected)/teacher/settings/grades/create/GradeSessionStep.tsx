'use client'

import { FieldErrors } from 'react-hook-form'

import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Label } from '@/client/components/ui/label'
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

interface GradeSessionStepProps {
  selectedSession: string
  setSelectedSession: (session: string) => void
  teacherCourses: CourseWithRelations
  onSessionSelect: (sessionId: string) => void
  onNextStep: () => void
  onPreviousStep: () => void
  errors?: FieldErrors<any>
}

export function GradeSessionStep({
  selectedSession,
  setSelectedSession,
  teacherCourses,
  onSessionSelect,
  onNextStep,
  onPreviousStep,
  errors,
}: GradeSessionStepProps) {
  const isStepComplete = selectedSession

  return (
    <Card className="shadow-lg bg-background hover:border-primary transition-all duration-200">
      <CardHeader className="pb-3 border-b bg-primary/5">
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          Sélectionner la classe et matière
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="space-y-3">
          <Label htmlFor="session" className="text-foreground font-medium">
            Session de cours
          </Label>
          <Select
            value={selectedSession}
            onValueChange={(value) => {
              setSelectedSession(value)
              onSessionSelect(value)
            }}
          >
            <SelectTrigger
              className={cn(
                'w-full bg-input hover:border-primary focus:border-primary ' +
                'focus:ring-ring transition-colors',
                errors?.selectedSession && 'border-destructive focus:border-destructive',
              )}
            >
              <SelectValue placeholder="Sélectionner une session" />
            </SelectTrigger>
            <SelectContent className="bg-background max-h-60">
              {teacherCourses?.courses_sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {session.subject} - {session.level}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDayOfWeek(
                        session.courses_sessions_timeslot[0]?.day_of_week || '',
                      )} -
                      {session.courses_sessions_timeslot[0]?.start_time} à {
                        session.courses_sessions_timeslot[0]?.end_time
                      }
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.selectedSession && (
            <p className="text-sm text-destructive">
              {errors.selectedSession.message as string}
            </p>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onPreviousStep}
            className="px-6 py-2"
          >
            Retour
          </Button>
          <Button
            onClick={onNextStep}
            disabled={!isStepComplete}
            className="px-6 py-2 bg-primary text-primary-foreground
            hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200"
          >
            Continuer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
