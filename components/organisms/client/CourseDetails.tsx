'use client'

import {useState} from 'react'

import {CourseSession, PopulatedCourse} from '@/types/course'
import {Student} from '@/types/user'

import {TopMenu} from '@/components/molecules/client/CourseTopMenu'
import {DashboardAttendanceT} from '@/components/molecules/client/DashboardAttendanceT'
import {DashboardBehaviorT} from '@/components/molecules/client/DashboardBehaviorT'

interface CourseDetailsProps {
  courseId: string
  selectedSession: CourseSession
  courseDates: Date[]
  sortedStudents: Student[]
  teacherCourses: PopulatedCourse[]
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
            <DashboardAttendanceT
              courseId={courseId}
              students={sortedStudents}
              courseDates={courseDates}
            />
          ) : (
            <DashboardBehaviorT courseId={courseId} courseDates={courseDates} />
          )}
        </div>
      </div>
    </div>
  )
}
