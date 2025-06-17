import { compareDesc } from 'date-fns'
import { AlertTriangle, ArrowUpDown } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'
import { useStats } from '@/client/context/stats'
import { useStudents } from '@/client/context/students'
import { StudentAbsenceCard } from '@/server/components/admin/atoms/StudentAbsenceCard'
import { StudentStats } from '@/types/stats'
import { StudentResponse } from '@/types/student-payload'

// Types de tri disponibles
type SortType = 'alphabetical' | 'absences-desc' | 'recent-activity' | 'last-absence'

interface StudentStatsData {
  userId: string
  absencesCount: number
  absences: Array<{
    date: any
    course: string
    reason?: string
  }>
  lastActivity: any
  // Autres propriétés nécessaires
}

export const HighRiskAbsenceStudents = () => {
  const { students, isLoading: isLoadingStudents } = useStudents()
  const { studentStats: stats, isLoading: isLoadingStats, refreshEntityStats } = useStats()

  const [sortType, setSortType] = useState<SortType>('alphabetical')
  const [error, setError] = useState<string | null>(null)

  const studentStats = useMemo(() => {
    return stats.filter(
      (stat): stat is any => stat !== null && typeof stat === 'object',
    ) as unknown as StudentStatsData[]
  }, [stats])

  // Effet pour s'assurer que les données des statistiques sont chargées
  useEffect(() => {
    const loadStats = async () => {
      try {
        await refreshEntityStats()
      } catch (err) {
        console.error('[HIGH_RISK_STUDENTS]', err)
        setError('Erreur lors du chargement des statistiques')
      }
    }

    loadStats()
  }, [refreshEntityStats])

  // Filtrer les statistiques pour obtenir uniquement celles avec un nombre d'absences multiple de 3
  const highRiskStats = useMemo(() => {
    return studentStats.filter((stat) => stat.absencesCount % 3 === 0 && stat.absencesCount > 0)
  }, [studentStats])

  // Créer un Map pour associer les IDs aux statistiques pour un accès plus rapide
  const statsMap = useMemo(() => {
    const map = new Map()
    highRiskStats.forEach((stat) => {
      map.set(stat.userId, stat)
    })
    return map
  }, [highRiskStats])

  // Filtrer et trier les étudiants selon les statistiques et le type de tri
  const filteredAndSortedStudents = useMemo(() => {
    // Filtrer d'abord pour ne garder que les étudiants à risque
    const filteredStudents = students.filter((student) => statsMap.has(student.id))

    // Trier ensuite selon le critère sélectionné
    const sortByAlphabetical = (a: StudentResponse, b: StudentResponse): number => {
      const lastNameComparison = a.lastname.localeCompare(b.lastname)
      return lastNameComparison === 0 ? a.firstname.localeCompare(b.firstname) : lastNameComparison
    }

    const sortByAbsencesCount = (
      statsA: StudentStats | undefined,
      statsB: StudentStats | undefined,
    ): number => {
      if (!statsA || !statsB) return 0
      return statsB.absencesCount - statsA.absencesCount
    }

    const sortByLastActivity = (
      statsA: StudentStats | undefined,
      statsB: StudentStats | undefined,
    ): number => {
      if (!statsA?.lastActivity && !statsB?.lastActivity) return 0
      if (!statsA?.lastActivity) return 1
      if (!statsB?.lastActivity) return -1
      return compareDesc(new Date(statsA.lastActivity), new Date(statsB.lastActivity))
    }

    const sortByLastAbsence = (
      statsA: StudentStats | undefined,
      statsB: StudentStats | undefined,
    ): number => {
      if (!statsA?.absences.length && !statsB?.absences.length) return 0
      if (!statsA?.absences.length) return 1
      if (!statsB?.absences.length) return -1

      const lastAbsenceA = statsA.absences[statsA.absences.length - 1].date
      const lastAbsenceB = statsB.absences[statsB.absences.length - 1].date

      return compareDesc(new Date(lastAbsenceA), new Date(lastAbsenceB))
    }

    return [...filteredStudents].sort((a, b) => {
      const statsA = statsMap.get(a.id)
      const statsB = statsMap.get(b.id)

      if (!statsA || !statsB) return 0

      switch (sortType) {
      case 'alphabetical':
        return sortByAlphabetical(a, b)
      case 'absences-desc':
        return sortByAbsencesCount(statsA, statsB)
      case 'recent-activity':
        return sortByLastActivity(statsA, statsB)
      case 'last-absence':
        return sortByLastAbsence(statsA, statsB)
      default:
        return 0
      }
    })
  }, [students, statsMap, sortType])

  // Vérifier si les données sont en cours de chargement
  const isLoading = isLoadingStudents || isLoadingStats

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-800">{error}</p>
        <Button
          className="mt-4 bg-red-600 hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Étudiants à risque élevé d&apos;absences
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <ArrowUpDown className="h-4 w-4" />
                Trier par
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortType('alphabetical')}>
                Ordre alphabétique
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortType('absences-desc')}>
                Nombre d&apos;absences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortType('last-absence')}>
                Dernière absence
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortType('recent-activity')}>
                Activité récente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Badge className="bg-red-600 px-3 py-1 text-base w-full sm:w-auto mt-2 sm:mt-0
          text-center sm:text-left">
            {filteredAndSortedStudents.length} étudiant
            {filteredAndSortedStudents.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {filteredAndSortedStudents.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-700">
            Aucun étudiant avec un nombre d&apos;absences multiple de 3 n&apos;a été trouvé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedStudents.map((student) => (
            <StudentAbsenceCard
              key={student.id}
              student={student}
              stats={statsMap.get(student.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
