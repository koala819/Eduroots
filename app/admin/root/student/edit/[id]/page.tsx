import {Metadata} from 'next'

import {StudentManagementView} from '@/components/root/StudentManagementView'

export const metadata: Metadata = {
  title: 'Modifier un Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/root/student/edit`,
  },
}
export default function EditPage({params}: any) {
  return <StudentManagementView id={params.id} />
}
