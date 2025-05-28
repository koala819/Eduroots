'use client'

import {useSession} from 'next-auth/react'
import React, {useEffect, useState} from 'react'

import {AttendanceRecord} from '@/types/attendance'

import {BehaviorCreate} from '@/components/atoms/client/BehaviorCreate'
import {BehaviorEdit} from '@/components/atoms/client/BehaviorEdit'
import {BehaviorTable} from '@/components/atoms/client/BehaviorTable'
import {Card, CardContent} from '@/components/ui/card'
import {Sheet, SheetContent, SheetTitle} from '@/components/ui/sheet'

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

  const {error: errorCourses} = useCourses()
  const {allAttendance, fetchAttendances, getAttendanceById} = useAttendance()
  const {fetchTeacherCourses, courses} = useCourseStore()
  const {allBehaviors, fetchBehaviors, error, getBehaviorById} = useBehavior()

  const [isCreatingBehavior, setIsCreatingBehavior] = useState<boolean>(false)
  const [isEditingBehavior, setIsEditingBehavior] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string>('')
  const [attendanceStudents, setAttendanceStudents] = useState<AttendanceRecord[]>([])
  const [isLoadingBehavior, setIsLoadingBehavior] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id || !courseId) return

      try {
        setIsLoadingBehavior(true)
        await Promise.all([
          fetchTeacherCourses(session.user.id),
          fetchAttendances({courseId}),
          fetchBehaviors({courseId}),
        ])
      } catch (err) {
        console.error('Error loading behavior data:', err)
      } finally {
        setIsLoadingBehavior(false)
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

  async function handleEditBehavior(behaviorId: string, date: string) {
    try {
      setIsLoadingBehavior(true)
      // Charger toutes les données nécessaires avant d'ouvrir le modal
      const [attendanceData, behaviorResponse] = await Promise.all([
        getAttendanceById(courseId, date),
        getBehaviorById(courseId, date),
      ])

      if (attendanceData !== null && attendanceData !== undefined) {
        // Mettre à jour les données d'assiduité
        setAttendanceStudents(attendanceData.records)

        // Vérifier que nous avons un behaviorId valide
        if (behaviorResponse?.success && behaviorResponse.data?.id) {
          setSelectedBehaviorId(behaviorResponse.data.id)
          setSelectedDate(date)
          setIsEditingBehavior(true)
        } else {
          console.error('Pas de behavior trouvé pour la date:', date)
          return
        }
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setIsLoadingBehavior(false)
    }
  }

  async function handleCloseCreate() {
    setIsCreatingBehavior(false)
    // Attendre un peu que le modal soit fermé
    await new Promise((resolve) => setTimeout(resolve, 100))
    // Recharger les données sans recharger toute la page
    if (courseId) {
      await fetchAttendances({courseId})
    }
  }

  async function handleCloseEdit() {
    // D'abord fermer le modal
    setIsEditingBehavior(false)
    setSelectedBehaviorId('')
    setSelectedDate(null)

    // Puis rafraîchir les données
    if (courseId && session?.user?.id) {
      try {
        setIsLoadingBehavior(true)
        // Recharger les données de comportement uniquement
        await fetchBehaviors({courseId})
      } catch (error) {
        console.error('Error refreshing data:', error)
      } finally {
        setIsLoadingBehavior(false)
      }
    }
  }

  if (isLoadingBehavior || courses.length === 0 || allBehaviors === null) {
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
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <BehaviorTable
              courseDates={courseDates}
              handleCreate={handleCreateBehavior}
              handleEdit={handleEditBehavior}
              recordExists={isAttendanceExistsForDate}
              getRecordForDate={(date) =>
                (allBehaviors as any).find(
                  (beh: any) => new Date(beh.date).toDateString() === date.toDateString(),
                )
              }
            />
          </div>
        </CardContent>
      </Card>
      <AnimatePresence>
        {isCreatingBehavior && (
          <Sheet open={isCreatingBehavior} onOpenChange={setIsCreatingBehavior}>
            <SheetContent side="right" className="w-full sm:max-w-xl">
              <SheetTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-center sm:text-left">
                Nouvelle Feuille des Comportements
              </SheetTitle>
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
            <SheetContent side="right" className="w-full sm:max-w-xl [&>button]:hidden">
              <SheetTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-center sm:text-left">
                Modifier la Feuille des Comportements
              </SheetTitle>
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
