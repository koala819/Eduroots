import { Metadata } from 'next'
import { Suspense } from 'react'

import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { PaymentsView } from '@/server/components/admin/pages/Payments'
import { getAllStudents } from '@/server/actions/api/students'
import { StudentResponse } from '@/types/student-payload'

export const metadata: Metadata = {
  title: 'Paiements',
  description: 'Gestion des cotisations, inscriptions et paiements',
}

export default async function PaymentsPage() {
  const studentsResponse = await getAllStudents()
  const students = studentsResponse.success ? (studentsResponse.data as StudentResponse[]) : []

  return (
    <Suspense fallback={<LoadingScreen />}>
      <PaymentsView students={students} />
    </Suspense>
  )
}
