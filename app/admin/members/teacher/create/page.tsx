import { Metadata } from 'next'

import NewTeacherForm from '@/client/components/admin/pages/TeacherCreateForm'

export const metadata: Metadata = {
  title: 'Création nouvel Enseignant',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/teacher/create`,
  },
}
export default function CreatePage() {
  return <NewTeacherForm />
}
