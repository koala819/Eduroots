'use client'

import { useState } from 'react'

import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'

import { useStats } from '@/context/Stats/client'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

export default function StatsPage() {
  const [isCalculating, setIsCalculating] = useState(false)
  const [isUpdatingGlobal, setIsUpdatingGlobal] = useState(false)
  const { toast } = useToast()
  const { refreshEntityStats, refreshGlobalStats } = useStats()

  const calculateStats = async () => {
    setIsCalculating(true)
    try {
      const response = await fetchWithAuth('/api/stats/calculate', {
        method: 'POST',
      })
      //   console.log('🚀 ~ calculateStats ~ response:', response)

      if (response.status !== 200) {
        throw new Error('Failed to calculate stats')
      }

      toast({
        title: 'Succès',
        description: 'Les statistiques ont été calculées et mises à jour',
      })

      // Rafraîchir les stats dans le context
      await refreshEntityStats()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du calcul des statistiques',
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const updateGlobalStats = async () => {
    setIsUpdatingGlobal(true)
    try {
      toast({
        title: 'Mise à jour en cours',
        description: 'Veuillez patienter...',
        duration: 3000,
      })

      await Promise.all([refreshEntityStats(true), refreshGlobalStats()])

      toast({
        variant: 'success',
        title: 'Mise à jour terminée',
        description:
          'Les statistiques globales ont été actualisées avec succès',
        duration: 3000,
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          'Une erreur est survenue lors de la mise à jour des statistiques',
        duration: 3000,
      })
    } finally {
      setIsUpdatingGlobal(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des statistiques</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Calcul automatique</h2>
          <p className="text-sm text-gray-500 mb-2">
            Lance le calcul automatique des statistiques basé sur les données
            récentes
          </p>
          <Button onClick={calculateStats} disabled={isCalculating}>
            {isCalculating
              ? 'Calcul en cours...'
              : 'Lancer le calcul automatique'}
          </Button>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Actualisation complète</h2>
          <p className="text-sm text-gray-500 mb-2">
            Force la mise à jour de toutes les statistiques (présence, notes,
            comportement)
          </p>
          <Button onClick={updateGlobalStats} disabled={isUpdatingGlobal}>
            {isUpdatingGlobal
              ? 'Actualisation en cours...'
              : 'Actualiser toutes les statistiques'}
          </Button>
        </div>
      </div>
    </div>
  )
}
