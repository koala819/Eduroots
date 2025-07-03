'use client'

import { EditActions } from '@/client/components/atoms/GradesEditActions'
import { EditInfo } from '@/client/components/atoms/GradesEditInfo'
import { ErrorContent,LoadingContent } from '@/client/components/atoms/StatusContent'
import { EditStudentList } from '@/client/components/molecules/GradesEditStudentList'
import { useEditGradeForm } from '@/client/hooks/use-edit-grades'
import { GradeWithRelations } from '@/types/grades'

interface EditFormProps {
  gradeId: string
  initialGradeData?: GradeWithRelations
}

export function EditForm({ gradeId, initialGradeData }: EditFormProps) {
  const {
    error,
    loading,
    gradeInfo,
    gradeEntries,
    stats,
    handleGradeUpdate,
    getStudentRecord,
    onSubmit,
    getGradeTypeLabel,
    getFormattedDayOfWeek,
  } = useEditGradeForm({ gradeId, initialGradeData })

  if (!initialGradeData) {
    return <LoadingContent />
  }

  if (!gradeInfo) {
    return <ErrorContent message="Impossible de charger les données de l'évaluation" />
  }

  if (error) {
    return <ErrorContent message={error} />
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* En-tête */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            Modifier l'évaluation
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Modifiez les notes et informations de cette évaluation.
          </p>
        </section>

        <div className="space-y-6">
          {/* Informations de l'évaluation */}
          <EditInfo
            gradeInfo={gradeInfo}
            getGradeTypeLabel={getGradeTypeLabel}
            getFormattedDayOfWeek={getFormattedDayOfWeek}
          />

          {/* Liste des élèves */}
          <EditStudentList
            students={gradeEntries.students}
            getStudentRecord={getStudentRecord}
            handleGradeUpdate={handleGradeUpdate}
          />

          {/* Actions */}
          <EditActions
            stats={stats}
            studentsCount={gradeEntries.students.length}
            loading={loading}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  )
}
