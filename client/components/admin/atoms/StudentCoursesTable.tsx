'use client'

import { GraduationCap, Users } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table'
import { formatDayOfWeek } from '@/client/utils/timeSlots'
import { getSubjectColors } from '@/server/utils/helpers'
import { StudentCourseSession, TimeSlotEnum } from '@/types/courses'

interface CoursesTableProps {
  coursesSessions: StudentCourseSession[]
}

export function CoursesTable({ coursesSessions }: Readonly<CoursesTableProps>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">Jour</TableHead>
          <TableHead className="whitespace-nowrap">Horaires</TableHead>
          <TableHead className="whitespace-nowrap">Matière</TableHead>
          <TableHead className="whitespace-nowrap">Niveau</TableHead>
          <TableHead className="whitespace-nowrap">Professeur</TableHead>
          <TableHead className="whitespace-nowrap">Salle</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {coursesSessions.map(({ session, teacher }, index) => (
          <TableRow key={`session-${index}`}>
            <TableCell className="font-medium whitespace-nowrap">
              {formatDayOfWeek(session.timeSlot.day_of_week as TimeSlotEnum)}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {session.timeSlot.startTime.slice(0, 5)} - {session.timeSlot.endTime.slice(0, 5)}
            </TableCell>
            <TableCell className="min-w-[160px]">
              <div className={`flex items-center gap-2 px-3 py-2
                    ${getSubjectColors(session.subject)}`}>
                <GraduationCap className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{session.subject}</span>
              </div>
            </TableCell>
            <TableCell className="whitespace-nowrap">{session.level}</TableCell>
            <TableCell className="whitespace-nowrap">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {Array.isArray(teacher) ? (
                  teacher.map((t, index) => (
                    <span key={index}>
                      {t.firstname} {t.lastname}
                    </span>
                  ))
                ) : (
                  <span>
                    {teacher.firstname} {teacher.lastname}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {session.timeSlot.classroom_number ?? 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
