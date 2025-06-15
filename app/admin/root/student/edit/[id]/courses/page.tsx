import { Metadata } from 'next'

import { EditCourseStudent } from '@/components/root/EditStudentCourse'

export const metadata: Metadata = {
  title: 'Modifier info Cours pour l\'Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/root/student/edit/[id]/courses`,
  },
}

const Page = ({ params }: any) => {
  return <EditCourseStudent studentId={params.id} />
}

export default Page
