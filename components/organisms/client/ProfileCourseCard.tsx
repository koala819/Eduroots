'use client'

import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { StudentStats } from '@/types/stats'
import { Student } from '@/types/user'

import { ClassOverview } from '@/components/atoms/client/ClassOverview'
import { Card, CardContent } from '@/components/ui/card'

import { useStats } from '@/context/Stats/client'

export interface StudentWithDetails extends Student {
  stats: StudentStats
}

export const ProfileCourseCard = ({ students }: { students: Student[] }) => {
  const [studentsWithData, setStudentsWithData] = useState<
    StudentWithDetails[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const { getStudentAttendance, getStudentBehavior, getStudentGrade } =
    useStats()

  useEffect(() => {
    // Fonction pour charger toutes les données des étudiants
    const loadStudentData = async () => {
      setIsLoading(true)

      try {
        if (students.length > 0) {
          // Tableau pour stocker les étudiants avec toutes leurs données
          const completeStudents: StudentWithDetails[] = []

          // Pour chaque étudiant, récupérer toutes ses données
          for (const student of students) {
            const studentId = student._id

            // Récupérer les 3 types de données en parallèle
            const [attendanceData, behaviorData, gradesData] =
              await Promise.all([
                getStudentAttendance(studentId),
                getStudentBehavior(studentId),
                getStudentGrade(studentId),
              ])

            // Construire l'objet StudentStats à partir des données récupérées
            const studentStats: StudentStats = {
              userId: studentId,
              absencesRate: attendanceData?.attendanceRate
                ? 100 - attendanceData.attendanceRate
                : 0,
              absencesCount: attendanceData?.absencesCount || 0,
              behaviorAverage: behaviorData?.average || 0,
              absences: attendanceData?.absences || [],
              grades: gradesData || { overallAverage: 0 },
              lastActivity: attendanceData?.lastActivity
                ? new Date(attendanceData.lastActivity)
                : null,
              lastUpdate: new Date(),
            }

            // Ajouter l'étudiant avec toutes ses données
            completeStudents.push({
              ...student,
              stats: studentStats,
            })
          }

          // Mettre à jour l'état avec tous les étudiants et leurs données
          setStudentsWithData(completeStudents)
        } else {
          setStudentsWithData([])
        }
      } catch (err) {
        console.error(
          'Erreur lors du chargement des données des étudiants:',
          err,
        )
      } finally {
        setIsLoading(false)
      }
    }

    // Lancer le chargement des données
    loadStudentData()
  }, [students, getStudentAttendance, getStudentBehavior, getStudentGrade])

  return (
    <Card className="mb-6 bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-4 border-t border-zinc-100">
        <div className="flex items-center gap-2.5 mb-4">
          <Users className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-600">
            {students.length} étudiants
          </span>
          {isLoading && (
            <span className="text-xs text-zinc-400 ml-2">Chargement...</span>
          )}
        </div>
        <ClassOverview students={studentsWithData} />
      </CardContent>
    </Card>
  )
}
