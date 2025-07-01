'use client'

import { BookOpen, GraduationCap, Users } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent } from '@/client/components/ui/card'
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
import { formatDayOfWeek } from '@/client/utils/timeSlots'
import { getStudentsByTeacher } from '@/server/actions/api/teachers'
import { cn } from '@/server/utils/helpers'
import { TimeSlotEnum } from '@/types/courses'
import { TeacherResponse, TeacherWithStudentsResponse } from '@/types/teacher-payload'

interface TeacherStats {
  totalStudents: number
  totalCourses: number
  totalSessions: number
  averageAttendance: number
  genderDistribution: {
    male: number
    female: number
    malePercentage: number
    femalePercentage: number
  }
  subjects: string[]
}

interface TeacherProfileDialogProps {
  teacher: TeacherResponse
  trigger?: React.ReactNode
}

// Fonction utilitaire pour formater les heures sans les secondes
const formatTime = (time: string): string => {
  if (!time) return ''
  // Si l'heure contient des secondes (format HH:MM:SS), les supprimer
  if (time.includes(':') && time.split(':').length === 3) {
    return time.substring(0, 5) // Garder seulement HH:MM
  }
  return time
}

export function TeacherProfileDialog({ teacher, trigger }: TeacherProfileDialogProps) {
  const [teacherData, setTeacherData] = useState<TeacherWithStudentsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<TeacherStats | null>(null)

  const loadTeacherData = async () => {
    if (!teacher.id || teacherData) return

    setIsLoading(true)
    try {
      const response = await getStudentsByTeacher(teacher.id)
      if (response.success && response.data) {
        setTeacherData(response.data)
        calculateStats(response.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du professeur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (data: TeacherWithStudentsResponse) => {
    let totalStudents = 0
    let totalSessions = 0
    let totalAttendance = 0
    let attendanceCount = 0
    let maleCount = 0
    let femaleCount = 0
    const subjectsSet = new Set<string>()

    // Compter les étudiants uniques et calculer les statistiques
    const uniqueStudents = new Set<string>()

    data.courses.forEach((course) => {
      course.sessions.forEach((session) => {
        totalSessions++
        subjectsSet.add(session.subject)

        session.students.forEach((student) => {
          uniqueStudents.add(student.id)

          // Compter par genre
          const gender = student.gender?.toLowerCase()
          if (gender === 'masculin' || gender === 'male' || gender === 'm') {
            maleCount++
          } else if (gender === 'féminin' || gender === 'female' || gender === 'f') {
            femaleCount++
          }
        })

        // Simuler un taux de présence (à remplacer par de vraies données)
        totalAttendance += 85 // Valeur par défaut
        attendanceCount++
      })
    })

    totalStudents = uniqueStudents.size
    const averageAttendance = attendanceCount > 0 ? totalAttendance / attendanceCount : 0

    setStats({
      totalStudents,
      totalCourses: data.courses.length,
      totalSessions,
      averageAttendance,
      genderDistribution: {
        male: maleCount,
        female: femaleCount,
        malePercentage: totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 0,
        femalePercentage: totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 0,
      },
      subjects: Array.from(subjectsSet),
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="default">
            Voir détails
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
            Profil de {teacher.firstname} {teacher.lastname}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            Informations détaillées sur l'enseignant et ses classes
          </DialogDescription>
        </DialogHeader>

        {isLoading && !teacherData && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6"
          onClick={loadTeacherData}
        >
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3
              className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              Informations personnelles
            </h3>
            <Card className="border-border">
              <CardContent className="pt-4 sm:pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Prénom</span>
                    <p className="font-medium text-foreground">{teacher.firstname}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Nom</span>
                    <p className="font-medium text-foreground">{teacher.lastname}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Email</span>
                  <p className="font-medium text-foreground break-words">{teacher.email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground mr-2">Statut</span>
                  <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                    {teacher.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                {teacher.subjects && teacher.subjects.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      Matières enseignées
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.map((subject, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistiques des classes */}
          <div className="space-y-4">
            <h3
              className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-success" />
              </div>
              Classes et étudiants
            </h3>
            <Card className="border-border">
              <CardContent className="pt-4 sm:pt-6 space-y-4">
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 rounded-lg bg-primary/5">
                        <p className="text-xl sm:text-2xl font-bold text-primary">
                          {stats.totalStudents}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Étudiants</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/5">
                        <p className="text-xl sm:text-2xl font-bold text-secondary">
                          {stats.totalCourses}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Cours</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Répartition par genre</span>
                      <div className="space-y-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs sm:text-sm mb-1">
                            <span className="text-info-dark">
                              Garçons ({stats.genderDistribution.male})
                            </span>
                            <span className="text-info-dark">
                              {stats.genderDistribution.malePercentage}%
                            </span>
                          </div>
                          <Progress
                            value={stats.genderDistribution.malePercentage}
                            className="h-2"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs sm:text-sm mb-1">
                            <span className="text-pink">
                              Filles ({stats.genderDistribution.female})
                            </span>
                            <span className="text-pink">
                              {stats.genderDistribution.femalePercentage}%
                            </span>
                          </div>
                          <Progress
                            value={stats.genderDistribution.femalePercentage}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Taux de présence moyen</span>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'font-semibold',
                          stats.averageAttendance > 90 ? 'text-success' :
                            stats.averageAttendance > 80 ? 'text-warning' : 'text-error',
                        )}>
                          {stats.averageAttendance.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={stats.averageAttendance} className="h-3" />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                        Cliquez pour charger les statistiques
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sessions et planning */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <h3
              className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-warning" />
              </div>
              Planning et cours
            </h3>
            <Card className="border-border">
              <CardContent className="pt-4 sm:pt-6 space-y-4">
                {teacherData ? (
                  <>
                    <div className="space-y-3">
                      <span className="text-sm text-muted-foreground block">
                        Cours
                      </span>
                      {teacherData.courses.map((course, index) => (
                        <div key={index} className="p-3 rounded-lg bg-muted/30">
                          <div
                            className="flex flex-col sm:flex-row sm:items-center
                            sm:justify-between mb-2 gap-2"
                          >
                            <span className="font-medium text-foreground">
                              Année {course.academicYear}
                            </span>
                            <Badge variant="outline" className="text-xs w-fit">
                              {course.sessions.length} session
                              {course.sessions.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {course.sessions.map((session, sessionIndex) => (
                              <div key={sessionIndex} className="text-sm">
                                <div
                                  className="flex flex-col sm:flex-row sm:items-center
                                   sm:justify-between gap-1"
                                >
                                  <span className="text-foreground">
                                    {session.subject} - Niveau {session.level}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {session.students.length} élève
                                    {session.students.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                                {session.timeSlot && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {formatDayOfWeek(session.timeSlot as TimeSlotEnum)} •{' '}
                                    {formatTime(session.startTime ?? '')} -{' '}
                                    {formatTime(session.endTime ?? '')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Chargez les données pour voir le planning
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <DialogClose asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              Fermer
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
