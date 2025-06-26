'use client'

import { AlertTriangle, ArrowUpDown, Calendar, TrendingUp, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { InterfaceHighRiskStudentData } from '@/app/admin/highRiskAbsenceStudents/page'
import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'
import { StudentAbsenceCard } from '@/server/components/admin/atoms/StudentAbsenceCard'

interface HighRiskAbsenceStudentsProps {
  initialData: {
    students: InterfaceHighRiskStudentData[]
    totalCount: number
    error?: string
  }
}

type SortType = 'risk-level' | 'absences-desc' | 'recent-absence' | 'alphabetical'

export const HighRiskAbsenceStudents = ({ initialData }: HighRiskAbsenceStudentsProps) => {
  const [sortType, setSortType] = useState<SortType>('risk-level')

  // Fonction de tri
  const sortedStudents = useMemo(() => {
    return [...initialData.students].sort((a, b) => {
      let lastNameComparison: number

      switch (sortType) {
      case 'risk-level':
        if (a.riskLevel !== b.riskLevel) {
          return a.riskLevel === 'critical' ? -1 : 1
        }
        return b.stats.absencesCount - a.stats.absencesCount

      case 'absences-desc':
        return b.stats.absencesCount - a.stats.absencesCount

      case 'recent-absence':
        if (!a.lastAbsenceDate && !b.lastAbsenceDate) return 0
        if (!a.lastAbsenceDate) return 1
        if (!b.lastAbsenceDate) return -1
        return new Date(b.lastAbsenceDate).getTime() - new Date(a.lastAbsenceDate).getTime()

      case 'alphabetical':
        lastNameComparison = a.student.lastname.localeCompare(b.student.lastname)
        return lastNameComparison === 0
          ? a.student.firstname.localeCompare(b.student.firstname)
          : lastNameComparison

      default:
        return 0
      }
    })
  }, [initialData.students, sortType])

  // Statistiques calculées
  const stats = useMemo(() => {
    const criticalCount = initialData.students.filter((s) => s.riskLevel === 'critical').length
    const highCount = initialData.students.filter((s) => s.riskLevel === 'high').length
    const totalAbsences = initialData.students.reduce((sum, s) => sum + s.stats.absencesCount, 0)
    const avgAbsences = initialData.students.length > 0 ? Math
      .round(totalAbsences / initialData.students.length) : 0

    return { criticalCount, highCount, totalAbsences, avgAbsences }
  }, [initialData.students])

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pt-6">
        <div className="space-y-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Étudiants à risque élevé d'absences
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Surveillance des étudiants avec un nombre d'absences multiple de 3
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 shadow-sm">
                <ArrowUpDown className="h-4 w-4" />
                Trier par
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSortType('risk-level')}>
                Niveau de risque
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortType('absences-desc')}>
                Nombre d'absences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortType('recent-absence')}>
                Dernière absence
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortType('alphabetical')}>
                Ordre alphabétique
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Remplacement du badge arrondi par un design plus approprié */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100
          dark:bg-gray-800 rounded-lg border">
            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {initialData.students.length} étudiant{initialData.students.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques - réduites en taille */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-md
        hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-red-800">Risque critique</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-900">{stats.criticalCount}</div>
            <p className="text-xs text-red-700 mt-1">≥ 9 absences</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200
         shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-800">Risque élevé</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-900">{stats.highCount}</div>
            <p className="text-xs text-orange-700 mt-1">3-8 absences</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200
        shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-800">
              Moyenne absences
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900">{stats.avgAbsences}</div>
            <p className="text-xs text-purple-700 mt-1">par étudiant</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des étudiants - cartes plus compactes */}
      {sortedStudents.length === 0 ? (
        <Card className="bg-gray-50 border-gray-200">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun étudiant à risque
            </h3>
            <p className="text-gray-600 text-base max-w-md">
              Aucun étudiant avec un nombre d'absences multiple de 3 n'a été trouvé.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedStudents.map(({ student, stats, riskLevel }) => (
            <div key={student.id} className="relative group">
              {/* Badge de risque - plus petit et mieux positionné */}
              <div className="absolute -top-2 -right-2 z-20">
                <Badge
                  className={`px-2 py-1 text-xs font-semibold shadow-md ${
                    riskLevel === 'critical'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                  }`}
                >
                  {riskLevel === 'critical' ? 'Critique' : 'Élevé'}
                </Badge>
              </div>

              {/* Carte avec bordure colorée selon le risque - plus compacte */}
              <div
                className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-lg
                transition-all duration-300 transform hover:-translate-y-1 ${
            riskLevel === 'critical'
              ? 'border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white'
              : 'border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white'
            }`}
              >
                <StudentAbsenceCard student={student} stats={stats} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
