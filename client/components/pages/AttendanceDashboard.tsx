'use client'

import { isWithinInterval } from 'date-fns'
import { CheckCircle, Clock, Plus, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

import { EmptyContent, ErrorContent } from '@/client/components/atoms/StatusContent'
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
import { useCourses } from '@/client/context/courses'
import { useHolidays } from '@/client/context/holidays'
import { getCourseSessionById } from '@/server/actions/api/courses'

export const AttendanceDashboard = ({
  courseSessionId,
  courseDates,
}: {
  courseSessionId: string
  courseDates: Date[]
}) => {
  const router = useRouter()
  const { error: errorCourses } = useCourses()
  const { allAttendance, fetchAttendances, error: attendanceError } = useAttendances()
  const { holidays } = useHolidays()

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getCourseSessionById(courseSessionId)
        if (!response.success || !response.data) {
          console.error('❌ [AttendanceDashboard] Erreur chargement session:', response.message)
          return
        }

        const courseId = response.data.courses.id
        await fetchAttendances({ courseId })
      } catch (err) {
        console.error('❌ [AttendanceDashboard] Erreur chargement:', err)
      }
    }

    loadData()
  }, [courseSessionId, fetchAttendances])

  function handleCreateAttendance(date: string) {
    router.push(
      `/teacher/classroom/course/${courseSessionId}/attendance/create?date=${date}`,
    )
  }

  function handleEditAttendance(attendanceId: string, date: string) {
    router.push(
      `/teacher/classroom/course/${courseSessionId}/attendance/${attendanceId}/edit?date=${date}`,
    )
  }

  if (attendanceError || errorCourses) {
    return <ErrorContent message={attendanceError ?? errorCourses ?? 'Une erreur est survenue'} />
  }

  if (!allAttendance || allAttendance.length === 0) {
    return <EmptyContent />
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
              const existingAttendance = allAttendance?.find(
                (att) =>
                  new Date(att.date).toDateString() === date.toDateString(),
              )

              // Attendances exists
              if (existingAttendance) {
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
                          handleEditAttendance(
                            existingAttendance.id,
                            date.toISOString(),
                          )
                        }
                      >
                            Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              }

              //   Attendance missings
              return (
                <React.Fragment key={date.toISOString()}>
                  {today < date ? (
                    <TableRow
                      className="bg-muted"
                    >
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
                          <Button
                            className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base
                              border-primary bg-background border
                              hover:bg-primary text-primary hover:text-primary-foreground shadow-sm
                              transition-colors duration-200 hover:shadow-md hover:cursor-pointer"
                            onClick={() =>
                              handleCreateAttendance(date.toISOString())
                            }
                          >
                            <span className="hidden sm:inline">Saisir</span>
                            <Plus className="h-4 w-4" />
                          </Button>
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
