import { GraduationCap, User2 } from 'lucide-react'

import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { getStudentCourses } from '@/server/actions/api/courses'
import { User } from '@/types/db'
import { UserRoleEnum } from '@/types/user'

interface ChildProps {
  child: User & { role: UserRoleEnum.Student }
}

export const Child = async ({ child }: ChildProps) => {
  try {
    const response = await getStudentCourses(child.id)

    let teacherInfo = {
      name: 'Non défini',
      level: 'Non défini',
    }

    if (response.success && response.data && response.data.length > 0) {
      const enrollment = response.data[0]
      const session = enrollment.courses_sessions
      const teacher = session.courses.courses_teacher[0]?.users

      teacherInfo = {
        name: teacher ? `${teacher.firstname} ${teacher.lastname}` : 'Non défini',
        level: session.level || 'Non défini',
      }
    }

    return (
      <div className="group relative rounded-xl bg-gradient-to-br from-background to-muted/30
        border border-border/50 p-5 hover:border-border transition-all duration-200">

        {/* Header principal */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GenderDisplay gender={child.gender} size="w-8 h-8" />
            <h3 className="text-lg font-semibold text-foreground">
              {child.lastname} {child.firstname}
            </h3>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
            {child.date_of_birth ? (
              new Date(child.date_of_birth).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            ) : (
              'Date non spécifiée'
            )}
          </div>
        </div>

        {/* Informations cours */}
        <div className="space-y-3">
          {/* Professeur */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10
            border border-secondary/20 hover:bg-secondary/20 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <User2 className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {teacherInfo.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Professeur principal
              </p>
            </div>
          </div>

          {/* Niveau */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10
            border border-primary/20 hover:bg-primary/20 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Niveau {teacherInfo.level}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des informations:', error)
    return <ErrorContent message="Erreur lors de la récupération des informations" />
  }
}

