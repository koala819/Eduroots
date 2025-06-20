'use client'

import { motion } from 'framer-motion'
import { BarChart2, Clock, NotebookText, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BiFemale, BiMale } from 'react-icons/bi'

import LoadingOverlay from '@/client/components/atoms/LoadingOverlay'
import { Button } from '@/client/components/ui/button'
import { useBehavior } from '@/client/context/behaviors'
import { useCourses } from '@/client/context/courses'
import { useStudents } from '@/client/context/students'
import { cn } from '@/server/utils/helpers'
import { AttendanceRecord } from '@/types/db'
import { StudentResponse } from '@/types/student-payload'
import { GenderEnum } from '@/types/user'

interface BehaviorCreateProps {
  students: AttendanceRecord[]
  onClose?: () => void
  date: string
  courseId: string
}

export const BehaviorCreate: React.FC<BehaviorCreateProps> = ({
  students,
  onClose,
  date,
  courseId,
}) => {
  const router = useRouter()
  const { createBehaviorRecord } = useBehavior()
  const { getCourseSessionById } = useCourses()
  const { getOneStudent } = useStudents()

  const [course, setCourse] = useState<any>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [studentDetails, setStudentDetails] = useState<Record<string, StudentResponse>>({})
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)

  const [behavior, setBehavior] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      students
        .filter((record) => record.is_present)
        .map((record) => [record.student_id, 5]),
    ),
  )

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        setIsInitialLoading(true)
        const [courseData, studentsData] = await Promise.all([
          getCourseSessionById(courseId),
          Promise.all(
            students
              .filter((s) => s.is_present)
              .map(async (s) => {
                const studentId = s.student_id
                const studentDetail = await getOneStudent(studentId)
                return [studentId, studentDetail]
              }),
          ),
        ])

        if (isMounted) {
          setCourse(courseData)
          setStudentDetails(Object.fromEntries(studentsData))
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        if (isMounted) {
          setIsInitialLoading(false)
        }
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [courseId, students, getCourseSessionById, getOneStudent])

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }

  const handleSave = async () => {
    if (!course?.id) {
      console.error('Session ID not found')
      return
    }

    setIsRecording(true)
    try {
      const records = Object.entries(behavior).map(([studentId, rating]) => ({
        student: studentId,
        rating,
      }))

      await createBehaviorRecord({
        course: courseId,
        date: date,
        records: records,
        sessionId: course.id,
      })

      handleClose()
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du comportement:', error)
    } finally {
      setIsRecording(false)
    }
  }

  function handleCancel() {
    // Navigation vers la page précédente
    router.back()
  }

  const setRating = (studentId: string, rating: number) => {
    setBehavior((prev) => ({
      ...prev,
      [studentId]: rating,
    }))
  }

  if (isInitialLoading) {
    return <LoadingOverlay title="Chargement du cours..." />
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
                {students
                  .filter((record) => record.is_present)
                  .map((student) => {
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
                  disabled={isRecording}
                >
                  {isRecording ? 'Enregistrement en cours...' : 'Enregistrer'}
                </Button>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={handleCancel}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </section>
        </div>
      </motion.div>

      {/* Overlay de chargement pendant l'enregistrement */}
      {isRecording && (
        <LoadingOverlay title="Enregistrement en cours..." />
      )}
    </div>
  )
}
