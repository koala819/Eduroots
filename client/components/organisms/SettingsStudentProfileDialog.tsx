'use client'

import { differenceInYears } from 'date-fns'
import { Star, TrendingUp } from 'lucide-react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import {
  Card,
  CardContent,
} from '@/client/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/client/components/ui/dialog'
import { Progress } from '@/client/components/ui/progress'
import { Separator } from '@/client/components/ui/separator'
import { cn } from '@/server/utils/helpers'
import { StudentStats } from '@/types/stats'
import { TeacherWithStudentsResponse } from '@/types/teacher-payload'
import { GenderEnum } from '@/types/user'

type TeacherStudent = TeacherWithStudentsResponse['courses'][0]['sessions'][0]['students'][0]

interface StudentWithDetails extends TeacherStudent {
  stats: StudentStats
}

interface StudentProfileDialogProps {
  student: StudentWithDetails
}

export function StudentProfileDialog({ student }: StudentProfileDialogProps) {
  const attendanceRate = 100 - (student.stats?.absencesRate || 0)

  function calculateAge(dateOfBirth: Date | null) {
    if (!dateOfBirth) return 0
    const currentDate = new Date()
    return differenceInYears(currentDate, dateOfBirth)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm"
          variant="default"
          // className='hover:cursor-pointer hover:bg-accent'
        >
            Voir détails
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Profil de {student.firstname} {student.lastname}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Informations détaillées sur l'étudiant et ses performances
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                student.gender === GenderEnum.Masculin
                  ? 'bg-info/10'
                  : 'bg-accent/10',
              )}>
                {student.gender === GenderEnum.Masculin ? (
                  <BiMale className="h-4 w-4 text-info" />
                ) : (
                  <BiFemale className="h-4 w-4 text-accent" />
                )}
              </div>
              Informations personnelles
            </h3>
            <Card className="border-border">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Prénom</span>
                    <p className="font-medium text-foreground">{student.firstname}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Nom</span>
                    <p className="font-medium text-foreground">{student.lastname}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Âge</span>
                    <p className="font-medium text-foreground">
                      {calculateAge(student.dateOfBirth)} ans
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Date de naissance
                    </span>
                    <p className="font-medium text-foreground">
                      {student.dateOfBirth
                        ? new Date(student.dateOfBirth).toLocaleDateString('fr-FR')
                        : 'Non renseignée'}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Email</span>
                  <p className="font-medium text-foreground">
                    {student.email || 'Non renseigné'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assiduité et participation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              Assiduité et participation
            </h3>
            <Card className="border-border">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total des absences
                  </span>
                  <Badge
                    variant={
                      (student.stats?.absencesCount || 0) > 3
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {student.stats?.absencesCount || 0} absence
                    {(student.stats?.absencesCount || 0) !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {student?.stats?.absencesCount && student.stats.absencesCount > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground block">
                      Dates des absences
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {student?.stats?.absences.map((absence, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {absence.date
                            ? new Date(absence.date).toLocaleDateString('fr-FR')
                            : 'Date inconnue'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Taux de présence
                    </span>
                    <span className={cn(
                      'font-semibold',
                      attendanceRate > 90 ? 'text-success' :
                        attendanceRate > 80 ? 'text-warning' : 'text-error',
                    )}>
                      {attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={attendanceRate}
                    className="h-3"
                  />
                </div>

                <Separator />

                <div>
                  <span className="text-sm text-muted-foreground block mb-1">
                    Dernière activité
                  </span>
                  <p className="font-medium text-foreground">
                    {student.stats?.lastActivity
                      ? new Date(student.stats.lastActivity)
                        .toLocaleDateString('fr-FR')
                      : 'Aucune activité'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comportement et résultats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-warning" />
              </div>
              Comportement et résultats
            </h3>
            <Card className="border-border">
              <CardContent className="pt-6 space-y-4">
                {student?.stats?.behaviorAverage !== null &&
                student?.stats?.behaviorAverage !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Note de comportement
                      </span>
                      <span className="font-semibold text-foreground">
                        {student.stats.behaviorAverage.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'w-5 h-5 transition-colors',
                            star <= Math.round(student.stats?.behaviorAverage || 0)
                              ? 'text-warning fill-warning'
                              : 'text-muted',
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <span className="text-sm text-muted-foreground block">
                    Notes par matière
                  </span>

                  {student.stats?.grades?.bySubject && (
                    <div className="space-y-3">
                      {Object.entries(student.stats.grades.bySubject)
                        .filter(
                          ([key, value]) =>
                            key !== 'overallAverage' &&
                            typeof value === 'object' &&
                            value !== null &&
                            'average' in value,
                        )
                        .map(([subject, gradeData]) => {
                          const average = (gradeData as {average: number}).average
                          return (
                            <div
                              key={subject}
                              className="flex items-center justify-between p-2 rounded-lg
                              bg-muted/30"
                            >
                              <span className="text-sm font-medium text-foreground
                              truncate max-w-[60%]">
                                {subject}
                              </span>
                              <Badge
                                variant={average >= 10 ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {average.toFixed(1)}/20
                              </Badge>
                            </div>
                          )
                        })}

                      {student.stats?.grades.overallAverage !== undefined && (
                        <div className="flex items-center justify-between p-3 rounded-lg
                         bg-primary/5 border border-primary/20">
                          <span className="text-sm font-semibold text-foreground">
                            Moyenne générale
                          </span>
                          <Badge
                            variant={
                              student.stats?.grades.overallAverage >= 10
                                ? 'default'
                                : 'destructive'
                            }
                            className="text-base px-3 py-1"
                          >
                            {student.stats?.grades.overallAverage.toFixed(1)}/20
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <DialogClose asChild>
            <Button
              variant="destructive"
            >
              Fermer
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
