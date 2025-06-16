'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { StudentCourses } from '@/server/components/admin/molecules/StudentCourses'
import { AdminInfoDisplay } from '@/server/components/root/StudentAdministratiView'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { LoadingSpinner } from '@/client/components/ui/loading-spinner'

import { useStudents } from '@/client/context/students'
import { useTeachers } from '@/client/context/teachers'

export const StudentManagementView = ({ id }: {id: string}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [studentData, setStudentData] = useState<any>(null)
  const { getOneStudent } = useStudents()
  const { getAllTeachers } = useTeachers()
  const router = useRouter()

  const loadData = useCallback(async () => {
    try {
      const student = await getOneStudent(id)
      await getAllTeachers()
      setStudentData(student)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [id, getOneStudent, getAllTeachers])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Mémoriser les fonctions de navigation
  const handleEditAdmin = useCallback(() => {
    router.push(`${process.env.NEXT_PUBLIC_CLIENT_URL}/admin/root/student/edit/${id}/admin`)
  }, [router, id])

  const handleEditCourse = useCallback(() => {
    router.push(`${process.env.NEXT_PUBLIC_CLIENT_URL}/admin/root/student/edit/${id}/courses`)
  }, [router, id])

  // Mémoriser le contenu administratif
  const adminContent = useMemo(
    () => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Informations Administratives</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminInfoDisplay data={studentData} />
        </CardContent>
      </Card>
    ),
    [studentData],
  )

  if (isLoading) return <LoadingSpinner text="Chargement..." />

  return (
    <div className="mx-auto">
      {adminContent}
      <Button className="w-full mb-8" onClick={handleEditAdmin}>
        Modifier
      </Button>
      <StudentCourses studentId={id} />
      <Button className="w-full mb-8" onClick={handleEditCourse}>
        Modifier
      </Button>
    </div>
  )
}
