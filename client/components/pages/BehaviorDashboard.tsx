'use client'

import { isWithinInterval } from 'date-fns'
import { AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Clock, Plus, Star, XCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { BehaviorCreate } from '@/client/components/atoms/BehaviorCreate'
import { BehaviorEdit } from '@/client/components/atoms/BehaviorEdit'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent } from '@/client/components/ui/card'
import { Sheet, SheetContent, SheetTitle } from '@/client/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/client/components/ui/tooltip'
import { useAttendances } from '@/client/context/attendances'
import { useAuthContext } from '@/client/context/auth'
import { useBehavior } from '@/client/context/behaviors'
import { useCourses } from '@/client/context/courses'
import { useHolidays } from '@/client/context/holidays'
import useCourseStore from '@/client/stores/useCourseStore'
import { AttendanceRecord } from '@/types/db'

interface AttendanceRecordWithUser extends AttendanceRecord {
  users: {
    id: string
    firstname: string
    lastname: string
    email: string
  }
}

export const BehaviorDashboard = ({
  courseId,
  courseDates,
}: {
  courseId: string
  courseDates: Date[]
}) => {
  const { session } = useAuthContext()
  const { error: errorCourses } = useCourses()
  const { allAttendance, fetchAttendances, getAttendanceById } = useAttendances()
  const { fetchTeacherCourses, courses } = useCourseStore()
  const { allBehaviors, fetchBehaviors, error, getBehaviorById } = useBehavior()
  const { holidays } = useHolidays()

  const [isCreatingBehavior, setIsCreatingBehavior] = useState<boolean>(false)
  const [isEditingBehavior, setIsEditingBehavior] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string>('')
  const [attendanceStudents, setAttendanceStudents] = useState<AttendanceRecordWithUser[]>([])
  const [isLoadingBehavior, setIsLoadingBehavior] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id || !courseId) return

      try {
        setIsLoadingBehavior(true)
        await Promise.all([
          fetchTeacherCourses(session.user.id),
          fetchAttendances({ courseId }),
          fetchBehaviors({ courseId }),
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
      await fetchAttendances({ courseId })
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
        await fetchBehaviors({ courseId })
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
            <div className="w-2 h-2 bg-primary rounded-full animate-ping mr-1"></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-ping mr-1"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-ping"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || errorCourses) {
    return <div>Erreur : {error ?? errorCourses}</div>
  }

  if (!allBehaviors) {
    return <div className="text-center py-8 text-muted-foreground">Aucun comportement trouvé</div>
  }

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-2 sm:p-6">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Date</TableHead>
                  <TableHead className="w-1/3">Statut</TableHead>
                  <TableHead className="w-1/3 text-right sm:text-left">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseDates
                  .sort((a, b) => b.getTime() - a.getTime())
                  .map((date) => {
                    // Vérification si la date est dans une période de vacances
                    const currentHoliday = holidays.find((holiday) =>
                      isWithinInterval(date, {
                        start: new Date(holiday.start_date),
                        end: new Date(holiday.end_date),
                      }),
                    )

                    const today = new Date()
                    const record = allBehaviors.find(
                      (beh) => new Date(beh.date).toDateString() === date.toDateString(),
                    )

                    if (record) {
                      return (
                        <TableRow key={date.toISOString()}>
                          <TableCell className="text-sm sm:text-base">
                            {date.toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <CheckCircle className="text-green-500 w-5 h-5" />
                          </TableCell>
                          <TableCell className="text-right sm:text-left">
                            <Button
                              className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base
                              bg-gray-900 hover:bg-gray-800 text-white"
                              onClick={() =>
                                handleEditBehavior(record.id, date.toISOString())
                              }
                            >
                              Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    }

                    return (
                      <React.Fragment key={date.toISOString()}>
                        {today < date ? (
                          <TableRow className="bg-blue-50">
                            <TableCell colSpan={3} className="py-3 px-4">
                              <div className="flex flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center space-x-3">
                                  <div className="flex h-8 w-8 items-center justify-center
                                  rounded-full bg-blue-100 shrink-0">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-blue-900 text-sm sm:text-base">
                                      Prochaine séance
                                    </p>
                                    <p className="text-xs sm:text-sm text-blue-600">
                                      {date.toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Star className="h-4 w-4 text-yellow-400" />
                                  <span className="text-xs sm:text-sm text-blue-700">À venir</span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          !currentHoliday && (
                            <TableRow className="bg-gray-50">
                              <TableCell className="text-sm sm:text-base">
                                {date.toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <XCircle className="text-red-500 w-5 h-5" />
                              </TableCell>
                              <TableCell className="text-right sm:text-left flex justify-end">
                                {isAttendanceExistsForDate(date) ? (
                                  <Button
                                    className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base
                                    hover:text-white bg-white border hover:bg-gray-800
                                    text-gray-800 border-gray-800"
                                    onClick={() =>
                                      handleCreateBehavior(date.toISOString())
                                    }
                                  >
                                    <span className="hidden sm:inline">Saisir</span>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          className="px-3 py-1 text-sm sm:px-4 sm:py-2
                                          sm:text-base bg-gray-100 text-gray-400"
                                        >
                                          <AlertCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          Veuillez d&apos;abord saisir la présence pour cette date
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </React.Fragment>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <AnimatePresence>
        {isCreatingBehavior && (
          <Sheet open={isCreatingBehavior} onOpenChange={setIsCreatingBehavior}>
            <SheetContent side="right" className="w-full sm:max-w-xl">
              <SheetTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0
                text-center sm:text-left">
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
              <SheetTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0
                text-center sm:text-left">
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
