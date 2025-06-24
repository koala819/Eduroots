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
import { formatDayOfWeek, sortSessionsByDayOfWeek } from '@/server/utils/helpers'
import { cn } from '@/server/utils/helpers'
import { CourseWithRelations } from '@/types/courses'

interface GradeSessionProps {
  selectedSession: string
  setSelectedSession: (session: string) => void
  teacherCourses: CourseWithRelations
  onSessionSelect: (sessionId: string) => void
  onNextStep: () => void
  onPreviousStep: () => void
  errors?: FieldErrors<any>
}

// Fonction pour formater l'heure sans les secondes
const formatTime = (time: string) => {
  return time.substring(0, 5) // Prend seulement HH:MM
}

export function GradesSession({
  selectedSession,
  setSelectedSession,
  teacherCourses,
  onSessionSelect,
  onNextStep,
  onPreviousStep,
  errors,
}: GradeSessionProps) {
  const isStepComplete = selectedSession
  const sortedSessions = sortSessionsByDayOfWeek(teacherCourses?.courses_sessions || [])

  return (
    <Card className="bg-background border-border">
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="text-xl font-semibold text-foreground">
          Sélectionner la classe et matière
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
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
                'w-full bg-input border-border hover:border-primary focus:border-primary ' +
                'transition-colors h-12 px-4',
                errors?.selectedSession && 'border-error focus:border-error',
              )}
            >
              <SelectValue placeholder="Sélectionner une session" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border max-h-60">
              {sortedSessions.map((session) => (
                <SelectItem
                  key={session.id}
                  value={session.id}
                  className="py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">
                      {session.subject} - {session.level}
                    </span>
                    <span className="text-sm opacity-80">
                      {formatDayOfWeek(
                        session.courses_sessions_timeslot[0]?.day_of_week || '',
                      )} - {formatTime(
                        session.courses_sessions_timeslot[0]?.start_time || '',
                      )} à {formatTime(
                        session.courses_sessions_timeslot[0]?.end_time || '',
                      )}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.selectedSession && (
            <p className="text-sm text-error">
              {errors.selectedSession.message as string}
            </p>
          )}
        </div>

        <div className="flex justify-between pt-6">
          <Button
            variant="destructive"
            onClick={onPreviousStep}
            className="px-6 py-2 transition-colors"
          >
            Retour
          </Button>
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
