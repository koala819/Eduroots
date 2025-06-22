'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/client/components/ui/accordion'
import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { GradeRecordWithUser,GradeWithRelations } from '@/types/grades'

interface GradeCardProps {
  grade: GradeWithRelations
  getSubjectColor: (subject: string) => string
  getTypeBackgroundColor: (type: string) => string
}

export const GradeCard = ({ grade, getSubjectColor, getTypeBackgroundColor }: GradeCardProps) => {
  const router = useRouter()
  const subject = grade.courses_sessions.subject

  return (
    <Card
      className={`
        shadow-sm border-l-4 ${getSubjectColor(subject)}
        border-t-0 border-r-0 border-b-0 overflow-hidden
        rounded-lg animate-fadeIn
        ${grade.is_draft ? 'bg-gray-50' : 'bg-white'}
        hover:shadow-md transition-all cursor-pointer
      `}
      onClick={() => router.push(`/teacher/settings/grades/${grade.id}`)}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {subject}
          </CardTitle>
          <span className="text-sm text-gray-500">
            {format(new Date(grade.date), 'dd MMM', { locale: fr })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-3 px-4">
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100
         transition-colors duration-200">
          <div className="flex flex-wrap gap-2 mb-3">
            <div className={`
              h-7 px-3 rounded-full flex items-center justify-center
              ${getTypeBackgroundColor(grade.type)} text-xs font-medium
            `}>
              {grade.type}
            </div>
            <div className={`
              h-7 px-3 rounded-full flex items-center justify-center
              ${grade.is_draft ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}
              text-xs font-medium
            `}>
              {grade.is_draft ? 'En cours' : 'Terminé'}
            </div>
          </div>

          <GradeStats grade={grade} />
          <GradeActions grade={grade} />
        </div>
      </CardContent>
    </Card>
  )
}

interface GradeStatsProps {
  grade: GradeWithRelations
}

const GradeStats = ({ grade }: GradeStatsProps) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <div className="space-y-1">
        <span className="text-xs text-gray-500">Moyenne</span>
        <div className="font-medium text-gray-900">
          {grade.stats_average_grade.toFixed(1)}/20
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-xs text-gray-500">Élèves notés</span>
        <div className="font-medium text-gray-900">
          {`${grade.stats_total_students - grade.stats_absent_count}/${grade.stats_total_students}`}
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-xs text-gray-500">Absents</span>
        <div className="font-medium text-gray-900">
          {grade.stats_absent_count}
        </div>
      </div>
    </div>
  </div>
)

interface GradeActionsProps {
  grade: GradeWithRelations
}

const GradeActions = ({ grade }: GradeActionsProps) => {
  const router = useRouter()

  if (grade.is_draft) {
    return (
      <div className="pt-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/teacher/settings/grades/${grade.id}`)
          }}
        >
          Valider le brouillon
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="pt-2 flex justify-end">
      <Accordion
        type="single"
        collapsible
        className="w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <AccordionItem value={`detail-${grade.id}`} className="border-0">
          <div className="flex justify-end">
            <AccordionTrigger className="py-0 px-2 hover:no-underline text-blue-600
            hover:text-blue-800 hover:bg-blue-50 rounded-md">
              <span className="text-sm font-medium">Voir détails</span>
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <GradeDetails grade={grade} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

interface GradeDetailsProps {
  grade: GradeWithRelations
}

const GradeDetails = ({ grade }: GradeDetailsProps) => (
  <div className="pt-3 border-t mt-3 border-gray-100">
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
      <div>
        <span className="text-gray-500 block text-xs">Note la plus haute</span>
        <span className="font-medium">{grade.stats_highest_grade}/20</span>
      </div>
      <div>
        <span className="text-gray-500 block text-xs">Note la plus basse</span>
        <span className="font-medium">{grade.stats_lowest_grade}/20</span>
      </div>
      <div>
        <span className="text-gray-500 block text-xs">Créée le</span>
        <span className="font-medium">
          {format(new Date(grade.created_at), 'dd/MM/yyyy', { locale: fr })}
        </span>
      </div>
    </div>
    <GradeRecords records={grade.grades_records} />
  </div>
)

interface GradeRecordsProps {
  records: GradeRecordWithUser[]
}

const GradeRecords = ({ records }: GradeRecordsProps) => (
  <div className="mt-3">
    <h4 className="text-sm font-medium text-gray-700 mb-2">
      Notes des élèves
    </h4>
    <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200">
      {records.map((record, index) => (
        <div
          key={record.users.id}
          className={`
            p-2 text-sm flex justify-between items-center
            ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
          `}
        >
          <div className="font-medium">
            {record.users.firstname} {record.users.lastname}
          </div>
          <div className="flex items-center gap-2">
            {record.is_absent ? (
              <Badge variant="outline" className="bg-red-100 text-red-600">
                Absent
              </Badge>
            ) : (
              <span className="font-bold">{record.value}/20</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)
