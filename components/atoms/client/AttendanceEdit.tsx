'use client'

import {
  BarChart2,
  CheckCircle,
  Clock,
  NotebookText,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { BiFemale, BiMale } from 'react-icons/bi'
import { User } from '@/types/supabase/db'
import { GenderEnum } from '@/types/supabase/user'
import { Button } from '@/components/ui/button'
import { useAttendance } from '@/context/Attendances/client'
import { useCourses } from '@/context/Courses/client'
import { motion } from 'framer-motion'
import { getCourseSessionById } from '@/app/actions/context/courses'
import { CourseSessionWithRelations } from '@/types/supabase/courses'

interface AttendanceEditProps {
  students: User[];
  onClose: () => void;
  date: string;
  courseSessionId: string;
  attendanceId: string;
}

export const AttendanceEdit: React.FC<AttendanceEditProps> = ({
  students,
  onClose,
  date,
  courseSessionId,
  attendanceId,
}) => {
  const { updateAttendanceRecord, isLoadingAttendance, getAttendanceById } =
    useAttendance()
  const { isLoadingCourse } = useCourses()

  const [course, setCourse] = useState<CourseSessionWithRelations | null>(null)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<{
    [key: string]: boolean;
  }>({})

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🔄 [AttendanceEdit] Chargement des données...')
        const response = await getCourseSessionById(courseSessionId)
        if (!response.success || !response.data) {
          setError('Session non trouvée')
          return
        }
        const courseId = response.data.courses.id
        setCourse(response.data)

        const attendance = await getAttendanceById(attendanceId)
        console.log('📊 [AttendanceEdit] Données reçues:', attendance)

        if (attendance?.data?.records) {
          const recordsMap = attendance.data.records.reduce(
            (
              acc: { [x: string]: any },
              record: { student_id: string; is_present: boolean },
            ) => {
              acc[record.student_id] = record.is_present
              return acc
            },
            {} as { [key: string]: boolean },
          )
          console.log('✅ [AttendanceEdit] Records mappés:', recordsMap)
          setAttendanceRecords(recordsMap)
        } else {
          const initialRecords = students.reduce(
            (acc, student) => ({
              ...acc,
              [student.id]: false,
            }),
            {} as { [key: string]: boolean },
          )
          console.log('⚠️ [AttendanceEdit] Aucune donnée trouvée, initialisation avec:', initialRecords)
          setAttendanceRecords(initialRecords)
        }
      } catch (err) {
        console.error('❌ [AttendanceEdit] Erreur chargement:', err)
        setError('Erreur lors du chargement des données')
      }
    }
    fetchData()
  }, [courseSessionId, getAttendanceById, attendanceId, students])

  function handleTogglePresence(studentId: string) {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  async function handleSave() {
    setIsUpdating(true)
    try {
      console.log('🔄 [AttendanceEdit] Sauvegarde des données...')
      const records = students.map((student) => ({
        student: student.id,
        isPresent: attendanceRecords[student.id] ?? false,
      }))
      console.log('📝 [AttendanceEdit] Records à sauvegarder:', records)

      await updateAttendanceRecord({
        attendanceId: attendanceId,
        date: date,
        records: records,
      })

      console.log('✅ [AttendanceEdit] Données sauvegardées')
      onClose()
    } catch (error) {
      console.error('❌ [AttendanceEdit] Erreur sauvegarde:', error)
      setError('Erreur lors de la mise à jour des présences')
    } finally {
      setIsUpdating(false)
    }
  }

  if (error) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (isLoadingAttendance || isLoadingCourse) {
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
        className="bg-white/10 p-4 rounded-lg shadow-md w-full pb-20"
        aria-describedby="attendance-edit-description"
      >
        <div id="attendance-edit-description" className="sr-only">
          Formulaire de modification des présences pour la session du{' '}
          {new Date(date).toLocaleDateString()}
        </div>
        <div className="space-y-6">
          <section className="container mx-auto px-4 py-6">
            <div className="flex flex-col space-y-4">
              {/* Course Details */}
              {date && course && (
                <div className="bg-white/10 rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
                    {/* Level */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <BarChart2 className="w-5 h-5 shrink-0 text-white" />
                      <span className="text-sm text-white">
                        Niveau {course.level}
                      </span>
                    </div>

                    {/* Subject */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <NotebookText className="w-5 h-5 shrink-0 text-white" />
                      <span className="text-sm text-white">
                        {course.subject}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <Clock className="w-5 h-5 shrink-0 text-white" />
                      <span className="text-sm text-white">
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
                        className="flex items-center justify-between p-4 bg-white/10 border
                        border-white/20 rounded-lg shadow-sm hover:shadow-md transition-all
                        duration-200 ease-in-out cursor-pointer hover:bg-white/20"
                        onClick={() => handleTogglePresence(student.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          {student.gender === GenderEnum.Masculin ? (
                            <BiMale className="h-6 w-6 text-white" />
                          ) : (
                            <BiFemale className="h-6 w-6 text-[#E84393]" />
                          )}
                          <span className="font-medium text-white">
                            {student.firstname}
                            <span className="font-bold text-white ml-1">
                              {student.lastname}
                            </span>
                          </span>
                        </div>
                        <motion.div
                          className={`transition-all duration-300 ${
                            attendanceRecords[student.id]
                              ? 'text-green-400 bg-green-900/30'
                              : 'text-red-400 bg-red-900/30'
                          } p-2 rounded-full`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {attendanceRecords[student.id] ? (
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
                  variant="teacherWarning"
                  className="bg-red-500 text-white hover:bg-red-600"
                  onClick={() => onClose()}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  variant="teacherDefault"
                  className="bg-white text-[#375073] hover:bg-white/90"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  )
}
