'use client'

import { CheckCircle, Clock, Plus, XCircle } from 'lucide-react'
import React from 'react'

import { Attendance } from '@/types/db'

import { Button } from '@/client/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table'

import { useHolidays } from '@/client/context/holidays'
import { isWithinInterval } from 'date-fns'

interface AttendanceTableProps {
  courseDates: Date[]
  allAttendance: Attendance[]
  handleCreateAttendance: (date: string) => void
  handleEditAttendance: (attendanceId: string, date: string) => void
}

export function AttendanceTable({
  courseDates,
  allAttendance,
  handleCreateAttendance,
  handleEditAttendance,
}: Readonly<AttendanceTableProps>) {
  const { holidays } = useHolidays()

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3 text-[#375073]">Date</TableHead>
            <TableHead className="w-1/3 text-[#375073]">Statut</TableHead>
            <TableHead className="w-1/3 text-right sm:pr-16 text-[#375073]">
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
                  start: new Date(holiday.start),
                  end: new Date(holiday.end),
                }),
              )

              const today = new Date()
              const existingAttendance = allAttendance?.find(
                (att) =>
                  new Date(att.date).toDateString() === date.toDateString(),
              )
              console.log('existingAttendance', existingAttendance)

              // Attendances exists
              if (existingAttendance) {
                return (
                  <TableRow
                    key={date.toISOString()}
                    className="hover:bg-gray-50 transition-colors duration-200 bg-green-50/30"
                  >
                    <TableCell className="text-sm sm:text-base text-[#375073]">
                      {date.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-500 w-5 h-5" />
                        <span className="text-sm text-green-700">Présent</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right sm:text-left">
                      <Button
                        className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base bg-[#375073]
                        hover:bg-[#375073]/90 text-white"
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
                      className="bg-gray-50"
                    >
                      <TableCell colSpan={3} className="py-6 px-4">
                        <div className="flex flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg
                              bg-gray-100 shadow-sm shrink-0"
                            >
                              <Clock className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 text-base sm:text-lg">
                                Prochaine séance
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {date.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base
                            bg-gray-100 text-gray-700 font-medium
                            rounded-lg shadow-sm"
                          >
                            À venir
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    !currentHoliday && (
                      <TableRow className="bg-[#375073]/5">
                        <TableCell className="text-sm sm:text-base text-[#375073]">
                          {date.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <XCircle className="text-red-500 w-5 h-5" />
                            <span className="text-sm text-red-700">Absent</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right sm:text-left flex justify-end">
                          <Button
                            className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base
                          border-[#375073] bg-white border
                          hover:bg-[#375073] text-[#375073] hover:text-white
                          transition-colors duration-200 shadow-sm hover:shadow-md"
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
