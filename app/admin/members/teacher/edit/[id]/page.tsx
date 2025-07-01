import { Metadata } from 'next'
import { Suspense } from 'react'

import TeacherForm from '@/client/components/admin/pages/TeacherForm'
import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { getTeacherCourses } from '@/server/actions/api/courses'
import { getOneTeacher } from '@/server/actions/api/teachers'

export const metadata: Metadata = {
  title: 'Modifier un Enseignant',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/teacher/edit`,
  },
}

interface EditTeacherPageProps {
  params: Promise<{ id: string }>
}

async function TeacherEditContent({ teacherId }: { teacherId: string }) {
  const [teacherResponse, coursesResponse] = await Promise.all([
    getOneTeacher(teacherId),
    getTeacherCourses(teacherId),
  ])

  if (!teacherResponse.success || !teacherResponse.data) {
    return <ErrorContent message={teacherResponse.message || 'Professeur non trouvé'} />
  }

  if (!coursesResponse.success) {
    return (
      <ErrorContent
        message={coursesResponse.message || 'Erreur lors du chargement des cours'}
      />
    )
  }

  const initialData = {
    teacher: teacherResponse.data,
    courses: coursesResponse.data || [],
  }

  return (
    <div className="container mx-auto p-4">
      <TeacherForm mode="edit" initialData={initialData} />
    </div>
  )
}

export default async function EditTeacherPage({ params }: EditTeacherPageProps) {
  const { id: teacherId } = await params

  if (!teacherId) {
    return <ErrorContent message="ID du professeur manquant" />
  }

  return (
    <Suspense fallback={<LoadingScreen title="Chargement des données du professeur..." />}>
      <TeacherEditContent teacherId={teacherId} />
    </Suspense>
  )
}
