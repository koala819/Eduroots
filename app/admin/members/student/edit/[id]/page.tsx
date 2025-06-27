import { Metadata } from 'next'

import { StudentManagementView } from '@/client/components/root/StudentManagementView'

export const metadata: Metadata = {
  title: 'Modifier un Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/student/edit`,
  },
}

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params
  return <StudentManagementView id={id} />
}
