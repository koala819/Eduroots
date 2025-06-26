import {
  AlertTriangle,
  BarChart3,
  Calendar,
  FileText,
  GraduationCap,
  Info,
  Plus,
  Users,
} from 'lucide-react'
import { Suspense } from 'react'

import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader } from '@/client/components/ui/card'
import { HighRiskStudentsButton } from '@/server/components/admin/atoms/HighRiskStudentsButton'
import Loading from '@/server/components/admin/atoms/Loading'
import { SchoolPeople } from '@/server/components/admin/organisms/SchoolPeople'
import { cn } from '@/server/utils/helpers'

export const Dashboard = () => {
  return (
    <div className="space-y-6 p-4">
      {/* Actions rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-20 flex flex-col gap-2 hover:bg-primary/5"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs">Nouvel élève</span>
        </Button>

        <Button
          variant="outline"
          className="h-20 flex flex-col gap-2 hover:bg-secondary/5"
        >
          <GraduationCap className="w-5 h-5" />
          <span className="text-xs">Nouveau prof</span>
        </Button>

        <Button
          variant="outline"
          className="h-20 flex flex-col gap-2 hover:bg-accent/5"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-xs">Planning</span>
        </Button>

        <Button
          variant="outline"
          className="h-20 flex flex-col gap-2 hover:bg-purple/5"
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs">Rapports</span>
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Élèves</p>
                <p className="text-2xl font-bold text-primary">0</p>
              </div>
              <div className={cn(
                'w-10 h-10 rounded-lg bg-primary/10',
                'flex items-center justify-center',
              )}>
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profs</p>
                <p className="text-2xl font-bold text-secondary">0</p>
              </div>
              <div className={cn(
                'w-10 h-10 rounded-lg bg-secondary/10',
                'flex items-center justify-center',
              )}>
                <GraduationCap className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cours actifs</p>
                <p className="text-2xl font-bold text-accent">0</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-error">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertes</p>
                <p className="text-2xl font-bold text-error">0</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal en grille */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistiques détaillées */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Statistiques détaillées</h3>
              </div>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Loading name="des données" />}>
                <SchoolPeople />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Actions et alertes */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-error" />
                <h3 className="font-semibold">Alertes</h3>
              </div>
            </CardHeader>
            <CardContent>
              <HighRiskStudentsButton className="w-full" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer informatif */}
      <Card className="bg-muted/30">
        <CardContent className="flex items-center justify-center gap-3 py-4">
          <div className="w-6 h-6 rounded-md bg-info/10 flex items-center justify-center">
            <Info className="w-3 h-3 text-info" />
          </div>
          <span className="text-xs text-muted-foreground text-center">
            Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
