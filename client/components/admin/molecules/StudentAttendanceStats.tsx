'use client'

import { CalendarDays, Check, TrendingUp, Users, X } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { CalculatedStats } from '@/server/actions/admin/student-stats-attendances'
import { SubjectNameEnum } from '@/types/courses'

interface StudentAttendanceStatsClientProps {
  stats: CalculatedStats
}

export function StudentAttendanceStatsClient(
  { stats }: Readonly<StudentAttendanceStatsClientProps>) {
  // Calculer le statut de présence
  const attendanceStatus =
    stats.presenceRate >= 90
      ? { color: 'text-green-500', text: 'Excellent' }
      : stats.presenceRate >= 75
        ? { color: 'text-yellow-500', text: 'Satisfaisant' }
        : { color: 'text-red-500', text: 'À améliorer' }

  return (
    <div className="space-y-3">
      {/* Carte principale avec le taux de présence */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Vue d&apos;ensemble</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="flex flex-col items-center justify-center p-4">
            <div className={`text-4xl font-bold ${attendanceStatus.color}`}>
              {stats.presenceRate.toFixed(1)}%
            </div>
            <p className={`text-sm mt-2 ${attendanceStatus.color}`}>{attendanceStatus.text}</p>
          </div>

          {/* Période */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4" />
            <span>
              Du {stats.dates[0]} au {stats.dates[stats.dates.length - 1]}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques en grille */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2">
              <Users className="h-6 w-6 text-gray-400" />
              <p className="text-sm text-gray-600">Sessions</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2">
              <Check className="h-6 w-6 text-green-500" />
              <p className="text-sm text-gray-600">Présences</p>
              <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2">
              <X className="h-6 w-6 text-red-500" />
              <p className="text-sm text-gray-600">Absences</p>
              <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-500" />
              <p className="text-sm text-gray-600">Tendance</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.presenceRate > 75 ? '↗' : '↘'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des absences */}
      {stats.absenceDates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Historique des absences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(SubjectNameEnum).map((subject) => {
                const absencesForSubject = stats.absenceDates.filter(
                  (item) => item.subject === subject,
                )

                if (absencesForSubject.length === 0) return null

                return (
                  <div key={subject}>
                    <h3 className="font-medium mb-2">{subject}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {absencesForSubject.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3
                          bg-red-50 rounded-lg text-sm text-red-700"
                        >
                          <X className="h-4 w-4" />
                          {item.date}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dernières présences */}
      {stats.presentDates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Dernières présences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(SubjectNameEnum).map((subject) => {
                const presencesForSubject = stats.presentDates
                  .filter((item) => item.subject === subject)
                  .slice(-5)

                if (presencesForSubject.length === 0) return null

                return (
                  <div key={subject}>
                    <h3 className="font-medium mb-2">{subject}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {presencesForSubject.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3
                          bg-green-50 rounded-lg text-sm text-green-700"
                        >
                          <Check className="h-4 w-4" />
                          {item.date}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
