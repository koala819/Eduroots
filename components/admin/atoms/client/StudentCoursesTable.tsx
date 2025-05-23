'use client'

import {CalendarDays, GraduationCap, Users} from 'lucide-react'

import {CourseSession, TimeSlotEnum} from '@/types/course'
import {Teacher} from '@/types/user'

import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'

interface CoursesTableProps {
  sessions: Array<{
    session: CourseSession
    teacher: Teacher
  }>
  formatDayOfWeek: (dayOfWeek: TimeSlotEnum) => string
}

export function CoursesTable({sessions, formatDayOfWeek}: CoursesTableProps) {
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
            {sessions.map(({session, teacher}, index) => (
              <TableRow key={`session-${index}`}>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatDayOfWeek(session.timeSlot.dayOfWeek as TimeSlotEnum)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {session.timeSlot.startTime} - {session.timeSlot.endTime}
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
                  {session.timeSlot.classroomNumber}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
