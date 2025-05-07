'use client'

import {useSession} from 'next-auth/react'
import React, {useEffect, useState} from 'react'

import {AttendanceRecord} from '@/types/attendance'

import {BehaviorCreate} from '@/components/atoms/client/BehaviorCreate'
import {BehaviorEdit} from '@/components/atoms/client/BehaviorEdit'
import {BehaviorTable} from '@/components/atoms/client/BehaviorTable'
import {Card, CardContent} from '@/components/ui/card'
import {Sheet, SheetContent} from '@/components/ui/sheet'

import {useAttendance} from '@/context/Attendances/client'
import {useBehavior} from '@/context/Behaviors/client'
import {useCourses} from '@/context/Courses/client'
import {AnimatePresence} from 'framer-motion'
import useCourseStore from '@/stores/useCourseStore'

export const DashboardBehaviorT = ({
  courseId,
  courseDates,
}: {
  courseId: string
  courseDates: Date[]
}) => {
  const {data: session} = useSession()
  const {allAttendance, fetchAttendances, isLoadingAttendance, getAttendanceById} = useAttendance()
  const {teacherCourses, isLoading: isLoadingCourses, error: errorCourses} = useCourses()
  const {fetchTeacherCourses} = useCourseStore()
  const {allBehaviors, fetchBehaviors, error} = useBehavior()

  const [isCreatingBehavior, setIsCreatingBehavior] = useState<boolean>(false)
  const [isEditingBehavior, setIsEditingBehavior] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string>('')
  const [attendanceStudents, setAttendanceStudents] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id || !courseId) return

      try {
        // Chargement parallèle des présences et comportements
        await Promise.all([
          fetchTeacherCourses(session.user.id),
          fetchAttendances({courseId}),
          fetchBehaviors({courseId}),
        ])
      } catch (err) {
        console.error('Error loading behavior:', err)
      }
    }

    loadData()
  }, [courseId, fetchAttendances, fetchBehaviors, fetchTeacherCourses, session?.user?.id])

  function isAttendanceExistsForDate(date: Date) {
    if (!allAttendance) return false

    return allAttendance.some((attendance) => {
      const attendanceDate = new Date(attendance.date)
      return attendanceDate.toDateString() === date.toDateString()
    })
  }

  async function handleEditBehavior(behaviorId: string, date: string) {
    try {
      // Charger les données avant de montrer le modal
      const data = await getAttendanceById(courseId, date)

      if (data !== null && data !== undefined) {
        setAttendanceStudents(data.records)
        setSelectedBehaviorId(behaviorId)
        setSelectedDate(date)
        setIsEditingBehavior(true)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
      // Optionnel : afficher un toast d'erreur
    }
  }

  async function handleCreateBehavior(date: string) {
    try {
      // Charger les données avant de montrer le modal, comme dans handleEditBehavior
      const data = await getAttendanceById(courseId, date)

      if (data !== null && data !== undefined) {
        setAttendanceStudents(data.records)
        setSelectedDate(date)
        setIsCreatingBehavior(true)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
    }
  }

  function handleCloseCreate() {
    setIsCreatingBehavior(false)
    setSelectedDate(null)
  }

  function handleCloseEdit() {
    setIsEditingBehavior(false)
    setSelectedDate(null)
  }

  if (isLoadingAttendance || !teacherCourses || allBehaviors === null || isLoadingCourses) {
    return (
      <Card className="w-full">
        <CardContent className="p-2 sm:p-6">
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
        </CardContent>
      </Card>
    )
  }

  if (error || errorCourses) {
    return <div>Erreur : {error || errorCourses}</div>
  }

  if (!allBehaviors) {
    return <div className="text-center py-8 text-gray-500">Aucun comportement trouvé</div>
  }

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-2 sm:p-6">
          <BehaviorTable
            courseDates={courseDates}
            handleCreate={handleCreateBehavior}
            handleEdit={handleEditBehavior}
            recordExists={isAttendanceExistsForDate}
            getRecordForDate={(date) =>
              allBehaviors.find((beh) => new Date(beh.date).toDateString() === date.toDateString())
            }
          />
        </CardContent>
      </Card>
      <AnimatePresence>
        {isCreatingBehavior && (
          <Sheet open={isCreatingBehavior} onOpenChange={setIsCreatingBehavior}>
            <SheetContent side="right" className="w-full sm:max-w-xl">
              {selectedDate && (
                <BehaviorCreate
                  courseId={courseId}
                  students={attendanceStudents}
                  onClose={handleCloseCreate}
                  date={selectedDate}
                />
              )}
            </SheetContent>
          </Sheet>
        )}
        {isEditingBehavior && (
          <Sheet open={isEditingBehavior} onOpenChange={setIsEditingBehavior}>
            <SheetContent side="right" className="w-full sm:max-w-xl">
              {selectedBehaviorId && selectedDate && (
                <BehaviorEdit
                  courseId={courseId}
                  onClose={handleCloseEdit}
                  date={selectedDate}
                  students={attendanceStudents}
                  behaviorId={selectedBehaviorId}
                />
              )}
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  )
}
