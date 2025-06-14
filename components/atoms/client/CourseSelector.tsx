// components/atoms/client/CourseSelector.tsx
'use client'

import { CourseWithRelations } from '@/types/supabase/courses'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'

interface CourseSelectorProps {
  courses: CourseWithRelations[]
  currentCourseId: string
}

export function CourseSelector({ courses, currentCourseId }: CourseSelectorProps) {
  const router = useRouter()

  const allSessions = courses.flatMap((course) =>
    course.courses_sessions?.map(session => ({
      ...session,
      timeslot: session.courses_sessions_timeslot?.[0]
    })) || []
  )

  return (
    <Select
      value={currentCourseId}
      onValueChange={(value) => router.push(`/teacher/classroom/course/${value}`)}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Sélectionner un cours" />
      </SelectTrigger>
      <SelectContent>
        {allSessions.map((session) => (
          <SelectItem key={session.id} value={session.id}>
            {session.subject} - {session.level}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
