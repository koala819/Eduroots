import {Metadata} from 'next'

import PlanningGrid from '@/components/admin/organisms/server/PlanningGrid'

// import PlanningGrid from '@/components/admin/organisms/PlanningGrid'

export const metadata: Metadata = {
  title: 'Planning des cours',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/schedule`,
  },
}

const SchedulePage = () => {
  return <PlanningGrid />
}
export default SchedulePage
