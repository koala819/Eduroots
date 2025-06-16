'use server'

import { Behavior, BehaviorProvider } from '@/client/context/behaviors'
import { fetchBehaviorsByCourse } from '@/server/actions/api/behaviors'

interface BehaviorServerComponentProps {
  children: React.ReactNode
  courseId?: string
}

export default async function BehaviorsServerComponent({
  children,
  courseId,
}: Readonly<BehaviorServerComponentProps>) {
  // Si un courseId est fourni, on pré-charge les données pour ce cours
  let initialBehaviorData: Behavior[] | null = null

  if (courseId) {
    // Récupération des données avec typage explicite
    const response = await fetchBehaviorsByCourse(courseId)

    if (response.success && response.data) {
      // Transformation des données pour inclure les records
      initialBehaviorData = Array.isArray(response.data)
        ? response.data.map((behavior: any) => ({
          ...behavior,
          records: behavior.behavior_records ?? [],
        }))
        : [{
          ...response.data,
          records: response.data.behavior_records ?? [],
        }]
    }
  }

  return (
    <BehaviorProvider initialBehaviorData={initialBehaviorData}>
      {children}
    </BehaviorProvider>
  )
}
