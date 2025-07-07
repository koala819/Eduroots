'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  FileText,
  GraduationCap,
  Info,
  Plus,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import DashboardQuickBtn from '@/server/components/admin/atoms/DashboardQuickBtn'
import { AdminResume } from '@/server/components/admin/atoms/DashboardResume'
import { CourseWithRelations } from '@/types/courses'
import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'

interface DashboardProps {
  isAdmin: boolean
  nbHighRiskStudents: number
  students: StudentResponse[]
  teachers: TeacherResponse[]
  courses: CourseWithRelations[]
}

const quickActions = [
  {
    icon: <Plus />,
    label: 'Nouvel élève',
    href: '/admin/members/student/create',
  },
  {
    icon: <GraduationCap />,
    label: 'Nouveau prof',
    href: '/admin/members/teacher/create',
  },

  {
    icon: <Calendar />,
    label: 'Planning',
    href: '/admin/schedule',
  },
  {
    icon: <FileText />,
    label: 'Logs',
    href: '/admin/root/logs',
  },
]

export const Dashboard = ({
  isAdmin,
  nbHighRiskStudents,
  students,
  teachers,
  courses,
}: DashboardProps) => {

  const today = new Date()

  const activityResume = [
    {
      title: 'Total d\'élèves',
      value: students.length,
    },
    {
      title: 'Total enseignants',
      value: teachers.length,
    },
    {
      title: 'Cours programmés',
      value: courses.length,
    },
    {
      title: 'Ratio Élèves/Prof',
      value: teachers.length > 0 ? Math.round(students.length / teachers.length) : 0 + '/1',
    },
  ]

  return (
    <div className="bg-background p-3 md:p-4 lg:p-6 pb-8 sm:pb-0">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">

        {/* Actions pour admin */}
        {isAdmin && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border
          border-border/50 shadow-sm">
            <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6
            flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Actions rapides
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {quickActions.map((action) => (
                <DashboardQuickBtn
                  key={action.label}
                  icon={action.icon}
                  label={action.label}
                  href={action.href}
                />
              ))}
            </div>
          </div>
        )}

        {/* Contenu principal en grille */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          {/* Actions et alertes */}
          <div className="space-y-4 md:space-y-6">
            <Card className="hover:shadow-lg transition-all duration-300 border-border
            bg-white/80 backdrop-blur-sm hover:border-error group">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-error/10
                  flex items-center justify-center group-hover:bg-error/20
                  transition-colors duration-300">
                    <AlertTriangle className="w-4 md:w-5 h-4 md:h-5 text-error" />
                  </div>
                  <CardTitle className="text-base md:text-lg text-foreground">
                    Alertes importantes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-3 md:py-4">
                  <p className="text-sm text-muted-foreground mb-3 md:mb-4">
                    {nbHighRiskStudents > 0
                      ? `${nbHighRiskStudents} étudiants nécessitent votre attention`
                      : 'Aucune alerte en cours'
                    }
                  </p>
                  {nbHighRiskStudents > 0 && (
                    <Link
                      href="/admin/highRisk"
                      className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-error
                      font-medium text-error-foreground rounded-lg hover:bg-error-dark
                      transition-colors text-sm"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Voir les détails
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informations système */}
            <Card className="bg-gradient-to-br from-info/10 to-info/5 rounded-2xl border
            border-info/20">
              <CardContent className="flex items-center justify-center gap-3 py-4 md:py-6">
                <div className="w-6 md:w-8 h-6 md:h-8 bg-info/20 rounded-full
                flex items-center justify-center">
                  <Info className="w-3 md:w-4 h-3 md:h-4 text-info" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-info mb-1">Système à jour</p>
                  <p className="text-xs text-muted-foreground">
                    Dernière mise à jour: {format(today, 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Résumé activité récente */}
          <div>
            <Card className="hover:shadow-lg transition-all duration-300 border-border
            bg-white/80 backdrop-blur-sm hover:border-accent group">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-accent/10
                  flex items-center justify-center group-hover:bg-accent/20
                  transition-colors duration-300">
                    <BarChart3 className="w-4 md:w-5 h-4 md:h-5 text-accent" />
                  </div>
                  <CardTitle className="text-base md:text-lg text-foreground">
                    Résumé de l'activité
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {activityResume.map((item) => (
                    <AdminResume key={item.title} title={item.title} value={item.value} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
