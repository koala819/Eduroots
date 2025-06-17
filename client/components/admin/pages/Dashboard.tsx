import { Suspense } from 'react'

import { AttendanceStatsDisplay } from '@/server/components/admin/atoms/AttendanceStatsDisplay'
import { HighRiskStudentsButton } from '@/server/components/admin/atoms/HighRiskStudentsButton'
import Loading from '@/server/components/admin/atoms/Loading'
import { SchoolPeople } from '@/server/components/admin/organisms/SchoolPeople'

export const Dashboard = () => {
  return (
    <div className="bg-background">
      <main className="container py-6 space-y-6">
        <Suspense fallback={<Loading name="des données de l'école " />}>
          <SchoolPeople />
        </Suspense>
        <HighRiskStudentsButton className="mt-3" />
        <AttendanceStatsDisplay />
      </main>
    </div>
  )
}
