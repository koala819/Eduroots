'use client'

import {useState} from 'react'

import {useToast} from '@/hooks/use-toast'

import {Button} from '@/components/ui/button'

import {useStats} from '@/context/Stats/client'
import {fetchWithAuth} from '@/lib/fetchWithAuth'

export default function StatsPage() {
  const [isCalculating, setIsCalculating] = useState(false)
  const {toast} = useToast()
  const {refreshEntityStats} = useStats()

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Calcul des statistiques</h1>
      <Button onClick={calculateStats} disabled={isCalculating}>
        {isCalculating ? 'Calcul en cours...' : 'Calculer les statistiques'}
      </Button>
    </div>
  )
}
