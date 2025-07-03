'use client'

import { CalendarDays, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { CoursesTable } from '@/client/components/admin/atoms/StudentCoursesTable'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { StudentCourseMobile } from '@/server/components/admin/atoms/StudentCourseMobile'
import { StudentCourseSession } from '@/types/courses'

interface CoursesCardInfoProps {
  studentId: string
  data: StudentCourseSession[]
}

export function CoursesCardInfo({ studentId, data }: CoursesCardInfoProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <CalendarDays className="h-8 w-8" />
          </div>
          <CardTitle className="text-base text-foreground">
            Emploi du temps
          </CardTitle>
        </div>
        <Button
          onClick={() => {
            router.push(`/admin/members/student/edit/${studentId}/courses`)
          }}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </CardHeader>
      <CardContent>
        {/* Version mobile */}
        <div className="block md:hidden">
          <StudentCourseMobile coursesSessions={data} />
        </div>

        {/* Version desktop */}
        <div className="hidden md:block overflow-x-auto">
          <CoursesTable coursesSessions={data} />
        </div>
      </CardContent>
    </Card>
  )
}
