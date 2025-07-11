'use client'

import { GradeStepper } from '@/client/components/atoms/GradesStepper'
import { GradesSession } from '@/client/components/molecules/GradesStepSession'
import { GradeInfo } from '@/client/components/molecules/GradeStepInfo'
import {
  GradeSubmission,
} from '@/client/components/organisms/GradesStepSubmission'
import { useCreateGradeForm } from '@/client/hooks/use-create-grades'
import { CourseWithRelations } from '@/types/courses'

interface CreateGradeFormProps {
  initialCourses: CourseWithRelations[]
}

export function CreateGradeForm({ initialCourses }: CreateGradeFormProps) {
  const {
    currentStep,
    teacherCourses,
    selectedSession,
    gradeType,
    gradeDate,
    gradeEntries,
    errors,
    isSubmitting,
    isValid,
    handleNextStep,
    handlePreviousStep,
    handleSelectSession,
    updateGradeFormData,
    getStudentRecord,
    onSubmit,
    setValue,
  } = useCreateGradeForm(initialCourses)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Indicateur de progression */}
        <GradeStepper currentStep={currentStep} />

        {/* Formulaire en étapes */}
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Étape 1: Informations de base */}
          {currentStep === 1 && (
            <GradeInfo
              gradeType={gradeType}
              setGradeType={(value) => setValue('gradeType', value)}
              gradeDate={gradeDate}
              setGradeDate={(value) => setValue('gradeDate', value)}
              onNextStep={handleNextStep}
              errors={errors}
            />
          )}

          {/* Étape 2: Sélection de classe */}
          {currentStep === 2 && (
            <GradesSession
              selectedSession={selectedSession}
              setSelectedSession={(value) => setValue('selectedSession', value)}
              teacherCourses={teacherCourses}
              onSessionSelect={handleSelectSession}
              onNextStep={handleNextStep}
              onPreviousStep={handlePreviousStep}
              errors={errors}
            />
          )}

          {/* Étape 3: Saisie des notes */}
          {currentStep === 3 && selectedSession && (
            <GradeSubmission
              gradeType={gradeType}
              gradeDate={gradeDate}
              selectedSession={selectedSession}
              gradeEntries={gradeEntries}
              sessionInfo={(() => {
                const session = teacherCourses?.courses_sessions
                  .find((s) => s.id === selectedSession)
                const timeslot = session?.courses_sessions_timeslot[0]
                return timeslot ? {
                  dayOfWeek: timeslot.day_of_week,
                  startTime: timeslot.start_time,
                  endTime: timeslot.end_time,
                } : undefined
              })()}
              getStudentRecord={getStudentRecord}
              updateGradeFormData={updateGradeFormData}
              onPreviousStep={handlePreviousStep}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              isValid={isValid}
            />
          )}
        </form>
      </div>
    </div>
  )
}
