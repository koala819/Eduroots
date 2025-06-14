// components/organisms/client/CourseDetails.tsx
'use client'

import { useState } from 'react'
import { CourseWithRelations } from '@/types/supabase/courses'
import { User } from '@/types/supabase/db'
import { TopMenu } from '@/components/molecules/client/CourseTopMenu'
import { DashboardAttendanceT } from '@/components/molecules/client/DashboardAttendanceT'
import { DashboardBehaviorT } from '@/components/molecules/client/DashboardBehaviorT'

interface CourseDetailsProps {
  courseId: string
  selectedSession: {
    id: string
    subject: string
    level: string
    courses_sessions_timeslot: {
      day_of_week: string
      start_time: string
      end_time: string
      classroom_number: string | null
    }[]
  }
  courseDates: Date[]
  sortedStudents: User[]
  teacherCourses: CourseWithRelations[]
}

export function CourseDetails({
  courseId,
  selectedSession,
  courseDates,
  sortedStudents,
  teacherCourses,
}: CourseDetailsProps) {
  const [activeView, setActiveView] = useState<string>('attendance')

  return (
    <div className="bg-gray-100">
      <TopMenu
        teacherCourses={teacherCourses}
        currentCourseId={courseId}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedSession={selectedSession}
      />
      <div className="p-4">
        <div className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm">
          {activeView === 'attendance' ? (
            <>
              dashboard attendance
            {/* <DashboardAttendanceT
              courseId={courseId}
              students={sortedStudents}
              courseDates={courseDates}
            /> */}
            </>
          ) : (
              <>
                dashboard behavior
                {/* <DashboardBehaviorT courseId={courseId} courseDates={courseDates} /> */}
              </>
          )}
        </div>
      </div>
    </div>
  )
}
