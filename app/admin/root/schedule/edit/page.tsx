import {Metadata} from 'next'

import {ScheduleEditor} from '@/components/root/ScheduleEditor'

export const metadata: Metadata = {
  title: 'Modification horaires',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/root/schedule/edit`,
  },
}

const EditSchedulePage = () => {
  return <ScheduleEditor />
}

export default EditSchedulePage
