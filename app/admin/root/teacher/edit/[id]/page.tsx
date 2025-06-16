import { Metadata } from 'next'

import { EditTeacherForm } from '@/client/components/root/EditTeacherForm'

export const metadata: Metadata = {
  title: 'Modifier un Enseignant',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/root/teacher/edit`,
  },
}
export default function EditPage({ params }: any) {
  return <EditTeacherForm id={params.id} />
}
