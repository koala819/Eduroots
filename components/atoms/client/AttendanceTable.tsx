"use client";

import { CheckCircle, Clock, Plus, Star, XCircle } from "lucide-react";
import React from "react";

import { AttendanceDocument } from "@/types/mongo/mongoose";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useHolidays } from "@/context/Holidays/client";
import { isWithinInterval } from "date-fns";

export const AttendanceTable = ({
  courseDates,
  allAttendance,
  handleCreateAttendance,
  handleEditAttendance,
}: {
  courseDates: Date[];
  allAttendance: AttendanceDocument[];
  handleCreateAttendance: (date: string) => void;
  handleEditAttendance: (attendanceId: string, date: string) => void;
}) => {
  const { holidays } = useHolidays();

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
                })
              );

              const today = new Date();
              const existingAttendance = allAttendance?.find(
                (att) =>
                  new Date(att.date).toDateString() === date.toDateString()
              );

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
                      {!existingAttendance.warning && (
                        <Button
                          className="px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base bg-[#375073] hover:bg-[#375073]/90 text-white"
                          onClick={() =>
                            handleEditAttendance(
                              existingAttendance.id,
                              date.toISOString()
                            )
                          }
                        >
                          Modifier
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }

              //   Attendance missings
              return (
                <React.Fragment key={date.toISOString()}>
                  {today < date ? (
                    <TableRow className="bg-blue-50 hover:bg-blue-100/50 transition-colors duration-200">
                      <TableCell colSpan={3} className="py-4 px-4">
                        <div className="flex flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
                              <Clock className="h-5 w-5 text-blue-600" />
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
                          <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="text-xs sm:text-sm text-blue-700 font-medium">
                              À venir
                            </span>
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
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
};
