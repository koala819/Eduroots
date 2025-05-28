'use server'

import {BehaviorDocument} from '@/types/mongoose'

import {fetchBehaviorsByCourse} from '@/app/actions/context/behaviors'
import {BehaviorProvider} from '@/context/Behaviors/client'

interface BehaviorServerComponentProps {
  children: React.ReactNode
  courseId?: string
}

export default async function BehaviorsServerComponent({
  children,
  courseId,
}: BehaviorServerComponentProps) {
  // Si un courseId est fourni, on pré-charge les données pour ce cours
  let initialBehaviorData: BehaviorDocument[] | null = null

  if (courseId) {
    // Récupération des données avec typage explicite
    const response = await fetchBehaviorsByCourse(courseId)

    if (response.success && response.data) {
      // Traitement uniforme des données
      initialBehaviorData = Array.isArray(response.data)
        ? (response.data as any[])
        : ([response.data] as any[])
    }
  }

  return <BehaviorProvider initialBehaviorData={initialBehaviorData}>{children}</BehaviorProvider>
}
