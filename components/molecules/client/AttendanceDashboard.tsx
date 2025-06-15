'use client'

import { useEffect, useState } from 'react'
import { AttendanceCreate } from '@/components/atoms/client/AttendanceCreate'
import { AttendanceEdit } from '@/components/atoms/client/AttendanceEdit'
import { AttendanceTable } from '@/components/atoms/client/AttendanceTable'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useAttendance } from '@/context/Attendances/client'
import { useCourses } from '@/context/Courses/client'
import { AnimatePresence } from 'framer-motion'
import { EmptyContent, ErrorContent, LoadingContent } from '@/components/atoms/client/StatusContent'
import { User } from '@/types/supabase/db'
import { getCourseSessionById } from '@/app/actions/context/courses'

export const AttendanceDashboard = ({
  courseSessionId,
  students,
  courseDates,
}: {
  courseSessionId: string
  students: User[]
  courseDates: Date[]
  }) => {

  const { isLoading: isLoadingCourses, error: errorCourses } = useCourses()
  const [courseId, setCourseId] = useState<string | null>(null)
  const { allAttendance, fetchAttendances, error } = useAttendance()

  const [isCreatingAttendance, setIsCreatingAttendance] = useState<boolean>(false)
  const [isEditingAttendance, setIsEditingAttendance] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string>('')
  const [isLoadingAttendance, setIsLoadingAttendance] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getCourseSessionById(courseSessionId)
        if (!response.success || !response.data) {
          console.error('Error loading course session:', response.message)
          return
        }

        const courseId = response.data.courses.id
        setCourseId(courseId)

        await fetchAttendances({ courseId })
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoadingAttendance(false)
      }
    }

    loadData()
  }, [courseSessionId, fetchAttendances])


  function handleCreateAttendance(date: string) {
    setSelectedDate(date)
    setIsCreatingAttendance(true)
  }

  function handleEditAttendance(attendanceId: string, date: string) {
    console.log('attendanceId handleEditAttendance', attendanceId)
    console.log('date handleEditAttendance', date)
    setSelectedAttendanceId(attendanceId)
    setSelectedDate(date)
    setIsEditingAttendance(true)
  }

  async function handleCloseCreate() {
    setIsCreatingAttendance(false)
    // Attendre un peu que le modal soit fermé
    await new Promise((resolve) => setTimeout(resolve, 100))
    // Recharger les données sans recharger toute la page
    if (courseId) {
      await fetchAttendances({ courseId })
    }
  }

  async function handleCloseEdit() {
    setIsEditingAttendance(false)
    // Recharger les données sans recharger toute la page
    if (courseId) {
      await fetchAttendances({ courseId })
    }
  }

  if (isLoadingCourses || isLoadingAttendance) {
    return <LoadingContent />
  }

  if (error || errorCourses) {
    return <ErrorContent message={error ?? errorCourses ?? 'Une erreur est survenue'} />
  }

  if (!allAttendance) {
    return <EmptyContent />
  }

  return (
    <>
      <Card className="w-full border-[#375073]/60 border-2 rounded-sm">
        <CardContent className="p-2 sm:p-6">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <AttendanceTable
              courseDates={courseDates}
              allAttendance={allAttendance}
              handleCreateAttendance={handleCreateAttendance}
              handleEditAttendance={handleEditAttendance}
            />
          </div>
        </CardContent>
      </Card>
      <AnimatePresence>
        {isCreatingAttendance && (
          <Sheet open={isCreatingAttendance} onOpenChange={setIsCreatingAttendance}>
            <SheetContent side="right" className="w-full sm:max-w-xl [&>button]:hidden">
              <SheetTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-center sm:text-left text-[#375073]">
                Nouvelle Feuille des Présences
              </SheetTitle>
              {selectedDate && (
                <AttendanceCreate
                  courseId={courseId!}
                  students={students}
                  onClose={handleCloseCreate}
                  date={selectedDate}
                />
              )}
            </SheetContent>
          </Sheet>
        )}
        {isEditingAttendance && (
          <Sheet open={isEditingAttendance} onOpenChange={setIsEditingAttendance}>
            <SheetContent side="right" className="w-full sm:max-w-xl [&>button]:hidden">
              <SheetTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-center sm:text-left text-[#375073]">
                Modifier la Feuille des Présences
              </SheetTitle>
              {selectedAttendanceId && selectedDate && (
                <AttendanceEdit
                  courseId={courseId!}
                  onClose={handleCloseEdit}
                  date={selectedDate}
                  students={students}
                  attendanceId={selectedAttendanceId}
                />
              )}
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  )
}
