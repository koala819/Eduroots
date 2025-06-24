'use client'

import { format } from 'date-fns'

import {
  GradesStudentList,
} from '@/app/(protected)/teacher/settings/grades/create/GradesStudentList'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { GradeEntry, GradeTypeEnum } from '@/types/grades'

interface GradeSubmissionStepProps {
  gradeType: GradeTypeEnum
  gradeDate: string
  selectedSession: string
  gradeEntries: GradeEntry[]
  sessionInfo?: {
    dayOfWeek: string
    startTime: string
    endTime: string
  }
  getStudentRecord: (studentId: string) => GradeEntry | undefined
  updateGradeFormData: (
    studentId: string,
    field: 'value' | 'isAbsent' | 'comment',
    value: string | number | boolean,
  ) => void
  onPreviousStep: () => void
  onSubmit: () => void
  isSubmitting: boolean
  isValid: boolean
}

// Fonction pour formater l'heure sans les secondes
const formatTime = (time: string) => {
  return time.substring(0, 5) // Prend seulement HH:MM
}

export function GradeSubmissionStep({
  gradeType,
  gradeDate,
  selectedSession,
  gradeEntries,
  sessionInfo,
  getStudentRecord,
  updateGradeFormData,
  onPreviousStep,
  onSubmit,
  isSubmitting,
  isValid,
}: GradeSubmissionStepProps) {
  return (
    <div className="space-y-6">
      {/* Résumé de l'évaluation */}
      <Card className="bg-background border-border">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-xl font-semibold text-foreground">
            Résumé de l'évaluation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 font-medium text-foreground">{gradeType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>
              <span className="ml-2 font-medium text-foreground">
                {format(new Date(gradeDate), 'dd/MM/yyyy')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Session:</span>
              <span className="ml-2 font-medium text-foreground">
                {sessionInfo ? (
                  <>
                    {formatDayOfWeek(sessionInfo.dayOfWeek as any)}
                    - {formatTime(sessionInfo.startTime)} à{' '}
                    {formatTime(sessionInfo.endTime)}
                  </>
                ) : (
                  'Informations non disponibles'
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des élèves */}
      <GradesStudentList
        gradeEntries={gradeEntries}
        selectedSession={selectedSession}
        getStudentRecord={getStudentRecord}
        updateGradeFormData={updateGradeFormData}
      />

      {/* Actions */}
      <div className="flex justify-between items-center pt-6">
        <Button
          type="button"
          variant="destructive"
          onClick={onPreviousStep}
          className="px-6 py-2 transition-colors"
        >
          Retour
        </Button>

        <Button
          type="submit"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary-dark
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground
                border-t-transparent rounded-full animate-spin"></div>
              Création en cours...
            </div>
          ) : (
            'Créer l\'évaluation'
          )}
        </Button>
      </div>
    </div>
  )
}
