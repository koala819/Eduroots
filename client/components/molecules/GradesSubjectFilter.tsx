'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/client/components/ui/button'
import { SubjectNameEnum } from '@/types/courses'

interface SubjectFilterProps {
  selectedSubject: string
  setSelectedSubject: (subject: string) => void
  subjectCounts: Record<SubjectNameEnum | 'Inconnu', number>
  totalGrades: number
  getSubjectBackgroundColor: (subject: string) => string
}

export const SubjectFilter = ({
  selectedSubject,
  setSelectedSubject,
  subjectCounts,
  totalGrades,
  getSubjectBackgroundColor,
}: SubjectFilterProps) => {
  const router = useRouter()

  return (
    <div className="space-y-2 sm:space-y-0 md:flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
      <Button
        variant={selectedSubject === 'all' ? 'default' : 'outline'}
        className="rounded-full text-sm whitespace-nowrap w-full"
        onClick={() => setSelectedSubject('all')}
      >
        Toutes ({totalGrades})
      </Button>

      {Object.values(SubjectNameEnum).map((subject) => (
        <Button
          key={subject}
          variant={selectedSubject === subject ? 'default' : 'outline'}
          className={`
            rounded-full text-sm whitespace-nowrap w-full
            ${selectedSubject === subject
          ? ''
          : getSubjectBackgroundColor(subject).replace('text-', 'hover:text-')}
          `}
          onClick={() => setSelectedSubject(subject)}
        >
          {subject} ({subjectCounts[subject] || 0})
        </Button>
      ))}

      <Button
        variant="outline"
        className="rounded-full text-sm whitespace-nowrap bg-blue-50 hover:bg-blue-100
         border-blue-200 ml-auto w-full"
        onClick={() => router.push('/teacher/profiles/grades/create')}
      >
        <Plus className="h-4 w-4 mr-1" />
        Nouvelle
      </Button>
    </div>
  )
}
