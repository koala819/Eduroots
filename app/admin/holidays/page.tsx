import { Suspense } from 'react'

import HolidaysEdit from '@/client/components/admin/molecules/HolidaysEdit'
import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { getAllHolidays } from '@/server/actions/api/holidays'
import { Holiday } from '@/types/holidays'

export default async function HolidaysAdminPage() {
  const holidaysRes = await getAllHolidays()
  let holidays: Holiday[] = []

  if (!holidaysRes.data) {
    return <ErrorContent message="Erreur lors de la récupération des vacances" />
  }

  holidays = [...holidaysRes.data].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  )

  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="p-4 max-w-2xl mx-auto">
        <HolidaysEdit holidays={holidays} />
      </div>
    </Suspense>
  )
}
