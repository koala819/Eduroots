import { Suspense } from 'react'

import { AttendanceStatsDisplay } from '@/components/admin/atoms/server/AttendanceStatsDisplay'
import { HighRiskStudentsButton } from '@/components/admin/atoms/server/HighRiskStudentsButton'
import Loading from '@/components/admin/atoms/server/Loading'
import { SchoolPeople } from '@/components/admin/organisms/server/SchoolPeople'

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
