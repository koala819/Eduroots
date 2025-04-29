import {Metadata} from 'next'

import {EditAdminStudent} from '@/components/root/EditStudentAdmin'

export const metadata: Metadata = {
  title: 'Modifier info Administratives Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/root/student/edit/[id]/admin`,
  },
}

const Page = ({params}: any) => {
  return <EditAdminStudent id={params.id} />
}

export default Page
