'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { StudentResponse } from '@/types/student-payload'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table'

import { useStudents } from '@/client/context/students'

export const StudentsWithoutCourses = () => {
  const { getStudentsWithoutCourses, isLoading } = useStudents()
  const [students, setStudents] = useState<StudentResponse[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    const loadStudents = async () => {
      const studentsData = await getStudentsWithoutCourses()
      // Tri alphabétique sur le prénom
      const sortedStudents = [...studentsData].sort((a, b) =>
        a.firstname.localeCompare(b.firstname, 'fr', { sensitivity: 'base' }),
      )
      setStudents(sortedStudents)
      setIsInitialLoading(false)
    }
    loadStudents()
  }, [getStudentsWithoutCourses])

  if (isLoading && isInitialLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!students.length && !isInitialLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Tous les étudiants sont inscrits à des cours.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{students.length} Étudiants sans cours </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prénom</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              return (
                <TableRow key={student.id}>
                  <TableCell>{student.firstname}</TableCell>
                  <TableCell>{student.lastname}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.id}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
