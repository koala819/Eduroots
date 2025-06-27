import { Metadata } from 'next'

import { StudentEdit } from '@/client/components/admin/pages/StudentEdit'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { getOneStudent } from '@/server/actions/api/students'

export const metadata: Metadata = {
  title: 'Modifier un Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/student/edit`,
  },
}

interface EditStudentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { id } = await params

  try {
    const response = await getOneStudent(id)

    if (!response.success || !response.data) {
      console.error(response.message || 'Erreur lors de la récupération de l\'étudiant')
      return <ErrorContent message="Erreur lors du chargement des données de l'étudiant" />
    }

    return <StudentEdit id={id} studentData={response.data} />
  } catch (error) {
    console.error('Error in EditStudentPage:', error)
    return <ErrorContent message="Erreur lors du chargement des données de l'étudiant" />
  }

}
