'use client'

import { ChevronDown, Trophy } from 'lucide-react'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'
import { getSubjectColors } from '@/server/utils/helpers'
import { SubjectNameEnum } from '@/types/courses'
import { GradeWithRelations } from '@/types/grades'

interface HeaderGradesProps {
  grades: GradeWithRelations[]
}

export const HeaderGrades = ({ grades }: HeaderGradesProps) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)

    // Émettre un événement personnalisé pour notifier TeacherGrades
    const customEvent = new CustomEvent('headerGradesSubjectChanged', {
      detail: { subject },
    })
    window.dispatchEvent(customEvent)
  }

  // Calculer les stats en interne (comme HeaderPlanning)
  const subjectCounts = grades.reduce((acc, grade) => {
    const subject = grade.courses_sessions?.subject || 'Inconnu'
    const subjectKey = subject as SubjectNameEnum | 'Inconnu'
    acc[subjectKey] = (acc[subjectKey] || 0) + 1
    return acc
  }, {} as Record<SubjectNameEnum | 'Inconnu', number>)

  const getSelectedSubjectStats = () => {
    if (selectedSubject === 'all') {
      return { count: grades.length, label: 'évaluations' }
    }
    return {
      count: subjectCounts[selectedSubject as SubjectNameEnum] || 0,
      label: 'évaluations',
    }
  }

  const { count, label } = getSelectedSubjectStats()

  // Filtrer les matières pour n'afficher que celles qui ont des évaluations
  const availableSubjects = Object.values(SubjectNameEnum).filter(
    (subject) => (subjectCounts[subject] || 0) > 0,
  )

  const getSubjectBackgroundColor = (subject: string) => {
    switch (subject) {
    case SubjectNameEnum.Arabe:
      return 'bg-blue-100 text-blue-600'
    case SubjectNameEnum.EducationCulturelle:
      return 'bg-green-100 text-green-600'
    default:
      return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="flex-[0.4] flex justify-end">
      <div className="w-full max-w-md">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full px-3 sm:px-4 py-2.5 rounded-xl
              bg-primary-foreground/10 border border-primary-foreground/20
              text-primary-foreground/90 hover:bg-primary-foreground/15
              hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
              flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Trophy className="w-4 h-4 text-primary-foreground/70 flex-shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm font-medium truncate">
                    {selectedSubject === 'all' ? 'Toutes les matières' : selectedSubject}
                  </span>
                  <span className="text-xs bg-primary-foreground text-primary
                      px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {count} {label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
                {availableSubjects.length + 1}
              </span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-full min-w-[280px] sm:min-w-[300px] p-2 bg-white
            border border-gray-200 shadow-lg">

            {/* Option "Toutes les matières" */}
            <DropdownMenuItem
              onClick={() => handleSubjectChange('all')}
              className="w-full px-3 py-2.5 rounded-lg text-left text-sm
                transition-all duration-200 flex items-center justify-between
                group cursor-pointer text-foreground hover:bg-muted
                hover:text-foreground"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-medium truncate">
                    Toutes les matières
                  </span>
                  <span className="text-xs bg-foreground text-background
                    px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {grades.length} évaluations
                  </span>
                </div>
              </div>
            </DropdownMenuItem>

            {/* Matières disponibles */}
            {availableSubjects.map((subject) => (
              <DropdownMenuItem
                key={subject}
                onClick={() => handleSubjectChange(subject)}
                className="w-full px-3 py-2.5 rounded-lg text-left text-sm
                  transition-all duration-200 flex items-center justify-between
                  group cursor-pointer text-foreground hover:bg-muted
                  hover:text-foreground"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-medium truncate">
                      {subject}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0
                      ${getSubjectColors(subject)}`}>
                      {subjectCounts[subject] || 0} évaluations
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
