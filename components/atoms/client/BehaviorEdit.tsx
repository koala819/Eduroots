'use client'

import { BarChart2, Clock, NotebookText, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { AttendanceRecord } from '@/types/mongo/attendance'
import { PopulatedCourse } from '@/types/mongo/course'
import { GenderEnum, Student } from '@/types/mongo/user'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { useBehavior } from '@/context/Behaviors/client'
import { useCourses } from '@/context/Courses/client'
import { useStudents } from '@/context/Students/client'
import { cn } from '@/utils/helpers'
import { motion } from 'framer-motion'

interface BehaviorEditProps {
  students: AttendanceRecord[]
  onClose: () => void
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
  const { updateBehaviorRecord, isLoadingBehavior, getBehaviorById } = useBehavior()
  const { getCourseSessionById, isLoadingCourse } = useCourses()
  const { getOneStudent } = useStudents()

  const [course, setCourse] = useState<PopulatedCourse | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [studentDetails, setStudentDetails] = useState<Record<string, Student>>({})
  const [behavior, setBehavior] = useState<Record<string, number>>({})

  const presentStudents = useMemo(() => {
    return students.filter((s) => s.isPresent)
  }, [students])

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

        const studentsData: Record<string, Student> = {}
        const behaviorRatings: Record<string, number> = {}

        // Fetch details for present students only
        await Promise.all(
          presentStudents.map(async (s: AttendanceRecord) => {
            try {
              const studentId = typeof s.student === 'string' ? s.student : s.student.id

              const studentDetail = await getOneStudent(studentId)

              if (isMounted) {
                studentsData[studentId] = studentDetail

                // Si on a des données de behavior, chercher le rating existant
                if (behaviorResponse?.success && behaviorResponse.data?.records) {
                  const existingRecord = behaviorResponse.data.records.find((record: any) => {
                    const recordStudentId =
                      typeof record.student === 'string' ? record.student : record.student.id
                    return recordStudentId === studentId
                  })

                  behaviorRatings[studentId] = existingRecord?.rating ?? 5
                } else {
                  behaviorRatings[studentId] = 5 // Valeur par défaut si pas de données
                }
              }
            } catch (error) {
              console.error(`Error fetching student ${s.student}:`, error)
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
    if (!course?.sessions?.[0]?.id) {
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
        sessionId: course.sessions[0].id,
      })

      // La mise à jour a réussi, on peut fermer le modal
      onClose()
    } catch (error) {
      console.error('Error updating behavior:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  function handleCancelAction(confirmClose: boolean) {
    if (confirmClose) {
      onClose()
    }
    setIsConfirmOpen(false)
  }

  function setRating(studentId: string, rating: number) {
    setBehavior((prev) => ({
      ...prev,
      [studentId]: rating,
    }))
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
        className="bg-white p-4 rounded-lg shadow-md w-full pb-20"
      >
        <div className="space-y-6">
          <section className="container mx-auto px-4 py-6">
            <div className="flex flex-col space-y-4">
              {/* Course Details */}
              {date && course && (
                <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
                    {/* Level */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <BarChart2 className="w-5 h-5 shrink-0 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        Niveau {course.sessions[0].level}
                      </span>
                    </div>

                    {/* Subject */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <NotebookText className="w-5 h-5 shrink-0 text-gray-400" />
                      <span className="text-sm text-gray-700">{course.sessions[0].subject}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <Clock className="w-5 h-5 shrink-0 text-gray-400" />
                      <span className="text-sm text-gray-700">
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
                {presentStudents.map((student) => {
                  const studentId =
                    typeof student.student === 'string' ? student.student : student.student.id

                  const studentDetail = studentDetails[studentId]
                  if (!studentDetail) return null

                  return (
                    <motion.li
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer hover:border-blue-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        {studentDetail.gender === GenderEnum.Masculin ? (
                          <BiMale className="h-6 w-6 text-blue-400" />
                        ) : (
                          <BiFemale className="h-6 w-6 text-pink-400" />
                        )}
                        <span className="font-medium text-gray-700">
                          {studentDetail.firstname}
                          <span className="font-bold text-gray-900 ml-1">
                            {studentDetail.lastname}
                          </span>
                        </span>
                      </div>
                      <motion.div
                        className="transition-all duration-300 p-2 rounded-full"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setRating(studentId, rating)}
                            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full transition-transform active:scale-95"
                          >
                            <Star
                              key={rating}
                              className={cn(
                                'w-5 h-5 transition-colors inline-block',
                                rating <= (behavior[studentId] || 5)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300',
                              )}
                            />
                          </button>
                        ))}
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
                  variant="teacherDefault"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
                <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="teacherWarning"
                      className="border-gray-400 text-white"
                      onClick={() => setIsConfirmOpen(true)}
                    >
                      Annuler
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer l&apos;annulation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir annuler la modification ? Les changements non
                        enregistrés seront perdus.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => handleCancelAction(false)}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border-2 border-gray-400"
                      >
                        Non
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelAction(true)}
                        className="bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500"
                      >
                        Oui
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  )
}
