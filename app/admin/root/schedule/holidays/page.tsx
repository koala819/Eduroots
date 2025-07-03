import { Metadata } from 'next'

import { HolidayScheduleEditor } from '@/client/components/root/HolidayScheduleEditor'

export const metadata: Metadata = {
  title: 'Modification Vacances',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/root/schedule/holidays`,
  },
}

const EditHolidaysPage = () => {
  return <HolidayScheduleEditor />
}

export default EditHolidaysPage
