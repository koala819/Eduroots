'use server'

import { BehaviorDocument } from '@/zUnused/types/mongoose'

import { fetchBehaviorsByCourse } from '@/server/actions/api/behaviors'
import { BehaviorProvider } from '@/client/context/behaviors'

interface BehaviorServerComponentProps {
  children: React.ReactNode
  courseId?: string
}

export default async function BehaviorsServerComponent({
  children,
  courseId,
}: Readonly<BehaviorServerComponentProps>) {
  // Si un courseId est fourni, on pré-charge les données pour ce cours
  let initialBehaviorData: BehaviorDocument[] | null = null

  if (courseId) {
    // Récupération des données avec typage explicite
    const response = await fetchBehaviorsByCourse(courseId)

    if (response.success && response.data) {
      // Traitement uniforme des données
      initialBehaviorData = Array.isArray(response.data)
        ? (response.data as BehaviorDocument[])
        : ([response.data] as BehaviorDocument[])
    }
  }

  return <BehaviorProvider initialBehaviorData={initialBehaviorData}>{children}</BehaviorProvider>
}
