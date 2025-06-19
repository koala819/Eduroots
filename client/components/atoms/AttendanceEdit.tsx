'use client'

import {
  BarChart2,
  CheckCircle,
  NotebookText,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { Button } from '@/client/components/ui/button'
import { useAttendances } from '@/client/context/attendances'
import { CourseSessionWithRelations } from '@/types/courses'
import { User } from '@/types/db'
import { GenderEnum } from '@/types/user'

import { ErrorComponent } from './ErrorComponent'

interface AttendanceEditProps {
  courseSessionId: string
  date: string
  attendanceId: string
  students: User[]
  initialData: {
    courseSession: CourseSessionWithRelations
    attendanceRecords: { [key: string]: boolean }
    attendanceId: string
  }
}

export function AttendanceEdit({
  courseSessionId,
  date,
  attendanceId,
  students,
  initialData,
}: AttendanceEditProps) {
  const router = useRouter()
  const { updateAttendanceRecord } = useAttendances()
  const [attendanceRecords, setAttendanceRecords] = useState(initialData.attendanceRecords)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  function handleTogglePresence(studentId: string) {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  async function handleSave() {
    setIsUpdating(true)
    try {
      const records = students
        .filter((student) => student && student.id)
        .map((student) => ({
          studentId: student.id,
          isPresent: attendanceRecords[student.id] ?? false,
          comment: null,
        }))

      // Mise à jour d'une attendance existante
      await updateAttendanceRecord({
        attendanceId: attendanceId,
        records: records,
      })

      onClose()
    } catch (error) {
      console.error('❌ [AttendanceEdit] Erreur sauvegarde:', error)
      setError('Erreur lors de la mise à jour des présences')
    } finally {
      setIsUpdating(false)
    }
  }

  const onClose = () => {
    // Navigation de retour vers le dashboard
    router.push(`/teacher/classroom/course/${courseSessionId}`)
  }

  if (error) {
    return <ErrorComponent message={error} />
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header avec informations du cours */}
      <div className="bg-background border border-border rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div id="attendance-edit-description" className="sr-only">
          Formulaire de modification des présences pour la session du{' '}
          {new Date(date).toLocaleDateString()}
        </div>

        {/* Grille responsive pour les détails du cours */}
        <div className="grid grid-cols-2 gap-4">
          {/* Niveau */}
          <div className="flex items-center justify-center sm:justify-start space-x-3 p-3
           bg-muted/50 rounded-lg">
            <BarChart2 className="w-5 h-5 shrink-0 text-primary" />
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground font-medium">Niveau</p>
              <p className="text-sm font-semibold text-foreground">
                {initialData.courseSession.level}
              </p>
            </div>
          </div>

          {/* Matière */}
          <div
            className="flex items-center justify-center sm:justify-start space-x-3 p-3
             bg-muted/50 rounded-lg"
          >
            <NotebookText className="w-5 h-5 shrink-0 text-primary" />
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground font-medium">Matière</p>
              <p className="text-sm font-semibold text-foreground">
                {initialData.courseSession.subject}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des étudiants */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            Liste des étudiants ({students.filter((s) => s && s.id && s.firstname).length})
          </h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-success-light" />
            <span>Présent</span>
            <XCircle className="w-4 h-4 text-error-light ml-2" />
            <span>Absent</span>
          </div>
        </div>

        <div className="grid gap-3">
          {students
            .filter((student) => student && student.id && student.firstname)
            .toSorted((a, b) => a.firstname.localeCompare(b.firstname))
            .map((student) => (
              <div
                key={student.id}
                className="group"
              >
                <div
                  className="flex items-center justify-between p-4 bg-background border
                  border-border rounded-lg shadow-sm hover:shadow-md transition-all
                  duration-200 ease-in-out cursor-pointer hover:bg-muted/30 hover:border-primary/30"
                  onClick={() => handleTogglePresence(student.id)}
                >
                  {/* Informations étudiant */}
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Icône genre */}
                    <div className="flex-shrink-0">
                      {student.gender === GenderEnum.Masculin ? (
                        <BiMale className="h-6 w-6 text-primary" />
                      ) : (
                        <BiFemale className="h-6 w-6 text-[#E84393]" />
                      )}
                    </div>

                    {/* Nom et prénom */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {student.firstname}
                        <span className="font-bold text-foreground ml-1">
                          {student.lastname}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cliquez pour changer le statut
                      </p>
                    </div>
                  </div>

                  {/* Statut de présence */}
                  <div
                    className={`flex-shrink-0 transition-all duration-300 ${
                      attendanceRecords[student.id]
                        ? 'text-success-light bg-success-light/20 border-success-light/30'
                        : 'text-error-light bg-error-light/20 border-error-light/30'
                    } p-3 rounded-full border-2`}
                  >
                    {attendanceRecords[student.id] ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div
        className="sticky p-4 -mx-4 sm:mx-0"
      >
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <Button
            variant="destructive"
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1 hover:cursor-pointer"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="w-full sm:w-auto order-1 sm:order-2 bg-primary text-primary-foreground
              hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed
              hover:cursor-pointer"
          >
            {isUpdating ? (
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 border-2 border-primary-foreground/30
                  border-t-primary-foreground rounded-full animate-spin"
                />
                <span>Mise à jour...</span>
              </div>
            ) : (
              'Mettre à jour'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
