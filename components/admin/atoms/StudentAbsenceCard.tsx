import {
  Activity,
  AlertTriangle,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  Info,
  Mail,
  X,
} from 'lucide-react'

import { StudentStats } from '@/types/stats'
import { Student } from '@/types/user'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { convertToDate } from '@/lib/utils'
import { compareDesc, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { motion } from 'framer-motion'

interface StudentAbsenceCardProps {
  student: Student
  stats: StudentStats
}

export const StudentAbsenceCard = ({ student, stats }: StudentAbsenceCardProps) => {
  // Fonction pour formater la distance par rapport à maintenant
  function formatTimeToNow(date: Date | string | null): string {
    if (!date) return 'Jamais'

    const now = new Date()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const diff = now.getTime() - dateObj.getTime()

    // Convertir la différence en jours
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 7) return `Il y a ${days} jours`
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`
    if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`
    return `Il y a ${Math.floor(days / 365)} ans`
  }

  // Récupérer la dernière absence
  function getLastAbsence() {
    if (stats.absences.length === 0) return null
    return convertToDate(stats.absences[stats.absences.length - 1].date)
  }

  return (
    <Card className="w-full max-w-md overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-none bg-white dark:bg-gray-800 rounded-xl">
      <CardHeader className="pt-6 px-6 relative">
        <div className="flex justify-between items-start mb-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-4"
          >
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-1">
                {student.firstname} {student.lastname}
              </h2>
              <div className="flex items-center text-sm text-muted-foreground space-x-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate max-w-[180px]">{student.email}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="px-6">
        {/* Statistiques principales */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              <span>Absences</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">{stats.absencesCount}</span>
              <span className="text-sm text-muted-foreground">
                ({stats.absencesRate.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Activity className="h-4 w-4 mr-2 text-blue-500" />
              <span>Comportement</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-bold mr-2">{stats.behaviorAverage}</span>
              <div className="flex-1">
                <Progress value={stats.behaviorAverage * 20} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Dernière activité et absence */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-sm">
              <CalendarDays className="h-4 w-4 mr-2 text-primary" />
              <span>Dernière absence</span>
            </div>
            <motion.span
              className="font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {getLastAbsence() ? format(getLastAbsence()!, 'dd MMM yyyy', { locale: fr }) : 'Aucune'}
            </motion.span>
          </div>

          <div className="flex justify-between py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              <span>Dernière activité</span>
            </div>
            <span className="font-medium">
              {stats.lastActivity ? formatTimeToNow(convertToDate(stats.lastActivity)) : 'Jamais'}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" className="w-full gap-2 rounded-xl">
              <span>Voir les détails</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl">
            <DialogHeader className="px-6 pt-6 pb-4 bg-primary/5">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-xl tracking-tight">
                    {student.firstname} {student.lastname}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Analyse complète des absences et comportement
                  </DialogDescription>
                </div>
                <DialogClose className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>
            </DialogHeader>

            <Tabs defaultValue="absences" className="px-6 py-4">
              <TabsList className="mb-4 grid grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <TabsTrigger value="absences">Absences</TabsTrigger>
                <TabsTrigger value="statistics">Statistiques</TabsTrigger>
              </TabsList>

              <TabsContent value="absences" className="mt-0">
                <div className="max-h-80 overflow-y-auto pr-2 space-y-px">
                  {stats.absences.length > 0 ? (
                    [...stats.absences]
                      .sort((a, b) => compareDesc(convertToDate(a.date), convertToDate(b.date)))
                      .map((absence, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 mb-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-3 text-primary" />
                            <span>
                              {format(convertToDate(absence.date), 'EEEE dd MMMM yyyy', {
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <CalendarDays className="mx-auto h-8 w-8 mb-2 text-muted-foreground/40" />
                      <p>Aucune absence enregistrée</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="statistics" className="mt-0">
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <h3 className="text-sm font-medium mb-3">Résumé</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Taux d&apos;absence</p>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold">
                            {stats.absencesRate.toFixed(1)}%
                          </span>
                          <span className="text-xs ml-2 text-muted-foreground">sur 100 jours</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Comportement</p>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold">{stats.behaviorAverage}/5</span>
                          <span className="text-xs ml-2 text-muted-foreground">moyenne</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <h3 className="text-sm font-medium mb-4">
                      Tendance d&apos;absences (6 derniers mois)
                    </h3>
                    <div className="h-24 flex items-end justify-between px-2">
                      {(() => {
                        // Calculer les absences par mois sur les 6 derniers mois
                        const absencesByMonth = new Array(6).fill(0)
                        const today = new Date()

                        // Si nous n'avons pas d'absences, montrer un message
                        if (!stats.absences || stats.absences.length === 0) {
                          return (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">
                                Aucune donnée disponible
                              </span>
                            </div>
                          )
                        }

                        // Calculer le premier jour du mois il y a 5 mois
                        const sixMonthsAgo = new Date()
                        sixMonthsAgo.setMonth(today.getMonth() - 5)
                        sixMonthsAgo.setDate(1)
                        sixMonthsAgo.setHours(0, 0, 0, 0)

                        // Compter les absences par mois
                        stats.absences.forEach((absence) => {
                          const absenceDate = convertToDate(absence.date)

                          // Ignorer les absences antérieures à 6 mois
                          if (absenceDate < sixMonthsAgo) return

                          // Calculer l'index du mois (0 = il y a 5 mois, 5 = mois actuel)
                          const monthDiff = (today.getMonth() - absenceDate.getMonth() + 12) % 12

                          // Vérifier si cette absence est dans les 6 derniers mois
                          if (monthDiff < 6) {
                            const index = 5 - monthDiff // Inverser l'ordre pour afficher chronologiquement
                            absencesByMonth[index]++
                          }
                        })

                        // Trouver la valeur maximale pour normaliser la hauteur des barres
                        const maxAbsences = Math.max(...absencesByMonth, 1) // Au moins 1 pour éviter division par zéro

                        // Générer les étiquettes des mois
                        return absencesByMonth.map((count, index) => {
                          const date = new Date()
                          date.setMonth(date.getMonth() - 5 + index)
                          const monthNames = [
                            'Jan',
                            'Fév',
                            'Mar',
                            'Avr',
                            'Mai',
                            'Juin',
                            'Juil',
                            'Aoû',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Déc',
                          ]
                          const month = monthNames[date.getMonth()]

                          // Calculer la hauteur proportionnelle (entre 0px minimum et hauteur maximale)
                          const height =
                            count > 0 ? Math.max(4, Math.min(70, (count / maxAbsences) * 70)) : 0

                          return (
                            <div key={index} className="flex flex-col items-center space-y-1 group">
                              <div className="relative">
                                <div
                                  className="bg-primary/80 group-hover:bg-primary transition-colors rounded-t"
                                  style={{
                                    height: `${height}px`,
                                    width: '20px',
                                  }}
                                />
                                {count > 0 && (
                                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-primary text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {count}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{month}</span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
              <div className="w-full flex justify-between items-center">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mr-2" />
                  <span>Dernière mise à jour: aujourd&apos;hui</span>
                </div>
                <DialogClose asChild>
                  <Button variant="destructive">Fermer</Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
