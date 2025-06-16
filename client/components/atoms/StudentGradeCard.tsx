'use client'

import { ReactNode } from 'react'

import { SubjectNameEnum } from '@/zUnused/types/course'

interface SubjectGrade {
  subject: string
  average: number | string
  grades: number[]
}

interface GradeCardProps {
  title: string
  icon: ReactNode
  subjectGrades: SubjectGrade[]
}

// Fonction pour déterminer la couleur en fonction de la matière
const getSubjectColor = (subject: string) => {
  switch (subject) {
  case SubjectNameEnum.Arabe:
    return 'bg-emerald-100 text-emerald-700'
  case SubjectNameEnum.EducationCulturelle:
    return 'bg-blue-100 text-blue-700'
    // case 'Français':
    //   return 'bg-indigo-100 text-indigo-700'
    // case 'Mathématiques':
    //   return 'bg-purple-100 text-purple-700'
    // case 'Sciences':
    //   return 'bg-orange-100 text-orange-700'
  default:
    return 'bg-slate-100 text-slate-700'
  }
}

export const GradeCard = ({ title, icon, subjectGrades }: GradeCardProps) => {
  return (
    <div className="border-none rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-green-400"></div>
      <div className="flex flex-row items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600">
            {icon}
          </div>
          <div className="text-base font-bold text-slate-700">{title}</div>
        </div>
      </div>

      <div className="px-6 py-4">
        <ul className="space-y-4">
          {subjectGrades.map((subjectData, index) => {
            const subjectColor = getSubjectColor(subjectData.subject)

            return (
              <li
                key={index}
                className={`pb-4 ${index !== subjectGrades.length - 1 ? 'border-b border-slate-200' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-700 font-medium">{subjectData.subject}</span>
                  <span className={`font-semibold ${subjectColor.split(' ')[1]}`}>
                    {typeof subjectData.average === 'number'
                      ? `${subjectData.average.toFixed(1)}/20`
                      : subjectData.average}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {subjectData.grades.map((grade, gradeIndex) => (
                    <div
                      key={gradeIndex}
                      className={`${subjectColor} px-3 py-1 rounded-full text-sm font-medium`}
                    >
                      {grade}/20
                    </div>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
