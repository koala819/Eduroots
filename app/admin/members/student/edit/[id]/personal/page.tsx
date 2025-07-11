import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { EditPersonalData } from '@/client/components/admin/molecules/StudentEditPersonalData'
import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { getOneStudent } from '@/server/actions/api/students'

export const metadata: Metadata = {
  title: 'Modifier info Administratives Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/student/edit/[id]/personal`,
  },
}

interface EditPersonalStudentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPersonalStudentPage({ params }: EditPersonalStudentPageProps) {
  const { id } = await params

  try {
    const studentResponse = await getOneStudent(id)

    if (!studentResponse.success || !studentResponse.data) {
      console.error('Étudiant non trouvé:', id)
      redirect('/admin/members')
    }

    const student = studentResponse.data

    return (
      <Suspense fallback={<LoadingScreen />}>
        <EditPersonalData studentData={student} />
      </Suspense>
    )
  } catch (error) {
    console.error('Erreur lors du chargement de l\'étudiant:', error)
    redirect('/admin/members')
  }
}
