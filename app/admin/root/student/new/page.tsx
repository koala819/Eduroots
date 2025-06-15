import { Metadata } from 'next'

import NewStudentForm from '@/components/admin/organisms/client/NewStudentForm'

export const metadata: Metadata = {
  title: 'Création nouvel Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/student/create`,
  },
}
export default function CreatePage() {
  return <NewStudentForm />
}
