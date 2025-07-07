'use client'

import { AlertCircle, AlertTriangle, ArrowUpDown,Shield, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { LoadingContent } from '@/client/components/atoms/StatusContent'
import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'
import { SortType } from '@/server/actions/admin/student-high-risk'
import { StudentAbsenceCard } from '@/server/components/admin/atoms/StudentAbsenceCard'
import { HighRiskStudentData } from '@/types/stats'

interface HighRiskAbsenceStudentsProps {
  initialData: {
    students: HighRiskStudentData[]
    totalCount: number
    stats: {
      lowCount: number
      mediumCount: number
      highCount: number
      totalAbsences: number
    }
    error?: string
  }
}

export const HighRiskAbsenceStudents = ({ initialData }: HighRiskAbsenceStudentsProps) => {
  const [sortType, setSortType] = useState<SortType>('risk-level')

  // Vérifier si les données sont complètement chargées
  const isDataLoaded = initialData.students &&
    initialData.students.length > 0 &&
    initialData.students.every((student) =>
      student.stats && student.stats.absences !== undefined,
    )

  // Tri côté client pour l'interactivité
  const sortedStudents = useMemo(() => {
    if (!isDataLoaded) return []

    return [...initialData.students].sort((a, b) => {
      switch (sortType) {
      case 'risk-level': {
        const riskOrder = { high: 3, medium: 2, low: 1 }
        const aRisk = riskOrder[a.riskLevel]
        const bRisk = riskOrder[b.riskLevel]

        if (aRisk !== bRisk) {
          return bRisk - aRisk // Élevé en premier
        }
        return b.stats.absencesCount - a.stats.absencesCount
      }

      case 'recent-absence': {
        if (!a.lastAbsenceDate && !b.lastAbsenceDate) return 0
        if (!a.lastAbsenceDate) return 1
        if (!b.lastAbsenceDate) return -1
        return new Date(b.lastAbsenceDate).getTime() - new Date(a.lastAbsenceDate).getTime()
      }

      case 'alphabetical': {
        const lastNameComparison = a.student.lastname.localeCompare(b.student.lastname)
        return lastNameComparison === 0
          ? a.student.firstname.localeCompare(b.student.firstname)
          : lastNameComparison
      }

      default:
        return 0
      }
    })
  }, [initialData.students, sortType, isDataLoaded])

  if (!isDataLoaded) {
    return <LoadingContent />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center
      gap-6 pt-6">
        <div className="space-y-3">
          <h1 className="text-2xl lg:text-3xl font-bold">
            <span className="text-5xl font-bold text-error mr-2">
              {initialData.students.length}
            </span>
            Etudiants avec absences multiples de 3
          </h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" className="flex gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Trier par
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-42 bg-info-foreground">
            <DropdownMenuItem onClick={() => setSortType('risk-level')}>
              Niveau de risque
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortType('recent-absence')}>
              Dernière absence
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortType('alphabetical')}>
              Ordre alphabétique
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-error/10 to-error/5 border-error/20 shadow-md
        hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-error">Risque élevé</CardTitle>
            <AlertTriangle className="h-4 w-4 text-error" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-error">{initialData.stats.highCount}</div>
            <p className="text-xs text-error/80 mt-1">≥ 9 absences</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20
         shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-warning">Risque moyen</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-warning">{initialData.stats.mediumCount}</div>
            <p className="text-xs text-warning/80 mt-1">6 absences</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20
        shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-info">
              Risque faible
            </CardTitle>
            <Shield className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-info">
              {initialData.stats.lowCount}
            </div>
            <p className="text-xs text-info/80 mt-1">3 absences</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des Cartes étudiantes */}
      {sortedStudents.length === 0 ? (
        <Card className="bg-gray-50 border-gray-200">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun étudiant à risque
            </h3>
            <p className="text-gray-600 text-base max-w-md">
              Aucun étudiant avec des absences multiples de 3 n'a été trouvé.
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
                    riskLevel === 'high'
                      ? 'bg-error text-error-foreground'
                      : riskLevel === 'medium'
                        ? 'bg-warning text-warning-foreground'
                        : 'bg-info text-info-foreground'
                  }`}
                >
                  {riskLevel === 'high' ? 'Élevé' : riskLevel === 'medium' ? 'Moyen' : 'Faible'}
                </Badge>
              </div>

              {/* Carte avec bordure colorée selon le risque - plus compacte */}
              <div
                className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-lg
                transition-all duration-300 transform hover:-translate-y-1 ${
            riskLevel === 'high'
              ? 'border-l-4 border-l-error bg-gradient-to-br from-error/5 to-background'
              : riskLevel === 'medium'
                ? 'border-l-4 border-l-warning bg-gradient-to-br from-warning/5 to-background'
                : 'border-l-4 border-l-info bg-gradient-to-br from-info/5 to-background'
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
