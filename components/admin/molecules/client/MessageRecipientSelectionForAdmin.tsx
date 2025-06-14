'use client'

import {useEffect, useState} from 'react'
import {UseFormReturn} from 'react-hook-form'
import {FixedSizeList as List} from 'react-window'

import {Student} from '@/types/mongo/user'
import {FormFields, RecipientType, SelectionModeType} from '@/types/mongo/writeMessage'

import {CustomCheckbox} from '@/components/atoms/client/MessageCustomCheckbox'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'

import {useStudents} from '@/context/Students/client'
import {useTeachers} from '@/context/Teachers/client'
import {calculateValidEmails, isValidStudent} from '@/lib/writeMessage'

interface RecipientForAdminProps {
  selectionMode: SelectionModeType
  handleSelectionMode: (mode: SelectionModeType, students: Student[]) => void
  onValidEmailsChange: (emails: string[]) => void
  form: UseFormReturn<FormFields>
}

export const RecipientForAdmin = ({
  selectionMode,
  handleSelectionMode,
  onValidEmailsChange,
  form,
}: RecipientForAdminProps) => {
  // Hooks pour récupérer les données
  const {students, isLoading} = useStudents()
  const {getStudentsByTeacher, teachers} = useTeachers()

  // États locaux pour l'UI
  const [recipientType, setRecipientType] = useState<RecipientType>(null)
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)
  const [loadingTeacher, setLoadingTeacher] = useState<string | null>(null)
  const [teacherStudents, setTeacherStudents] = useState<
    Record<
      string,
      {
        valid: Student[]
        invalid: Student[]
      }
    >
  >({})
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [itemSize, setItemSize] = useState(50) // hauteur par défaut pour la virtualisation

  // Filtrer les enseignants valides
  const validTeachers =
    teachers?.filter((teacher) => teacher.email && teacher.email !== process.env.INVALID_EMAIL) ||
    []

  // Calculer les étudiants filtrés (pour la recherche)
  const filteredStudents = students
    ? students.filter(
        (student) =>
          isValidStudent(student) &&
          (!searchQuery ||
            `${student.firstname} ${student.lastname}`.toLowerCase().includes(searchQuery)),
      )
    : []

  const filteredInvalidStudents = students
    ? students.filter(
        (student) =>
          !isValidStudent(student) &&
          (!searchQuery ||
            `${student.firstname} ${student.lastname}`.toLowerCase().includes(searchQuery)),
      )
    : []

  // Observer pour les emails valides
  useEffect(() => {
    const subscription = form.watch((value, {name}) => {
      if (name === 'recipients') {
        const validEmails = calculateValidEmails(value.recipients as string[], [
          ...students,
          ...teachers,
        ])
        onValidEmailsChange(validEmails)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, students, teachers, onValidEmailsChange])

  // Détection de la taille de la fenêtre pour adapter la virtualisation
  useEffect(() => {
    const handleResize = () => {
      // Ajuster la taille en fonction de la largeur d'écran
      setItemSize(window.innerWidth < 640 ? 60 : 50)
    }

    // Initialiser
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Lazy loading: charger les étudiants d'un enseignant seulement lors de l'expansion
  async function fetchTeacherStudents(teacherId: string) {
    // Vérifier si on a déjà chargé les étudiants pour cet enseignant
    if (teacherStudents[teacherId]) return

    setLoadingTeacher(teacherId)
    try {
      const studentsByTeacher = await getStudentsByTeacher(teacherId)

      if (!studentsByTeacher) return

      const validStudents = studentsByTeacher.filter(isValidStudent)
      const invalidStudents = studentsByTeacher.filter((s) => !isValidStudent(s))

      setTeacherStudents((prev) => ({
        ...prev,
        [teacherId]: {valid: validStudents, invalid: invalidStudents},
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants :', error)
    } finally {
      setLoadingTeacher(null)
    }
  }

  // Handler pour l'expansion du professeur
  const handleTeacherExpand = (teacherId: string) => {
    if (expandedTeacher === teacherId) {
      // Replier si le même professeur est cliqué
      setExpandedTeacher(null)
    } else {
      // Déployer le nouveau professeur
      setExpandedTeacher(teacherId)
      fetchTeacherStudents(teacherId)
    }
  }

  // Rendu des éléments virtualisés
  const StudentItem = ({index, style}: {index: number; style: React.CSSProperties}) => {
    const student = filteredStudents[index]
    return (
      <div style={style}>
        <CustomCheckbox items={[student]} form={form} formFieldName="recipients" />
      </div>
    )
  }

  const InvalidStudentItem = ({index, style}: {index: number; style: React.CSSProperties}) => {
    const student = filteredInvalidStudents[index]
    return (
      <div
        style={style}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border-l-4 border-red-500"
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
          variant={recipientType === 'teachersForBureau' ? 'default' : 'outline'}
          className="cursor-pointer text-sm sm:text-lg"
          onClick={() => setRecipientType('teachersForBureau')}
        >
          Enseignants ({validTeachers.length})
        </Badge>

        <Badge
          variant={recipientType === 'students' ? 'default' : 'outline'}
          className="cursor-pointer text-sm sm:text-lg"
          onClick={() => setRecipientType('students')}
        >
          Élèves ({students?.length})
        </Badge>
      </div>

      {selectionMode === null && recipientType === null && (
        <div className="text-sm text-gray-600">Veuillez sélectionner un destinataire.</div>
      )}

      {/* Enseignants - Rendu conditionnel */}
      {recipientType === 'teachersForBureau' && (
        <div className="space-y-2 sm:space-y-4">
          <div className="rounded-md border p-2 sm:p-4 space-y-2">
            <div className="font-medium text-xs sm:text-sm text-gray-700 mb-2">Enseignants</div>
            <CustomCheckbox items={validTeachers} form={form} formFieldName="recipients" />
          </div>
        </div>
      )}

      {/* Élèves - Rendu conditionnel */}
      {recipientType === 'students' && (
        <>
          {/* Mode selector */}
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
              Tous les élèves ({students.length})
            </Button>
            <Button
              type="button"
              variant={selectionMode === 'byTeacher' ? 'default' : 'outline'}
              onClick={() => {
                if (students) {
                  handleSelectionMode('byTeacher', students)
                }
              }}
            >
              Par professeur
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

          {/* Par enseignant - Lazy loading */}
          {selectionMode === 'byTeacher' && (
            <div className="space-y-4">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="border p-3 rounded-md">
                  {/* En-tête enseignant */}
                  <div
                    className="cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                    onClick={() => handleTeacherExpand(teacher.id)}
                  >
                    <div className="font-medium flex justify-between items-center">
                      <span>
                        {teacher.firstname} {teacher.lastname}
                      </span>
                      <span className="text-xs">{expandedTeacher === teacher.id ? '▼' : '▶'}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {loadingTeacher === teacher.id
                        ? 'Chargement...'
                        : teacherStudents[teacher.id]
                          ? `${teacherStudents[teacher.id].valid.length} élèves`
                          : 'Cliquer pour afficher les étudiants'}
                    </div>
                  </div>

                  {/* Liste des étudiants - Rendu conditionnel */}
                  {expandedTeacher === teacher.id && teacherStudents[teacher.id] && (
                    <div className="mt-4 space-y-2">
                      {/* Étudiants valides */}
                      <CustomCheckbox
                        items={teacherStudents[teacher.id].valid}
                        form={form}
                        formFieldName="recipients"
                      />

                      {/* Étudiants avec email invalide */}
                      {teacherStudents[teacher.id].invalid.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm font-medium text-red-500">
                            ⚠️ Les élèves suivants ont un email invalide et ne peuvent pas être
                            sélectionnés :
                          </div>
                          <div className="mt-2 space-y-2">
                            {teacherStudents[teacher.id].invalid.map((student) => (
                              <div
                                key={student._id}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border-l-4 border-red-500"
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
              ))}
            </div>
          )}

          {/* Sélection manuelle avec virtualisation */}
          {selectionMode === 'specific' && (
            <div>
              {/* Champ de recherche */}
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Rechercher un élève..."
                  onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              {/* Liste des étudiants valides avec virtualisation */}
              <div className="border rounded-md">
                <List
                  height={300}
                  itemCount={filteredStudents.length}
                  itemSize={itemSize}
                  width="100%"
                >
                  {StudentItem}
                </List>
              </div>

              {/* Liste des étudiants invalides avec virtualisation */}
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
