'use client'

import {BarChart2, CheckCircle, Clock, NotebookText, XCircle} from 'lucide-react'
import {useEffect, useState} from 'react'
import {BiFemale, BiMale} from 'react-icons/bi'

import {PopulatedCourse} from '@/types/mongo/course'
import {GenderEnum, Student} from '@/types/mongo/user'

import {Button} from '@/components/ui/button'

import {useAttendance} from '@/context/Attendances/client'
import {useCourses} from '@/context/Courses/client'
import {motion} from 'framer-motion'

interface AttendanceCreateProps {
  students: Student[]
  onClose: () => void
  date: string
  courseId: string
}

export const AttendanceCreate: React.FC<AttendanceCreateProps> = ({
  students,
  onClose,
  date,
  courseId,
}) => {
  const {createAttendanceRecord} = useAttendance()
  const {getCourseSessionById, isLoadingCourse} = useCourses()
  const [course, setCourse] = useState<PopulatedCourse | null>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [attendanceData, setAttendanceData] = useState<{
    [key: string]: boolean
  }>(students.reduce((acc, student) => ({...acc, [student._id]: true}), {}))

  useEffect(() => {
    async function fecthCourse() {
      const course = await getCourseSessionById(courseId)
      setCourse(course)
    }
    fecthCourse()
  }, [courseId, getCourseSessionById])

  function handleTogglePresence(studentId: string) {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  async function handleSave() {
    setIsRecording(true)
    try {
      const records = Object.entries(attendanceData).map(([studentId, isPresent]) => ({
        student: studentId,
        isPresent,
      }))
      await createAttendanceRecord({
        courseId: courseId,
        date: date,
        records: records,
        sessionId: course?.sessions?.[0]?.id || '',
      })
      onClose()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'attendance:", error)
    } finally {
      setIsRecording(false)
    }
  }

  function handleCancelAction(confirmClose: boolean) {
    if (confirmClose) {
      onClose()
    }
  }

  if (isLoadingCourse) {
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
                  .toSorted((a, b) => a.firstname.localeCompare(b.firstname))
                  .map((student) => {
                    return (
                      <motion.li
                        key={student._id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer hover:border-blue-200"
                        onClick={() => handleTogglePresence(student._id)}
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                      >
                        <div className="flex items-center space-x-3">
                          {student.gender === GenderEnum.Masculin ? (
                            <BiMale className="h-6 w-6 text-blue-400" />
                          ) : (
                            <BiFemale className="h-6 w-6 text-pink-400" />
                          )}
                          <span className="font-medium text-gray-700">
                            {student.firstname}
                            <span className="font-bold text-gray-900 ml-1">{student.lastname}</span>
                          </span>
                        </div>
                        <motion.div
                          className={`transition-all duration-300 ${
                            attendanceData[student._id]
                              ? 'text-green-500 bg-green-50'
                              : 'text-red-500 bg-red-50'
                          } p-2 rounded-full`}
                          whileHover={{scale: 1.1}}
                          whileTap={{scale: 0.9}}
                        >
                          {attendanceData[student._id] ? (
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
                  variant="teacherDefault"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={isRecording}
                >
                  {isRecording ? 'Enregistrement en cours...' : 'Enregistrer'}
                </Button>
                <Button
                  variant="teacherWarning"
                  className="border-gray-400 text-white"
                  onClick={() => handleCancelAction(true)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  )
}
