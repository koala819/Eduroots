'use client'

import { motion } from 'framer-motion'
import { BarChart2, CheckCircle, Clock, NotebookText, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { ErrorComponent } from '@/client/components/atoms/ErrorComponent'
import LoadingOverlay from '@/client/components/atoms/LoadingOverlay'
import { Button } from '@/client/components/ui/button'
import { useAttendances } from '@/client/context/attendances'
import { useCourses } from '@/client/context/courses'
import { CourseSessionWithRelations } from '@/types/courses'
import { User } from '@/types/db'
import { GenderEnum } from '@/types/user'

interface AttendanceCreateProps {
  students: User[]
  date: string
  courseId: string
}

export const AttendanceCreate: React.FC<AttendanceCreateProps> = ({
  students,
  date,
  courseId,
}) => {
  const router = useRouter()
  const { createAttendanceRecord } = useAttendances()
  const { getCourseSessionById, isLoadingCourse } = useCourses()
  const [course, setCourse] = useState<CourseSessionWithRelations | null>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [attendanceData, setAttendanceData] = useState<{
    [key: string]: boolean
  }>(students.reduce((acc, student) => ({ ...acc, [student.id]: true }), {}))

  useEffect(() => {
    async function fetchCourse() {
      try {
        console.log('🔄 [AttendanceCreate] Chargement du cours:', courseId)
        const courseData = await getCourseSessionById(courseId)

        if (!courseData) {
          const errorMsg = 'Cours non trouvé'
          console.error('❌ [AttendanceCreate] Erreur chargement cours:', errorMsg)
          setError(errorMsg)
          return
        }

        console.log('✅ [AttendanceCreate] Cours chargé:', courseData)

        // Le courseId passé est en fait l'ID de la session, pas du cours
        // On doit trouver la session correspondante dans le cours
        const session = courseData.courses_sessions.find((s: any) => s.id === courseId)

        if (!session) {
          const errorMsg = 'Session non trouvée dans le cours'
          console.error('❌ [AttendanceCreate] Erreur:', errorMsg)
          setError(errorMsg)
          return
        }

        // On s'assure que la session a toutes les propriétés requises
        const courseSession: CourseSessionWithRelations = {
          ...session,
          courses_sessions_students: session.courses_sessions_students,
          courses_sessions_timeslot: session.courses_sessions_timeslot,
        }
        setCourse(courseSession)
      } catch (error) {
        const errorMsg = 'Erreur lors de la récupération du cours'
        console.error('❌ [AttendanceCreate] Erreur:', error)
        setError(errorMsg)
      }
    }
    fetchCourse()
  }, [courseId, getCourseSessionById])

  function handleTogglePresence(studentId: string) {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  async function handleSave() {
    if (!course?.id) {
      const errorMsg = 'ID de session manquant'
      console.error('❌ [AttendanceCreate]', errorMsg)
      setError(errorMsg)
      return
    }

    setIsRecording(true)
    setError(null)

    try {
      console.log('🔄 [AttendanceCreate] Enregistrement des présences:', {
        courseId,
        date,
        sessionId: course.id,
        recordsCount: Object.keys(attendanceData).length,
      })

      const records = Object.entries(attendanceData).map(([studentId, isPresent]) => ({
        studentId,
        isPresent,
        comment: null,
      }))

      await createAttendanceRecord({
        courseId: courseId,
        date: date,
        records: records,
        sessionId: course.id,
      })

      console.log('✅ [AttendanceCreate] Présences enregistrées avec succès')

      // Navigation vers la page précédente après succès
      router.back()
    } catch (error) {
      const errorMsg = 'Erreur lors de l\'enregistrement de l\'attendance'
      console.error('❌ [AttendanceCreate] Erreur enregistrement:', error)
      setError(errorMsg)
    } finally {
      setIsRecording(false)
    }
  }

  function handleCancel() {
    // Navigation vers la page précédente
    router.back()
  }

  if (isLoadingCourse) {
    return <LoadingOverlay title="Chargement du cours..." />
  }

  if (error) {
    return <ErrorComponent message={error} />
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
                      <span className="text-sm text-foreground">{course.subject}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <Clock className="w-5 h-5 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {new Date(date).toLocaleDateString()}
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
                  .toSorted((a, b) => a.firstname.localeCompare(b.firstname))
                  .map((student) => {
                    return (
                      <motion.li
                        key={student.id}
                        className="flex items-center justify-between p-4 bg-background border
                        border-border rounded-lg shadow-sm hover:shadow-md transition-all
                        duration-200 ease-in-out cursor-pointer hover:border-primary"
                        onClick={() => handleTogglePresence(student.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          {student.gender === GenderEnum.Masculin ? (
                            <BiMale className="h-6 w-6 text-primary" />
                          ) : (
                            <BiFemale className="h-6 w-6 text-secondary" />
                          )}
                          <span className="font-medium text-foreground">
                            {student.firstname}
                            <span className="font-bold text-foreground ml-1">
                              {student.lastname}
                            </span>
                          </span>
                        </div>
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
