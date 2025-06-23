'use client'

import { BarChart, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useEffect,useState } from 'react'

import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { useStats } from '@/client/context/stats'
import { useToast } from '@/client/hooks/use-toast'

interface UpdateStatus {
  isUpdating: boolean
  success: boolean | null
  message: string
  details?: {
    studentsUpdated?: number
    globalStatsUpdated?: boolean
    errors?: string[]
  }
}

const UpdateStatsPage = () => {
  const { toast } = useToast()
  const { refreshTeacherStudentsStats, refreshGlobalStats } = useStats()
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    isUpdating: false,
    success: null,
    message: '',
  })

  // État pour le timer de limitation
  const [isBlocked, setIsBlocked] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  // Vérifier si une mise à jour récente a été effectuée
  useEffect(() => {
    const lastUpdateTime = localStorage.getItem('lastStatsUpdate')
    if (lastUpdateTime) {
      const timeDiff = Date.now() - parseInt(lastUpdateTime)
      const oneHour = 60 * 60 * 1000 // 1 heure en millisecondes

      if (timeDiff < oneHour) {
        setIsBlocked(true)
        setTimeRemaining(oneHour - timeDiff)
      }
    }
  }, [])

  // Timer pour décompter le temps restant
  useEffect(() => {
    if (!isBlocked || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          setIsBlocked(false)
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isBlocked, timeRemaining])

  // Formater le temps restant
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleUpdateStats = async () => {
    setUpdateStatus({
      isUpdating: true,
      success: null,
      message: 'Mise à jour en cours...',
    })

    try {
      const errors: string[] = []
      let studentsUpdated = 0
      let globalStatsUpdated = false

      // Mise à jour des statistiques des élèves
      try {
        const studentsResult: any = await refreshTeacherStudentsStats(true)
        if (
          studentsResult &&
          studentsResult.data &&
          Array.isArray(studentsResult.data.studentStats)
        ) {
          studentsUpdated = studentsResult.data.studentsUpdated
        }
      } catch (error: any) {
        errors.push(`Élèves: ${error.message}`)
      }

      // Mise à jour des statistiques globales
      try {
        await refreshGlobalStats()
        globalStatsUpdated = true
      } catch (error: any) {
        errors.push(`Global: ${error.message}`)
      }

      // Déterminer le statut final
      const hasErrors = errors.length > 0
      const hasSuccess = studentsUpdated > 0 || globalStatsUpdated

      setUpdateStatus({
        isUpdating: false,
        success: hasSuccess && !hasErrors,
        message: hasErrors
          ? `Mise à jour partielle avec ${errors.length} erreur(s)`
          : 'Mise à jour terminée avec succès',
        details: {
          studentsUpdated,
          globalStatsUpdated,
          errors: hasErrors ? errors : undefined,
        },
      })

      // Enregistrer le timestamp de la mise à jour
      localStorage.setItem('lastStatsUpdate', Date.now().toString())

      // Bloquer pour 1 heure
      setIsBlocked(true)
      setTimeRemaining(60 * 60 * 1000) // 1 heure

      // Toast approprié
      if (hasErrors) {
        toast({
          variant: 'destructive',
          title: 'Mise à jour partielle',
          description: `${errors.length} erreur(s) lors de la mise à jour`,
          duration: 5000,
        })
      } else {
        toast({
          variant: 'success',
          title: 'Mise à jour réussie',
          description: `Statistiques mises à jour (${studentsUpdated} élèves)`,
          duration: 3000,
        })
      }

    } catch (error: any) {
      setUpdateStatus({
        isUpdating: false,
        success: false,
        message: `Erreur: ${error.message}`,
        details: {
          errors: [error.message],
        },
      })

      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
        duration: 5000,
      })
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Carte principale */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Actualisation des statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Met à jour toutes les statistiques (présence, notes, comportement)
              pour tous les élèves. Cette opération peut prendre plusieurs minutes.
            </p>

            {isBlocked && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Mise à jour récente effectuée</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Pour éviter la surcharge du système, veuillez patienter avant la
                  prochaine mise à jour.
                </p>
                <p className="text-sm font-mono text-amber-800 mt-2">
                  Temps restant : {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            )}

            <Button
              onClick={handleUpdateStats}
              disabled={updateStatus.isUpdating || isBlocked}
              className="w-full sm:w-auto"
            >
              {updateStatus.isUpdating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Mise à jour en cours...
                </>
              ) : isBlocked ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Mise à jour temporairement désactivée
                </>
              ) : (
                <>
                  <BarChart className="h-4 w-4 mr-2" />
                  Lancer la mise à jour
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Statut de la mise à jour */}
        {updateStatus.success !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {updateStatus.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Statut de la mise à jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{updateStatus.message}</p>

              {updateStatus.details && (
                <div className="space-y-2 text-sm">
                  {updateStatus.details.studentsUpdated !== undefined && (
                    <p>
                      <span className="font-medium">Élèves mis à jour :</span>{' '}
                      {updateStatus.details.studentsUpdated}
                    </p>
                  )}

                  {updateStatus.details.globalStatsUpdated !== undefined && (
                    <p>
                      <span className="font-medium">Statistiques globales :</span>{' '}
                      {updateStatus.details.globalStatsUpdated
                        ? 'Mises à jour'
                        : 'Non mises à jour'}
                    </p>
                  )}

                  {updateStatus.details.errors && updateStatus.details.errors.length > 0 && (
                    <div>
                      <p className="font-medium text-red-600 mb-2">
                        Erreurs rencontrées :
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-red-600">
                        {updateStatus.details.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default UpdateStatsPage
