import { Metadata } from 'next'
import { Suspense } from 'react'

import TeacherForm from '@/client/components/admin/pages/TeacherForm'
import LoadingScreen from '@/client/components/atoms/LoadingScreen'

export const metadata: Metadata = {
  title: 'Créer un Professeur',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/teacher/create`,
  },
}

export default async function CreateTeacherPage() {
  return (
    <Suspense fallback={<LoadingScreen title="Préparation du formulaire..." />}>
      <div className="container mx-auto p-4">
        <TeacherForm mode="create" />
      </div>
    </Suspense>
  )
}
