'use client'

import { format } from 'date-fns'

import {
  GradesStudentList,
} from '@/app/(protected)/teacher/settings/grades/create/GradesStudentList'
import { Button } from '@/client/components/ui/button'
import { GradeEntry, GradeTypeEnum } from '@/types/grades'

interface GradeSubmissionStepProps {
  gradeType: GradeTypeEnum
  gradeDate: string
  selectedSession: string
  gradeEntries: GradeEntry[]
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

export function GradeSubmissionStep({
  gradeType,
  gradeDate,
  selectedSession,
  gradeEntries,
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
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-foreground mb-2">
          Résumé de l'évaluation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span className="ml-2 font-medium">{gradeType}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Date:</span>
            <span className="ml-2 font-medium">
              {format(new Date(gradeDate), 'dd/MM/yyyy')}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Élèves:</span>
            <span className="ml-2 font-medium">{gradeEntries.length}</span>
          </div>
        </div>
      </div>

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
          variant="outline"
          onClick={onPreviousStep}
          className="px-6 py-2"
        >
          Retour
        </Button>

        <Button
          type="submit"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="px-8 py-3 bg-primary text-primary-foreground
            rounded-[--radius] font-medium hover:bg-primary-dark
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg hover:shadow-xl
            transform hover:scale-105"
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
