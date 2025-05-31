'use client'

import {useEffect, useMemo, useState} from 'react'
import {UseFormReturn} from 'react-hook-form'
import {FixedSizeList as List} from 'react-window'

import {Session} from 'next-auth'

import {TimeSlotEnum} from '@/types/course'
import {StudentDocument} from '@/types/mongoose'
import {FormFields, SelectionModeType} from '@/types/writeMessage'

import {CustomCheckbox} from '@/components/atoms/client/MessageCustomCheckbox'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Input} from '@/components/ui/input'

import {useTeachers} from '@/context/Teachers/client'
import {formatDayOfWeek} from '@/lib/utils'
import {calculateValidEmails, isValidStudent} from '@/lib/writeMessage'
import useCourseStore from '@/stores/useCourseStore'

interface RecipientForTeacherProps {
  selectionMode: SelectionModeType
  handleSelectionMode: (mode: SelectionModeType, students: StudentDocument[]) => void
  onValidEmailsChange: (emails: string[]) => void
  session: Session | null
  form: UseFormReturn<FormFields>
}

export const RecipientForTeacher = ({
  selectionMode,
  handleSelectionMode,
  onValidEmailsChange,
  form,
  session,
}: RecipientForTeacherProps) => {
  const {courses} = useCourseStore()
  const {fetchTeacherCourses} = useCourseStore()
  const {students, getStudentsByTeacher, isLoading} = useTeachers()

  // État local
  const [recipientType, setRecipientType] = useState<'bureau' | 'students' | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [itemSize, setItemSize] = useState(50) // hauteur par défaut pour la virtualisation

  // Charger les données uniquement lorsque nécessaire
  useEffect(() => {
    if (session?.user?.role === 'teacher') {
      fetchTeacherCourses(session.user._id)
      getStudentsByTeacher(session.user._id)
    }
  }, [session, getStudentsByTeacher, fetchTeacherCourses])

  // Observer les changements de formulaire pour calculer les emails valides
  useEffect(() => {
    const subscription = form.watch((value, {name}) => {
      if (name === 'recipients') {
        const validEmails = calculateValidEmails(value.recipients as string[], students)
        onValidEmailsChange(validEmails)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, students, onValidEmailsChange])

  // Détecter la taille de la fenêtre pour adapter la virtualisation
  useEffect(() => {
    const handleResize = () => {
      setItemSize(window.innerWidth < 640 ? 60 : 50)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mémoiser les listes filtrées pour éviter des recalculs inutiles
  const validStudents = useMemo(() => students?.filter(isValidStudent) || [], [students])

  const invalidStudents = useMemo(
    () => students?.filter((student) => !isValidStudent(student)) || [],
    [students],
  )

  const filteredValidStudents = useMemo(
    () =>
      validStudents.filter(
        (student) =>
          !searchQuery ||
          `${student.firstname} ${student.lastname}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
    [validStudents, searchQuery],
  )

  const filteredInvalidStudents = useMemo(
    () =>
      invalidStudents.filter(
        (student) =>
          !searchQuery ||
          `${student.firstname} ${student.lastname}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
    [invalidStudents, searchQuery],
  )

  // Gérer la sélection d'une session
  const handleTeacherSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId === selectedSession ? null : sessionId)
    const course = courses.find((c) => c.sessions.some((s) => s.id === sessionId))
    const session = course?.sessions.find((s) => s.id === sessionId)
    if (session) {
      // Ne sélectionner que les étudiants avec des emails valides
      form.setValue(
        'recipients',
        session.students.filter(isValidStudent).map((s) => s._id),
      )
    }
  }

  // Composants pour la liste virtualisée
  const StudentItem = ({index, style}: {index: number; style: React.CSSProperties}) => {
    const student = filteredValidStudents[index]
    const isChecked = form.watch('recipients')?.includes((student._id as any).toString())

    return (
      <div style={style} className="px-4 py-2">
        <label
          className={`flex items-center space-x-3 cursor-pointer ${
            isChecked ? 'text-green-600' : 'text-gray-800'
          }`}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => {
              const currentRecipients = form.watch('recipients') || []
              if (checked) {
                form.setValue('recipients', [...currentRecipients, (student._id as any).toString()])
              } else {
                form.setValue(
                  'recipients',
                  currentRecipients.filter((id) => id !== (student._id as any).toString()),
                )
              }
            }}
            className="data-[state=checked]:bg-green-500"
          />
          <span className="text-sm font-medium">
            {student.firstname} {student.lastname}
          </span>
        </label>
      </div>
    )
  }

  const InvalidStudentItem = ({index, style}: {index: number; style: React.CSSProperties}) => {
    const student = filteredInvalidStudents[index]
    return (
      <div
        style={style}
        className="flex items-center gap-2 p-2 bg-gray-50 border-l-4 border-red-500"
      >
        <span className="line-through text-red-500">
          {student.firstname} {student.lastname}
        </span>
      </div>
    )
  }

  if (isLoading || (students && students?.length === undefined)) {
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
          variant={recipientType === 'students' ? 'default' : 'outline'}
          className="cursor-pointer text-sm sm:text-base"
          onClick={() => setRecipientType('students')}
        >
          Élèves ({students?.length})
        </Badge>
      </div>

      {recipientType === null && (
        <div className="text-sm text-gray-600">Veuillez sélectionner un destinataire.</div>
      )}

      {/* Modes de sélection - Rendu conditionnel */}
      {recipientType === 'students' && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Button
              type="button"
              variant={selectionMode === 'all' ? 'default' : 'outline'}
              onClick={() => {
                if (students) {
                  handleSelectionMode('all', students)
                }
              }}
            >
              Tous les élèves ({students && students.length})
            </Button>
            <Button
              type="button"
              variant={selectionMode === 'bySession' ? 'default' : 'outline'}
              onClick={() => {
                if (students) {
                  handleSelectionMode('bySession', students)
                }
              }}
            >
              Par session
            </Button>
            <Button
              type="button"
              variant={selectionMode === 'specific' ? 'default' : 'outline'}
              onClick={() => {
                if (students) {
                  handleSelectionMode('specific', students)
                }
              }}
            >
              Sélection manuelle
            </Button>
          </div>

          {/* Sélection par session - Lazy loading */}
          {selectionMode === 'bySession' && courses && (
            <div className="space-y-2">
              {courses.flatMap((course) =>
                course.sessions.map((session) => (
                  <div key={session.id} className="transition duration-200">
                    <div
                      className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                        selectedSession === session.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleTeacherSessionSelect(session.id)}
                    >
                      <div className="font-medium flex justify-between items-center">
                        <span>
                          {formatDayOfWeek(session.timeSlot.dayOfWeek as TimeSlotEnum)} -{' '}
                          {session.timeSlot.startTime} à {session.timeSlot.endTime}
                        </span>
                        <span className="text-xs">
                          {selectedSession === session.id ? '▼' : '▶'}
                        </span>
                      </div>
                      <div className="text-gray-500 text-sm">
                        {session.subject} - Niveau {session.level} -{' '}
                        <span className="font-medium">
                          {session.students.filter(isValidStudent).length} élèves valides
                        </span>
                        {session.students.some((s) => !isValidStudent(s)) && (
                          <span className="text-red-500 ml-2">
                            ({session.students.filter((s) => !isValidStudent(s)).length} invalides)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Affichage des élèves d'une session - Rendu conditionnel */}
                    {selectedSession === session.id && (
                      <div className="mt-2 pl-4 border-l">
                        {/* Étudiants valides */}
                        {session.students.filter(isValidStudent).length > 0 ? (
                          <CustomCheckbox
                            items={session.students.filter(isValidStudent)}
                            form={form}
                            formFieldName="recipients"
                          />
                        ) : (
                          <div className="text-sm text-gray-500 py-2">
                            Aucun élève avec email valide dans cette session.
                          </div>
                        )}

                        {/* Étudiants invalides */}
                        {session.students.some((student) => !isValidStudent(student)) && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-red-500">
                              ⚠️ Les élèves suivants ont un email invalide et ne peuvent pas être
                              sélectionnés :
                            </div>
                            <div className="mt-2 space-y-2">
                              {session.students
                                .filter((student) => !isValidStudent(student))
                                .map((student) => (
                                  <div
                                    key={student._id}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-l-4 border-red-500"
                                  >
                                    <span className="line-through text-red-500">
                                      {student.firstname} {student.lastname}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )),
              )}
            </div>
          )}

          {/* Sélection manuelle avec virtualisation */}
          {selectionMode === 'specific' && students && (
            <div className="border p-4 rounded">
              {/* Champ de recherche */}
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Rechercher un élève..."
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              {/* Étudiants valides avec virtualisation */}
              {filteredValidStudents.length > 0 ? (
                <div className="border rounded-md">
                  <List
                    height={300}
                    itemCount={filteredValidStudents.length}
                    itemSize={itemSize}
                    width="100%"
                  >
                    {StudentItem}
                  </List>
                </div>
              ) : (
                <div className="text-center p-4 text-gray-500">
                  {searchQuery
                    ? 'Aucun élève ne correspond à votre recherche.'
                    : 'Aucun élève avec email valide.'}
                </div>
              )}

              {/* Étudiants invalides avec virtualisation */}
              {filteredInvalidStudents.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-red-500">
                    ⚠️ Les élèves suivants ont un email invalide et ne peuvent pas être sélectionnés
                    :
                  </div>
                  <div className="border rounded-md mt-2">
                    <List
                      height={150}
                      itemCount={filteredInvalidStudents.length}
                      itemSize={itemSize}
                      width="100%"
                    >
                      {InvalidStudentItem}
                    </List>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
