'use client'

import { CalendarDays, GraduationCap, Users } from 'lucide-react'

import { Badge } from '@/client/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table'
import { CourseSessionWithRelations,TimeSlotEnum } from '@/types/courses'
import { TeacherResponse } from '@/types/teacher-payload'

interface CoursesTableProps {
  sessions: Array<{
    session: CourseSessionWithRelations
    teacher: TeacherResponse
  }>
  formatDayOfWeek: (dayOfWeek: TimeSlotEnum) => string
}

export function CoursesTable({ sessions, formatDayOfWeek }: Readonly<CoursesTableProps>) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Emploi du temps
        </CardTitle>
        <CardDescription>Vue d&apos;ensemble des cours pour cette année</CardDescription>
      </CardHeader>
      <CardContent>
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
            {sessions.map(({ session, teacher }, index) => (
              <TableRow key={`session-${index}`}>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatDayOfWeek(session.courses_sessions_timeslot[0].day_of_week)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {session.courses_sessions_timeslot[0].start_time} -
                  {session.courses_sessions_timeslot[0].end_time}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    {session.subject}
                  </Badge>
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
                  {session.courses_sessions_timeslot[0].classroom_number ?? 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
