'use client'

import { motion } from 'framer-motion'
import { BarChart2, Clock, NotebookText, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { Button } from '@/client/components/ui/button'
import { useBehavior } from '@/client/context/behaviors'
import { useCourses } from '@/client/context/courses'
import { useStudents } from '@/client/context/students'
import { cn } from '@/server/utils/helpers'
import { AttendanceRecord } from '@/types/db'
import { StudentResponse } from '@/types/student-payload'
import { GenderEnum } from '@/types/user'

interface BehaviorEditProps {
  students: (AttendanceRecord & {
    users: {
      id: string
      firstname: string
      lastname: string
      email: string
    }
  })[]
  onClose?: () => void
  date: string
  courseId: string
  behaviorId: string
}

export const BehaviorEdit: React.FC<BehaviorEditProps> = ({
  students,
  onClose,
  date,
  courseId,
  behaviorId,
}) => {
  const router = useRouter()
  const { updateBehaviorRecord, isLoadingBehavior, getBehaviorById } = useBehavior()
  const { getCourseSessionById, isLoadingCourse } = useCourses()
  const { getOneStudent } = useStudents()

  const [course, setCourse] = useState<any>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [studentDetails, setStudentDetails] = useState<Record<string, StudentResponse>>({})
  const [behavior, setBehavior] = useState<Record<string, number>>({})

  const presentStudents = useMemo(() => {
    return students.filter((s) => s.is_present)
  }, [students])

  const findExistingRecord = (records: any[], studentId: string) => {
    return records.find(
      (record) => record.student_id === studentId,
    )
  }

  useEffect(() => {
    let isMounted = true

    async function loadInitialData() {
      if (!courseId || !date) return

      try {
        // Charger le cours et le behavior existant en parallèle
        const [courseData, behaviorResponse] = await Promise.all([
          getCourseSessionById(courseId),
          getBehaviorById(courseId, date),
        ])

        if (!isMounted) return

        if (courseData) {
          setCourse(courseData)
        }

        const studentsData: Record<string, StudentResponse> = {}
        const behaviorRatings: Record<string, number> = {}

        // Fetch details for present students only
        await Promise.all(
          presentStudents.map(async (s) => {
            try {
              const studentId = s.student_id
              const studentDetail = await getOneStudent(studentId)

              if (isMounted) {
                studentsData[studentId] = studentDetail

                // Si on a des données de behavior, chercher le rating existant
                if (behaviorResponse?.success && behaviorResponse.data?.records) {
                  const existingRecord = findExistingRecord(
                    behaviorResponse.data.records,
                    studentId,
                  )
                  behaviorRatings[studentId] = existingRecord?.rating ?? 5
                } else {
                  behaviorRatings[studentId] = 5 // Valeur par défaut si pas de données
                }
              }
            } catch (error) {
              console.error(`Error fetching student ${s.student_id}:`, error)
            }
          }),
        )

        if (isMounted) {
          setStudentDetails(studentsData)
          setBehavior(behaviorRatings)
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        if (isMounted) {
          setIsInitialLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
  }, [courseId, date, getOneStudent, getBehaviorById, getCourseSessionById, presentStudents])

  async function handleSave() {
    setIsUpdating(true)
    if (!course?.id) {
      console.error('Session ID not found')
      return
    }

    try {
      const records = Object.entries(behavior).map(([studentId, rating]) => ({
        student: studentId,
        rating,
      }))

      await updateBehaviorRecord({
        courseId: courseId,
        behaviorId: behaviorId,
        records: records,
        date: date,
        sessionId: course.id,
      })

      // La mise à jour a réussi, on peut fermer le modal
      handleClose()
    } catch (error) {
      console.error('Error updating behavior:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  function handleCancelAction(confirmClose: boolean) {
    if (confirmClose) {
      handleClose()
    }
    setIsConfirmOpen(false)
  }

  function setRating(studentId: string, rating: number) {
    setBehavior((prev) => ({
      ...prev,
      [studentId]: rating,
    }))
  }

  // Fonction pour gérer la fermeture/navigation de retour
  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      // Navigation de retour vers le dashboard
      router.back()
    }
  }

  if (isLoadingBehavior || isLoadingCourse || isInitialLoading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"></div>
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"
          style={{ animationDelay: '0.2s' }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
          style={{ animationDelay: '0.4s' }}
        ></div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-background p-4 rounded-lg shadow-md w-full pb-20 border border-border"
      >
        <div className="space-y-6">
          <section className="container mx-auto px-4 py-6">
            <div className="flex flex-col space-y-4">
              {/* Course Details */}
              {date && course && (
                <div className="bg-muted rounded-lg p-4 shadow-sm border border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
                    {/* Level */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <BarChart2 className="w-5 h-5 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        Niveau {course.level}
                      </span>
                    </div>

                    {/* Subject */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <NotebookText className="w-5 h-5 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {course.subject}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <Clock className="w-5 h-5 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        Session du {new Date(date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="max-w-4xl mx-auto">
              <ul className="space-y-3">
                {presentStudents.map((student) => {
                  const studentId = student.student_id
                  const studentDetail = studentDetails[studentId]

                  if (!studentDetail) return null

                  return (
                    <motion.li
                      key={studentId}
                      className="flex items-center justify-between p-4 bg-background border
                      border-border rounded-lg shadow-sm hover:shadow-md transition-all
                      duration-200 ease-in-out cursor-pointer hover:border-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        {studentDetail.gender === GenderEnum.Masculin ? (
                          <BiMale className="h-6 w-6 text-primary" />
                        ) : (
                          <BiFemale className="h-6 w-6 text-secondary" />
                        )}
                        <span className="font-medium text-foreground">
                          {studentDetail.firstname}
                          <span className="font-bold text-foreground ml-1">
                            {studentDetail.lastname}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <motion.button
                            key={rating}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              setRating(studentId, rating)
                            }}
                            className={cn(
                              'p-1 rounded-full transition-all duration-200 hover:scale-110',
                              behavior[studentId] >= rating
                                ? 'text-yellow-400 bg-yellow-400/10'
                                : 'text-muted-foreground bg-muted hover:bg-muted/80',
                            )}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Star className="h-5 w-5" />
                          </motion.button>
                        ))}
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            </div>
          </section>

          <section className="mt-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={handleSave}
                  variant="default"
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Mise à jour en cours...' : 'Mettre à jour'}
                </Button>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={handleClose}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </section>
        </div>
      </motion.div>

      {/* Overlay de chargement pendant la mise à jour */}
      {isUpdating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg border border-border">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-ping mr-1"></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-ping mr-1"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-ping"
                style={{ animationDelay: '0.4s' }}
              ></div>
              <span className="text-foreground">Mise à jour en cours...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
