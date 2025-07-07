'use client'

import { Award, Book, Calendar, GraduationCap, Star } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { formatDayOfWeek } from '@/client/utils/timeSlots'
import { getSubjectColors } from '@/server/utils/helpers'
import { LevelEnum } from '@/types/courses'
import { CourseSession, CourseSessionTimeslot } from '@/types/db'
import { StudentStats as StudentStatsType } from '@/types/stats'

interface SubjectGrade {
  subject: string
  average: number | string
  grades: number[]
}

type StudentStatsProps = {
  detailedGrades: StudentStatsType['grades']
  detailedAttendance: {
    absencesCount: number
    attendanceRate: number
  }
  detailedCourse: {
    sessions: (CourseSession & {
      timeSlot: CourseSessionTimeslot
    })[]
  }
  detailedTeacher: {
    firstname: string
    lastname: string
  }
  subjectGradesData: SubjectGrade[]
}

export const ChildStats = ({
  detailedGrades,
  detailedAttendance,
  detailedCourse,
  detailedTeacher,
  subjectGradesData,
}: Readonly<StudentStatsProps>) => {
  const teacherName =
    detailedTeacher?.lastname?.toUpperCase() + ' ' + detailedTeacher?.firstname || 'N/A'

  return (
    <div className="p-4 bg-background">
      <div className="flex flex-col space-y-6 max-w-6xl mx-auto">

        {/* Header avec titre et stats principales */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tableau de bord scolaire
          </h1>
          <p className="text-muted-foreground">
            Suivi de la progression et des performances
          </p>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Moyenne générale */}
          <Card className="group hover:shadow-xl transition-all duration-500
          border-0 bg-gradient-to-br from-primary to-primary-accent
          text-primary-foreground overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent
            via-white/10 to-transparent transform -skew-x-12 -translate-x-full
            group-hover:translate-x-full transition-transform duration-1000"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90">
                  Moyenne générale
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-white/20
                flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">
                  {typeof detailedGrades?.overallAverage === 'number'
                    ? detailedGrades.overallAverage.toFixed(1)
                    : 'N/A'}
                </div>
                <div className="text-sm opacity-80 mb-1">/ 20</div>
              </div>
            </CardContent>
          </Card>

          {/* Absences */}
          <Card className="group hover:shadow-xl transition-all duration-500
          border-0 bg-gradient-to-br from-warning to-warning-light
          text-warning-foreground overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent
            via-white/10 to-transparent transform -skew-x-12 -translate-x-full
            group-hover:translate-x-full transition-transform duration-1000"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90">Absences</CardTitle>
                <div className="w-10 h-10 rounded-full bg-white/20
                flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">
                  {detailedAttendance?.absencesCount ?? 'N/A'}
                </div>
                <div className="text-sm opacity-80 mb-1">
                  {detailedAttendance?.absencesCount &&
                   detailedAttendance?.absencesCount > 2
                    ? 'Journées'
                    : 'Journée'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taux de présence */}
          <Card className="group hover:shadow-xl transition-all duration-500
          border-0 bg-gradient-to-br from-secondary to-secondary-light
          text-secondary-foreground overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent
            via-white/10 to-transparent transform -skew-x-12 -translate-x-full
            group-hover:translate-x-full transition-transform duration-1000"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90">
                  Taux de présence
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-white/20
                flex items-center justify-center">
                  <Star className="h-5 w-5 text-star fill-star" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">
                  {detailedAttendance?.attendanceRate
                    ? `${detailedAttendance.attendanceRate.toFixed(1)}%`
                    : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations détaillées */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Informations de classe */}
          <Card className="hover:shadow-lg transition-all duration-300
          border-border bg-background hover:border-accent group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10
                flex items-center justify-center group-hover:bg-accent/20
                transition-colors duration-300">
                  <Book className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-lg text-foreground">
                  Informations de classe
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg
                bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                  <span className="text-sm font-medium text-muted-foreground">
                    Niveau
                  </span>
                  <span className="font-semibold text-foreground">
                    {(detailedCourse?.sessions?.[0]?.level as LevelEnum) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg
                bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                  <span className="text-sm font-medium text-muted-foreground">
                    Enseignant
                  </span>
                  <span className="font-semibold text-foreground">
                    {teacherName}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg
                bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                  <span className="text-sm font-medium text-muted-foreground">
                    Jour de cours
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatDayOfWeek(
                      (detailedCourse?.sessions?.[0]?.timeSlot?.day_of_week) ||
                      'N/A',
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes par matière */}
          <Card className="hover:shadow-lg transition-all duration-300
          border-border bg-background hover:border-success group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10
                flex items-center justify-center group-hover:bg-success/20
                transition-colors duration-300">
                  <GraduationCap className="h-5 w-5 text-success" />
                </div>
                <CardTitle className="text-lg text-foreground">
                  Notes par matière
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {subjectGradesData.map((subjectData, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border border-border
                    hover:border-primary transition-all duration-300
                    ${index !== subjectGradesData.length - 1 ? 'mb-4' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-3 py-1 rounded-sm text-sm font-extrabold
                      w-full max-w-[280px] text-center transition-all duration-200
                      hover:scale-105 hover:shadow-md
                      ${getSubjectColors(subjectData.subject)}`}>
                        {subjectData.subject}
                      </span>
                      <span className="text-lg font-bold text-foreground ml-4">
                        {typeof subjectData.average === 'number'
                          ? `${subjectData.average.toFixed(1)}/20`
                          : subjectData.average}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {subjectData.grades.map((grade, gradeIndex) => (
                        <div
                          key={gradeIndex}
                          className={`px-2.5 py-1 rounded-xs text-sm font-medium
                          transition-all duration-200 hover:scale-110 hover:shadow-sm
                          ${getSubjectColors(subjectData.subject)}`}
                        >
                          {grade}/20
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
