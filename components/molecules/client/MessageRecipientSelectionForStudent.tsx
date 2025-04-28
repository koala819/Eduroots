'use client'

import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { Session } from 'next-auth'

import { Teacher } from '@/types/user'
import { FormFields } from '@/types/writeMessage'

import { Badge } from '@/components/ui/badge'

import { useStudents } from '@/context/Students/client'
import { calculateValidEmails } from '@/lib/writeMessage'

interface RecipientForStudentProps {
  onValidEmailsChange: (emails: string[]) => void
  session: Session | null
  form: UseFormReturn<FormFields>
}

export const RecipientForStudent = ({
  onValidEmailsChange,
  session,
  form,
}: RecipientForStudentProps) => {
  // État local
  const [recipientType, setRecipientType] = useState<
    'bureau' | 'teachers' | null
  >(null)
  const [teachersList, setTeachersList] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Hooks
  const { getTeachersForStudent } = useStudents()

  // Trouver les professeurs de l'étudiant
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!session?.user?._id || recipientType !== 'teachers') return

      setIsLoading(true)
      try {
        const teachers = await getTeachersForStudent(session.user._id)
        setTeachersList(teachers)
      } catch (error) {
        console.error('Erreur lors de la récupération des professeurs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeachers()
  }, [recipientType, session, getTeachersForStudent])

  // Observer pour les emails valides
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'recipients') {
        const validEmails = calculateValidEmails(
          value.recipients as string[],
          teachersList,
        )
        onValidEmailsChange(validEmails)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, teachersList, onValidEmailsChange])

  if (isLoading) {
    return <div className="animate-pulse">Chargement ...</div>
  }

  return (
    <div className="space-y-4">
      {/* Sélection du type de destinataire */}
      <div className="flex gap-2">
        <Badge
          variant={recipientType === 'bureau' ? 'default' : 'outline'}
          className="cursor-pointer text-sm sm:text-base"
          onClick={() => {
            form.setValue('recipients', ['bureau'])
            setRecipientType('bureau')
            onValidEmailsChange(['bureau'])
          }}
        >
          Bureau
        </Badge>

        <Badge
          variant={recipientType === 'teachers' ? 'default' : 'outline'}
          className="cursor-pointer text-sm sm:text-base"
          onClick={() => setRecipientType('teachers')}
        >
          Professeur
        </Badge>
      </div>

      {recipientType === null && (
        <div className="text-sm text-gray-600">
          Veuillez sélectionner un destinataire.
        </div>
      )}

      {/* Liste des professeurs - Rendu conditionnel */}
      {recipientType === 'teachers' && (
        <div className="border rounded-md p-4 space-y-2">
          {teachersList.length > 0 ? (
            teachersList.map((teacher) => (
              <div
                key={teacher._id || teacher.id}
                className="p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                    checked={form
                      .watch('recipients')
                      ?.includes(teacher._id || teacher.id)}
                    onChange={(e) => {
                      const currentRecipients = form.watch('recipients') || []
                      const teacherId = teacher._id || teacher.id

                      if (e.target.checked) {
                        form.setValue('recipients', [
                          ...currentRecipients,
                          teacherId,
                        ])
                      } else {
                        form.setValue(
                          'recipients',
                          currentRecipients.filter((id) => id !== teacherId),
                        )
                      }
                    }}
                  />
                  <span>
                    {teacher.firstname} {teacher.lastname}
                    {(teacher.subjects as string[]).length > 0 && (
                      <span className="text-gray-500 text-sm ml-2">
                        {(teacher.subjects as string[]).join(', ')}
                      </span>
                    )}
                  </span>
                </label>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              Aucun professeur trouvé. Veuillez contacter l'administration.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
