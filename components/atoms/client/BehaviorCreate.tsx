'use client'

import {BarChart2, Clock, NotebookText, Star} from 'lucide-react'
import {useEffect, useState} from 'react'
import {BiFemale, BiMale} from 'react-icons/bi'

import {AttendanceRecord} from '@/types/mongo/attendance'
import {PopulatedCourse} from '@/types/mongo/course'
import {GenderEnum, Student} from '@/types/mongo/user'

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
import {Button} from '@/components/ui/button'

import {useBehavior} from '@/context/Behaviors/client'
import {useCourses} from '@/context/Courses/client'
import {useStudents} from '@/context/Students/client'
import {cn} from '@/utils/helpers'
import {motion} from 'framer-motion'

interface BehaviorCreateProps {
  students: AttendanceRecord[]
  onClose: () => void
  date: string
  courseId: string
}

export const BehaviorCreate: React.FC<BehaviorCreateProps> = ({
  students,
  onClose,
  date,
  courseId,
}) => {
  const {createBehaviorRecord} = useBehavior()
  const {getCourseSessionById} = useCourses()
  const {getOneStudent} = useStudents()

  const [course, setCourse] = useState<PopulatedCourse | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [studentDetails, setStudentDetails] = useState<Record<string, Student>>({})
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)

  const [behavior, setBehavior] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      students
        .filter((record) => record.isPresent)
        .map((record) => [
          typeof record.student === 'string' ? record.student : record.student.id,
          5,
        ]),
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
              .filter((s) => s.isPresent)
              .map(async (s) => {
                const studentId = typeof s.student === 'string' ? s.student : s.student.id
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

  const handleSave = async () => {
    if (!course?.sessions?.[0]?.id) {
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
        sessionId: course.sessions[0].id,
      })

      onClose()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du comportement:", error)
    } finally {
      setIsRecording(false)
    }
  }

  const handleCancelAction = (confirmClose: boolean) => {
    if (confirmClose) {
      onClose()
    }
    setIsConfirmOpen(false)
  }

  const setRating = (studentId: string, rating: number) => {
    setBehavior((prev) => ({
      ...prev,
      [studentId]: rating,
    }))
  }

  if (isInitialLoading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"></div>
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"
          style={{animationDelay: '0.2s'}}
        ></div>
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
          style={{animationDelay: '0.4s'}}
        ></div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto">
      <motion.div
        initial={{opacity: 0, height: 0}}
        animate={{opacity: 1, height: 'auto'}}
        exit={{opacity: 0, height: 0}}
        transition={{duration: 0.3}}
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
                {students
                  .filter((record) => record.isPresent)
                  .map((student) => {
                    // console.log('🚀 ~ student:', student)
                    const studentId =
                      typeof student.student === 'string' ? student.student : student.student.id
                    const studentDetail = studentDetails[studentId]

                    if (!studentDetail) return null

                    return (
                      <motion.li
                        key={studentId}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer hover:border-blue-200"
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
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
                          className={'transition-all duration-300 p-2 rounded-full'}
                          whileHover={{scale: 1.1}}
                          whileTap={{scale: 0.9}}
                        >
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setRating(studentId, rating)}
                              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full transition-transform active:scale-95"
                            >
                              <Star
                                className={cn(
                                  'w-5 h-5 transition-colors',
                                  rating <= behavior[studentId]
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
                  disabled={isRecording}
                >
                  {isRecording ? 'Enregistrement en cours...' : 'Enregistrer'}
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
                        Êtes-vous sûr de vouloir annuler la saisie de l&apos;appel ? Les données non
                        enregistrées seront perdues.
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
