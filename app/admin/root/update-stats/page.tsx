'use client'

import { useState } from 'react'

import { useToast } from '@/client/hooks/use-toast'

import { Button } from '@/client/components/ui/button'

import { calculateStats } from '@/server/utils/stats/calculate'
import { useStats } from '@/client/context/stats'

export default function StatsPage() {
  const [isCalculating, setIsCalculating] = useState(false)
  const { toast } = useToast()
  const { refreshEntityStats } = useStats()

  const handleCalculateStats = async () => {
    setIsCalculating(true)
    try {
      const result = await calculateStats()

      if (result.success) {
        toast({
          title: 'Succès',
          description: result.message,
        })

        // Rafraîchir les stats dans le context
        await refreshEntityStats()
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message ?? 'Erreur lors du calcul des statistiques',
      })
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des statistiques</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Actualisation des statistiques
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            Met à jour toutes les statistiques (présence, notes, comportement)
            pour tous les élèves. Cette opération peut prendre plusieurs
            minutes.
          </p>
          <Button onClick={handleCalculateStats} disabled={isCalculating}>
            {isCalculating ? 'Calcul en cours...' : 'Calculer les statistiques'}
          </Button>
        </div>
      </div>
    </div>
  )
}
