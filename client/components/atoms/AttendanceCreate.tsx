'use client'

import { motion } from 'framer-motion'
import { BarChart2, CheckCircle, NotebookText, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { ErrorComponent } from '@/client/components/atoms/ErrorComponent'
import { Button } from '@/client/components/ui/button'
import { useAttendances } from '@/client/context/attendances'
import { CourseSessionWithRelations } from '@/types/courses'
import { User } from '@/types/db'
import { GenderEnum } from '@/types/user'

interface AttendanceCreateProps {
  students: User[]
  date: string
  courseId: string
  initialData: {
    courseSession: CourseSessionWithRelations
  }
}

export const AttendanceCreate: React.FC<AttendanceCreateProps> = ({
  students,
  date,
  courseId,
  initialData,
}) => {
  const router = useRouter()
  const { createAttendanceRecord } = useAttendances()
  const [error, setError] = useState<string | null>(null)
  const [attendanceData, setAttendanceData] = useState<{
    [key: string]: boolean
  }>(students.reduce((acc, student) => ({ ...acc, [student.id]: true }), {}))
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  function handleTogglePresence(studentId: string) {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  async function handleSave() {
    setIsUpdating(true)
    setError(null)

    if (!initialData.courseSession?.id) {
      const errorMsg = 'ID de session manquant'
      console.error('❌ [AttendanceCreate]', errorMsg)
      setError(errorMsg)
      return
    }

    try {
      const records = Object.entries(attendanceData).map(([studentId, isPresent]) => ({
        studentId,
        isPresent,
        comment: null,
      }))

      await createAttendanceRecord({
        courseId: initialData.courseSession.course_id,
        date: date,
        records: records,
        sessionId: initialData.courseSession.id,
      })

      // Navigation vers la page précédente après succès
      router.back()
    } catch (error) {
      const errorMsg = 'Erreur lors de l\'enregistrement de l\'attendance'
      console.error('❌ [AttendanceCreate] Erreur enregistrement:', error)
      setError(errorMsg)
    } finally {
      setIsUpdating(false)
    }
  }

  const onClose = () => {
    // Navigation de retour vers le dashboard
    router.push(`/teacher/classroom/course/${courseId}`)
  }

  if (error) {
    return <ErrorComponent message={error} />
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header avec informations du cours */}
      <section className="bg-background border border-border rounded-lg shadow-sm p-4 sm:p-6 mb-6">
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
      </section>

      {/* Liste des étudiants */}
      <section className="space-y-3 mb-8">
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
                  <motion.div
                    className={`transition-all duration-300 ${
                      attendanceData[student.id]
                        ? 'text-success bg-success/10'
                        : 'text-error bg-error/10'
                    } p-2 rounded-full`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {attendanceData[student.id] ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                  </motion.div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Actions */}
      <section
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
                <span>Enregistrement...</span>
              </div>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </div>
      </section>
    </div>
  )
}
