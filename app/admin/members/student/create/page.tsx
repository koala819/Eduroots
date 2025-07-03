import { Metadata } from 'next'
import { Suspense } from 'react'

import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import CreateStudentForm from '@/client/components/organisms/CreateStudentForm'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'

export const metadata: Metadata = {
  title: 'Création nouvel Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/student/create`,
  },
}

export default async function CreateStudentPage() {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return <ErrorContent message="Erreur d'authentification" />
    }

    return (
      <Suspense fallback={<LoadingScreen />}>
        <CreateStudentForm />
      </Suspense>
    )
  } catch (error) {
    console.error('Erreur dans CreatePage:', error)
    return <ErrorContent message="Une erreur est survenue lors du chargement de la page" />
  }
}
