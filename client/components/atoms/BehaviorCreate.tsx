'use client'

import { BarChart2, NotebookText, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { Button } from '@/client/components/ui/button'
import { useBehavior } from '@/client/context/behaviors'
import { cn } from '@/server/utils/helpers'
import { CourseSessionWithRelations } from '@/types/courses'
import { User } from '@/types/db'
import { GenderEnum } from '@/types/user'

import { ErrorComponent } from './ErrorComponent'

interface BehaviorCreateProps {
  courseSessionId: string
  date: string
  students: User[]
  initialData: {
    courseSession: CourseSessionWithRelations
  }
}

export function BehaviorCreate({
  courseSessionId,
  date,
  students,
  initialData,
}: BehaviorCreateProps) {
  const router = useRouter()
  const { createBehaviorRecord } = useBehavior()
  const [behaviorRecords, setBehaviorRecords] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      students
        .filter((student) => student && student.id)
        .map((student) => [student.id, 5]), // Note par défaut
    ),
  )
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  function handleSetRating(studentId: string, rating: number) {
    setBehaviorRecords((prev) => ({
      ...prev,
      [studentId]: rating,
    }))
  }

  async function handleSave() {
    setIsUpdating(true)
    setError(null)

    if (!initialData.courseSession?.id) {
      const errorMsg = 'ID de session manquant'
      console.error('❌ [BehaviorCreate]', errorMsg)
      setError(errorMsg)
      return
    }

    try {
      const records = students
        .filter((student) => student && student.id)
        .map((student) => ({
          student: student.id,
          rating: behaviorRecords[student.id] ?? 5,
        }))

      await createBehaviorRecord({
        course: initialData.courseSession.id,
        date: date,
        records: records,
        sessionId: initialData.courseSession.id,
      })

      onClose()
    } catch (error) {
      const errorMsg = 'Erreur lors de l\'enregistrement du comportement'
      console.error('❌ [BehaviorCreate] Erreur enregistrement:', error)
      setError(errorMsg)
    } finally {
      setIsUpdating(false)
    }
  }

  const onClose = () => {
    // Navigation de retour vers le dashboard
    router.push(`/teacher/classroom/course/${courseSessionId}/behavior`)
  }

  if (error) {
    return <ErrorComponent message={error} />
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header avec informations du cours */}
      <section className="bg-background border border-border rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div id="behavior-create-description" className="sr-only">
          Formulaire de création des comportements pour la session du{' '}
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
            <Star className="w-4 h-4 text-yellow-400" />
            <span>Note de comportement</span>
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
                  duration-200 ease-in-out hover:bg-muted/30 hover:border-primary/30"
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
                        Cliquez sur une étoile pour noter
                      </p>
                    </div>
                  </div>

                  {/* Système de notation par étoiles */}
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleSetRating(student.id, rating)}
                        className={cn(
                          'p-1 rounded-full transition-all duration-200 hover:scale-110',
                          behaviorRecords[student.id] >= rating
                            ? 'text-yellow-400 bg-yellow-400/10'
                            : 'text-muted-foreground bg-muted hover:bg-muted/80',
                        )}
                      >
                        <Star className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
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
