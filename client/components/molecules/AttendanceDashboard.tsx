'use client'

import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

import { AttendanceCreate } from '@/client/components/atoms/AttendanceCreate'
import { AttendanceEdit } from '@/client/components/atoms/AttendanceEdit'
import { AttendanceTable } from '@/client/components/atoms/AttendanceTable'
import { EmptyContent, ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { Card, CardContent } from '@/client/components/ui/card'
import { Sheet, SheetContent, SheetTitle } from '@/client/components/ui/sheet'
import { useAttendances } from '@/client/context/attendances'
import { useCourses } from '@/client/context/courses'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { User } from '@/types/db'

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
  const { allAttendance, fetchAttendances, error: attendanceError } = useAttendances()

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
          console.error('❌ [AttendanceDashboard] Erreur chargement session:', response.message)
          return
        }

        const courseId = response.data.courses.id
        setCourseId(courseId)

        await fetchAttendances({ courseId })
      } catch (err) {
        console.error('❌ [AttendanceDashboard] Erreur chargement:', err)
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

    // Attendre que le modal soit complètement fermé
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Recharger les données
    if (courseId) {
      try {
        await fetchAttendances({ courseId })
      } catch (error) {
        console.error('❌ [AttendanceDashboard] Erreur rechargement:', error)
      }
    }
  }

  // Ajouter un log pour voir quand le composant reçoit de nouvelles données
  useEffect(() => {
  }, [allAttendance])

  if (isLoadingCourses || isLoadingAttendance) {
    return <LoadingContent />
  }

  if (attendanceError || errorCourses) {
    return <ErrorContent message={attendanceError ?? errorCourses ?? 'Une erreur est survenue'} />
  }

  if (!allAttendance || allAttendance.length === 0) {
    return <EmptyContent />
  }

  return (
    <>
      <Card className="w-full border-primary/60 border-2 rounded-sm">
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
              <SheetTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-center
               sm:text-left text-primary">
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
            <SheetContent
              side="right"
              className="w-full sm:max-w-xl [&>button]:hidden
                bg-primary"
            >
              <SheetTitle
                className="text-lg sm:text-xl font-semibold mb-6 sm:mb-8
                  text-center sm:text-left text-primary-foreground
                  border-b border-primary-foreground/20 pb-4"
              >
                Modifier la Feuille des Présences
              </SheetTitle>
              {selectedAttendanceId && selectedDate && (
                <AttendanceEdit
                  courseSessionId={courseSessionId}
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
