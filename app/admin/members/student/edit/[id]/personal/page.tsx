import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { EditPersonalData } from '@/client/components/admin/molecules/StudentEditPersonalData'
import { getOneStudent } from '@/server/actions/api/students'

export const metadata: Metadata = {
  title: 'Modifier info Administratives Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/root/student/edit/[id]/admin`,
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

    return <EditPersonalData studentData={student} />
  } catch (error) {
    console.error('Erreur lors du chargement de l\'étudiant:', error)
    redirect('/admin/members')
  }
}
