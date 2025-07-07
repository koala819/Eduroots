'use client'

import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { SubjectNameEnum } from '@/types/courses'
import { GradeTypeEnum } from '@/types/grades'

interface EditInfoProps {
  gradeInfo: {
    id: string
    date: Date
    type: GradeTypeEnum
    courseLevel: string
    dayOfWeek: string
    subject?: SubjectNameEnum
    is_draft: boolean
  }
  getGradeTypeLabel: (type: GradeTypeEnum) => string
  getFormattedDayOfWeek: (dayOfWeek: string) => string
}

export function EditInfo({
  gradeInfo,
  getGradeTypeLabel,
  getFormattedDayOfWeek,
}: EditInfoProps) {
  return (
    <Card className="bg-background border-border">
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="text-xl font-semibold text-foreground">
          Résumé de l&apos;évaluation de niveau {gradeInfo.courseLevel}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span className="ml-2 font-medium text-foreground">
              {getGradeTypeLabel(gradeInfo.type)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Date:</span>
            <span className="ml-2 font-medium text-foreground">
              {format(gradeInfo.date, 'dd/MM/yyyy')}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Session:</span>
            <span className="ml-2 font-medium text-foreground">
              {gradeInfo.dayOfWeek ? (
                <>
                  {getFormattedDayOfWeek(gradeInfo.dayOfWeek)}
                  {gradeInfo.subject && ` - ${gradeInfo.subject}`}
                </>
              ) : (
                'Informations non disponibles'
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
