'use client'

import { Button } from '@/client/components/ui/button'
import { Card, CardContent } from '@/client/components/ui/card'
import { Progress } from '@/client/components/ui/progress'

interface EditActionsProps {
  stats: {
    completed: number
    total: number
    percent: number
    average: string
  }
  studentsCount: number
  loading: boolean
  onSubmit: () => void
}

export function EditActions({
  stats,
  studentsCount,
  loading,
  onSubmit,
}: EditActionsProps) {
  if (studentsCount === 0) return null

  return (
    <div className="space-y-6">
      {/* Statistiques récapitulatives */}
      <Card className="bg-background border-border">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Progression: {stats.completed}/{stats.total} élèves notés
              </span>
              <span className="text-muted-foreground">
                Moyenne: {stats.average}/20
              </span>
            </div>
            <Progress value={stats.percent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end items-center pt-6">

        <Button
          type="submit"
          onClick={onSubmit}
          disabled={loading}
          variant="default"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent
               rounded-full animate-spin" />
              Validation en cours...
            </div>
          ) : (
            'Valider les notes'
          )}
        </Button>
      </div>
    </div>
  )
}
