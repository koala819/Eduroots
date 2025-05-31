'use client'

import { ClipboardList, Star } from 'lucide-react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { GenderEnum } from '@/types/user'

import { StudentWithDetails as StudentType } from '@/components/organisms/client/ProfileCourseCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'

import { cn, convertToDate, getColorClass } from '@/lib/utils'
import { differenceInYears, parseISO } from 'date-fns'

interface DesktopClassViewProps {
  students: StudentType[]
}

export const ClassOverview = ({ students }: DesktopClassViewProps) => {
  const sortedStudents = [...students].sort((a, b) => a.firstname.localeCompare(b.firstname))
  function getBorderColorClass(absences: number): string {
    if (absences === 0) {
      return 'border-l-[6px] border-or'
    }
    switch (absences % 3) {
    case 1:
      return 'border-l-[6px] border-argent'
    case 2:
      return 'border-l-[6px] border-bronze'
    case 0:
      return 'border-l-[6px] border-inferno'
    default:
      return 'border-l-[6px] border-gray-500'
    }
  }

  // Fonction pour générer la classe CSS de la note
  function getGradeColorClass(grade: number) {
    if (grade >= 16) return 'text-green-600'
    if (grade >= 14) return 'text-blue-600'
    if (grade >= 12) return 'text-teal-600'
    if (grade >= 10) return 'text-amber-600'
    return 'text-red-600'
  }

  function calculateAge(dateOfBirth: string) {
    const birthDate = parseISO(dateOfBirth)

    const currentDate = new Date()
    const age = differenceInYears(currentDate, birthDate)

    return age
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sortedStudents.map((student) => {
          const attendanceRate = 100 - (student.stats?.absencesRate || 0)

          console.log('📊 Données reçues dans ClassOverview pour l\'étudiant', student._id, {
            student,
            stats: student.stats,
            attendanceRate,
            behaviorAverage: student.stats?.behaviorAverage,
            behaviorAverageType: typeof student.stats?.behaviorAverage,
          })

          return (
            <Card
              key={student._id}
              className={cn(getBorderColorClass(student.stats?.absencesCount || 0))}
            >
              <CardHeader>
                <CardTitle className="flex gap-2">
                  {student.gender === GenderEnum.Masculin ? (
                    <div className="flex items-center gap-1 text-blue-500">
                      <BiMale className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-pink-500">
                      <BiFemale className="h-5 w-5" />
                    </div>
                  )}
                  <span className="font-medium text-lg leading-tight">
                    {student.firstname} {student.lastname}
                  </span>
                </CardTitle>
                <CardDescription>{calculateAge(student.dateOfBirth || '')} ans</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Absences et taux de présence */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-500">Absences</span>
                      <span className="text-xs font-medium">{student.stats.absencesCount}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          student.stats.absencesCount > 5
                            ? 'bg-red-500'
                            : student.stats.absencesCount > 2
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min((student.stats.absencesCount / 10) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-500">Taux de présence</span>
                      <span
                        className={`text-xs font-medium ${
                          100 - student.stats.absencesRate > 80
                            ? 'text-green-600'
                            : 100 - student.stats.absencesRate > 60
                              ? 'text-orange-500'
                              : 'text-red-500'
                        }`}
                      >
                        {(100 - student.stats.absencesRate).toFixed(1)}%
                        <span className="text-gray-400 ml-1">
                          ({student.stats.absencesCount}/
                          {Math.round(
                            student.stats.absencesCount / (student.stats.absencesRate / 100),
                          )}
                          )
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          100 - student.stats.absencesRate > 80
                            ? 'bg-green-500'
                            : 100 - student.stats.absencesRate > 60
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                        }`}
                        style={{
                          width: `${100 - student.stats.absencesRate}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                {/* Comportement */}
                <div className="flex space-x-3 mt-2">
                  {student.stats?.behaviorAverage !== undefined && (
                    <div className="flex items-center gap-1">
                      <p className="text-gray-500">Comportement</p>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= Math.round(student.stats?.behaviorAverage || 0)
                                ? 'text-yellow-400 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(student.stats?.behaviorAverage || 0)}/5
                      </span>
                    </div>
                  )}
                </div>
                {/* Notes: moyenne générale */}
                {student.stats?.grades?.overallAverage !== undefined && (
                  <div className="flex items-center gap-1 my-4">
                    <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
                    <p className="text-gray-500">Moyenne générale</p>
                    <span
                      className={`font-medium
                        ${getGradeColorClass(student.stats?.grades?.overallAverage)}`}
                    >
                      {student.stats?.grades?.overallAverage.toFixed(1)}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="w-full flex justify-center">
                      <Button className={cn(getColorClass(student.stats?.absencesCount || 0))}>
                        Details
                      </Button>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle />
                      <DialogDescription>
                        Consultez le profil de l&apos;étudiant. Cliquez sur Fermer quand vous avez
                        terminé.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {/* Section d'informations personnelles */}
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Informations personnelles</h2>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div>
                                <span className="text-sm text-gray-500">Nom complet</span>
                                <p className="font-medium">
                                  {student.firstname} {student.lastname}
                                </p>
                              </div>

                              <div>
                                <span className="text-sm text-gray-500">Âge</span>
                                <p className="font-medium">
                                  {calculateAge(student.dateOfBirth || '')} ans
                                </p>
                              </div>

                              <div>
                                <span className="text-sm text-gray-500">Date de naissance</span>
                                <p className="font-medium">
                                  {student.dateOfBirth
                                    ? new Date(student.dateOfBirth).toLocaleDateString()
                                    : 'Non renseignée'}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Email</span>
                                <p className="font-medium">{student.email || 'Non renseigné'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Section assiduité et participation */}
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Assiduité et participation</h2>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-500">Absences</span>
                              <Badge
                                variant={
                                  student.stats?.absencesCount || 0 > 3
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {student.stats?.absencesCount || 0} absence
                                {student.stats?.absencesCount !== 1 ? 's' : ''}
                              </Badge>
                            </div>

                            {student?.stats?.absencesCount && student.stats.absencesCount > 0 && (
                              <div className="mt-2">
                                <span className="text-sm text-gray-500 block mb-1">
                                  Date des absences
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {student?.stats?.absences.map((absence, index) => (
                                    <Badge key={index} variant="outline">
                                      {absence.date
                                        ? convertToDate(absence.date).toLocaleDateString()
                                        : 'Date inconnue'}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {student.stats?.absencesRate !== null &&
                              student.stats?.absencesRate !== undefined && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-500">Taux de présence</span>
                                  <span className="font-medium">
                                    {attendanceRate.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress
                                  value={attendanceRate}
                                  className="h-2"
                                  color={attendanceRate > 80 ? 'bg-green-500' : 'bg-amber-500'}
                                />
                              </div>
                            )}

                            <Separator className="my-3" />

                            <div>
                              <span className="text-sm text-gray-500 block mb-1">
                                Dernière activité
                              </span>
                              <p className="font-medium">
                                {student.stats?.lastActivity
                                  ? convertToDate(student.stats?.lastActivity).toLocaleDateString()
                                  : 'Aucune activité'}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Section comportement et résultats */}
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Comportement et résultats</h2>
                        <Card>
                          <CardContent className="pt-6">
                            {student?.stats?.behaviorAverage !== null &&
                              student?.stats?.behaviorAverage !== undefined && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-500">
                                      Note de comportement
                                  </span>
                                  <span className="font-medium">
                                    {student.stats.behaviorAverage}
                                      /5
                                  </span>
                                </div>
                                <div className="flex items-center mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`w-5 h-5 ${
                                        star <= Math.round(student.stats?.behaviorAverage || 0)
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07
                                       3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588
                                       1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07
                                       3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0
                                       00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.
                                       118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.
                                       57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Separator className="my-3" />

                            <span className="text-sm text-gray-500 block mb-2">
                              Notes par matière
                            </span>

                            {student.stats?.grades.bySubject && (
                              <div className="space-y-2">
                                {/* Affichage des matières */}
                                {Object.entries(student.stats.grades.bySubject)
                                  .filter(
                                    ([key, value]) =>
                                      key !== 'overallAverage' &&
                                      typeof value === 'object' &&
                                      value !== null &&
                                      'average' in value,
                                  )
                                  .map(([subject, gradeData]) => {
                                    return (
                                      <div
                                        key={subject}
                                        className="flex items-center justify-between"
                                      >
                                        <span className="text-sm text-black truncate max-w-[70%]">
                                          {subject}
                                        </span>
                                        <Badge
                                          variant={
                                            (gradeData as {average: number}).average >= 10
                                              ? 'default'
                                              : 'destructive'
                                          }
                                        >
                                          {(gradeData as {average: number}).average.toFixed(1)}
                                          /20
                                        </Badge>
                                      </div>
                                    )
                                  })}

                                {student.stats?.grades.overallAverage !== undefined && (
                                  <div className="flex items-center justify-between
                                  pt-2 border-t mt-2">
                                    <span className="text-sm font-medium text-black">
                                      Moyenne générale
                                    </span>
                                    <Badge
                                      variant={
                                        student.stats?.grades.overallAverage >= 10
                                          ? 'default'
                                          : 'destructive'
                                      }
                                      className="text-lg px-2 py-1"
                                    >
                                      {student.stats?.grades.overallAverage.toFixed(1)}
                                      /20
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <DialogFooter className="mt-6">
                      <DialogClose asChild>
                        <Button variant="destructive">Fermer</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
