import { Metadata } from 'next'

import NewTeacherForm from '@/client//components/root/NewTeacherForm'

export const metadata: Metadata = {
  title: 'Création nouvel Enseignant',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/teacher/create`,
  },
}
export default function CreatePage() {
  return <NewTeacherForm />
}
