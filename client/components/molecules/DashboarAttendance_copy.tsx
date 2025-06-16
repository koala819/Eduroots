'use client'

import { useEffect, useState } from 'react'
import { AttendanceCreate } from '@/client//components/atoms/AttendanceCreate'
import { AttendanceEdit } from '@/client//components/atoms/AttendanceEdit'
import { AttendanceTable } from '@/client//components/atoms/AttendanceTable'
import { Card, CardContent } from '@/client/components/ui/card'
import { Sheet, SheetContent, SheetTitle } from '@/client/components/ui/sheet'
import { useAttendance } from '@/client/context/attendances'
import { useCourses } from '@/client/context/courses'
import { AnimatePresence } from 'framer-motion'
import useCourseStore from '@/client/stores/useCourseStore'
import { createClient } from '@/client/utils/supabase'

export const DashboardAttendanceT = ({
  courseId,
  students,
  courseDates,
}: {
  courseId: string
  students: any[]
  courseDates: Date[]
  }) => {
  const [user, setUser] = useState<any>(null)
  const { isLoading: isLoadingCourses, error: errorCourses } = useCourses()
  const { fetchTeacherCourses } = useCourseStore()
  const { allAttendance, fetchAttendances, error } = useAttendance()

  const [isCreatingAttendance, setIsCreatingAttendance] = useState<boolean>(false)
  const [isEditingAttendance, setIsEdittingAttendance] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string>('')
  const [isLoadingAttendance, setIsLoadingAttendance] = useState<boolean>(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user && !error) {
        setUser(user)
      }
    }
    getUser()
  }, [])


  useEffect(() => {
    const loadData = async () => {
      if (user?.id || !courseId) return

      setIsLoadingAttendance(true)
      try {
        await Promise.all([fetchAttendances({ courseId }), fetchTeacherCourses(user.id)])
      } catch (err) {
        console.error('Error loading attendance:', err)
      } finally {
        setIsLoadingAttendance(false)
      }
    }

    loadData()
  }, [courseId, fetchAttendances, fetchTeacherCourses, user?.id])

  function handleCreateAttendance(date: string) {
    setSelectedDate(date)
    setIsCreatingAttendance(true)
  }

  function handleEditAttendance(attendanceId: string, date: string) {
    setSelectedAttendanceId(attendanceId)
    setSelectedDate(date)
    setIsEdittingAttendance(true)
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
    setIsEdittingAttendance(false)
    // Recharger les données sans recharger toute la page
    if (courseId) {
      await fetchAttendances({ courseId })
    }
  }

  if (isLoadingCourses || isLoadingAttendance) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1" />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    )
  }

  if (error || errorCourses) {
    return <div>Erreur : {error || errorCourses}</div>
  }

  if (!allAttendance) {
    return <div className="text-center py-8 text-gray-500">Aucune présence trouvée</div>
  }

  return (
    <>
      <Card className="w-full">
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
              <SheetTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-center sm:text-left">
                Nouvelle Feuille des Présences
              </SheetTitle>
              {selectedDate && (
                <AttendanceCreate
                  courseId={courseId}
                  students={students}
                  onClose={handleCloseCreate}
                  date={selectedDate}
                />
              )}
            </SheetContent>
          </Sheet>
        )}
        {isEditingAttendance && (
          <Sheet open={isEditingAttendance} onOpenChange={setIsEdittingAttendance}>
            <SheetContent side="right" className="w-full sm:max-w-xl [&>button]:hidden">
              <SheetTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-center sm:text-left">
                Modifier la Feuille des Présences
              </SheetTitle>
              {selectedAttendanceId && selectedDate && (
                <AttendanceEdit
                  courseId={courseId}
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
