'use client'

import { CalendarDays, GraduationCap, Users } from 'lucide-react'

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
import { TimeSlotEnum } from '@/types/courses'
import { TeacherResponse } from '@/types/teacher-payload'

interface CoursesTableProps {
  sessions: Array<{
    session: {
      id: string
      subject: string
      level: string
      timeSlot: {
        day_of_week: string
        startTime: string
        endTime: string
        classroom_number?: string
      }
    }
    teacher: TeacherResponse
  }>
  formatDayOfWeek: (dayOfWeek: TimeSlotEnum) => string
}

// Fonction pour formater les horaires sans les secondes
const formatTime = (time: string): string => {
  if (!time) return 'N/A'
  // Si le format est HH:MM:SS, on garde seulement HH:MM
  return time.split(':').slice(0, 2).join(':')
}

// Fonction pour obtenir les couleurs des matières sans bordures arrondies
const getSubjectColors = (subject: string): string => {
  switch (subject) {
  case 'Arabe':
    return 'bg-primary-accent/10 text-primary-accent border-l-4 border-primary-accent'
  case 'Education Culturelle':
    return 'bg-accent/10 text-accent border-l-4 border-accent'
  default:
    return 'bg-muted/10 text-muted-foreground border-l-4 border-muted'
  }
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
                  {formatDayOfWeek(session.timeSlot.day_of_week as TimeSlotEnum)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatTime(session.timeSlot.startTime)} - {formatTime(session.timeSlot.endTime)}
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
      </CardContent>
    </Card>
  )
}
