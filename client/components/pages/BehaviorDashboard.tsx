'use client'

import { isWithinInterval } from 'date-fns'
import { CheckCircle, Clock, Plus, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { Button } from '@/client/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table'
import { useAttendances } from '@/client/context/attendances'
import { useBehavior } from '@/client/context/behaviors'
import { useCourses } from '@/client/context/courses'
import { useHolidays } from '@/client/context/holidays'
import { getCourseSessionById } from '@/server/actions/api/courses'

export const BehaviorDashboard = ({
  courseId,
  courseDates,
  userId,
}: {
  courseId: string
  courseDates: Date[]
  userId: string
}) => {
  const router = useRouter()
  const { error: errorCourses } = useCourses()
  const { allAttendance, fetchAttendances } = useAttendances()
  const { allBehaviors, fetchBehaviors, error } = useBehavior()
  const { holidays } = useHolidays()

  const [isLoadingBehavior, setIsLoadingBehavior] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      if (!userId || !courseId) return

      try {
        setIsLoadingBehavior(true)

        // Récupérer le vrai courseId à partir du courseSessionId
        const response = await getCourseSessionById(courseId)
        if (!response.success || !response.data) {
          console.error('❌ [BehaviorDashboard] Erreur chargement session:', response.message)
          return
        }

        const realCourseId = response.data.courses.id
        const sessionId = courseId // courseId est déjà l'ID de la session

        await Promise.all([
          fetchAttendances({ courseId: realCourseId }),
          fetchBehaviors({ courseId: sessionId }), // Utiliser l'ID de la session
        ])
      } catch (err) {
        console.error('Error loading behavior data:', err)
      } finally {
        setIsLoadingBehavior(false)
      }
    }

    loadData()
  }, [courseId, fetchAttendances, fetchBehaviors, userId])

  function isAttendanceExistsForDate(date: Date) {
    if (!allAttendance) return false

    return allAttendance.some((attendance) => {
      const attendanceDate = new Date(attendance.date)
      return attendanceDate.toDateString() === date.toDateString()
    })
  }

  function handleCreateBehavior(date: string) {
    router.push(
      `/teacher/classroom/course/${courseId}/behavior/create?date=${date}`,
    )
  }

  function handleEditBehavior(behaviorId: string, date: string) {
    router.push(
      `/teacher/classroom/course/${courseId}/behavior/${behaviorId}/edit?date=${date}`,
    )
  }

  if (isLoadingBehavior || allBehaviors === null) {
    return (
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
    )
  }

  if (error || errorCourses) {
    return <div>Erreur : {error ?? errorCourses}</div>
  }

  if (!allBehaviors) {
    return <div className="text-center py-8 text-muted-foreground">Aucun comportement trouvé</div>
  }

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3 text-primary">Date</TableHead>
            <TableHead className="w-1/3 text-primary">Statut</TableHead>
            <TableHead className="w-1/3 text-right sm:pr-16 text-primary">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courseDates
            .toSorted((a, b) => b.getTime() - a.getTime())
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

              // Behavior exists
              if (record) {
                return (
                  <TableRow
                    key={date.toISOString()}
                    className="hover:bg-muted transition-colors duration-200 bg-success/10"
                  >
                    <TableCell className="text-sm sm:text-base text-primary">
                      {date.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-success w-5 h-5" />
                        <span className="text-sm text-success">Présent</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right sm:text-left">
                      <Button
                        className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base bg-primary
                            hover:bg-primary-dark text-primary-foreground hover:cursor-pointer"
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

              // Behavior missing
              return (
                <React.Fragment key={date.toISOString()}>
                  {today < date ? (
                    <TableRow className="bg-muted">
                      <TableCell colSpan={3} className="py-6 px-4">
                        <div className="flex flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex h-12 w-12 items-center justify-center
                                rounded-lg bg-muted shadow-sm shrink-0"
                            >
                              <Clock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-base sm:text-lg">
                                Prochaine séance
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {date.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base
                                bg-muted text-muted-foreground font-medium
                                rounded-lg shadow-sm"
                          >
                            À venir
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    !currentHoliday && (
                      <TableRow className="bg-primary/5">
                        <TableCell className="text-sm sm:text-base text-primary">
                          {date.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <XCircle className="text-error w-5 h-5" />
                            <span className="text-sm text-error">Absent</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right sm:text-left flex justify-end">
                          {isAttendanceExistsForDate(date) ? (
                            <Button
                              className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base
                                border-primary bg-background border
                                hover:bg-primary text-primary hover:text-primary-foreground
                                shadow-sm transition-colors duration-200 hover:shadow-md
                                hover:cursor-pointer"
                              onClick={() =>
                                handleCreateBehavior(date.toISOString())
                              }
                            >
                              <span className="hidden sm:inline">Saisir</span>
                              <Plus className="h-4 w-4" />
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <XCircle className="h-4 w-4 shrink-0" />
                              <span className="text-xs sm:text-sm hidden sm:inline">
                                Saisie présence manquante
                              </span>
                            </div>
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
  )
}
