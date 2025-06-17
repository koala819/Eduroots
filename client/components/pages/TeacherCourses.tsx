'use client'

import { useMemo, useState } from 'react'

import { CourseMenuDesktop } from '@/client/components/atoms/CourseMenu_Desktop'
import { CourseMenuMobile } from '@/client/components/atoms/CourseMenu_Mobile'
import { AttendanceDashboard } from '@/client/components/molecules/AttendanceDashboard'
import { BehaviorDashboard } from '@/client/components/molecules/BehaviorDashboard'
import {
  Course,
  CourseSession,
  CourseSessionStudent,
  CourseSessionTimeslot,
  User,
} from '@/types/db'

interface StudentWithUser extends CourseSessionStudent {
  users: User
  mongo_student_id?: string
}

interface CourseSessionWithRelations extends CourseSession {
  courses: Course
  courses_sessions_timeslot: CourseSessionTimeslot[]
  courses_sessions_students: StudentWithUser[]
}

interface CourseDetailsPageProps {
  courseSessionId: string
  sessionScheduleDates: Date[]
  selectedSession: CourseSessionWithRelations
}

export default function TeacherCourses({
  courseSessionId,
  sessionScheduleDates,
  selectedSession,
}: Readonly<CourseDetailsPageProps>) {
  const [activeView, setActiveView] = useState<string>('attendance')

  const sortedStudents = useMemo<User[]>(() => {
    if (!selectedSession?.courses_sessions_students) return []

    return selectedSession.courses_sessions_students
      // On ne garde que les étudiants avec des données utilisateur
      .filter((student) => student.users)
      .map((student) => student.users)
      .sort((a, b) => {
        if (!a.lastname || !b.lastname) return 0
        return a.lastname.localeCompare(b.lastname)
      })
  }, [selectedSession])

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <header className="sticky top-0 z-40">
        {/* Vue desktop */}
        <div className="hidden sm:flex">
          <CourseMenuDesktop
            activeView={activeView}
            setActiveView={setActiveView}
            selectedSession={selectedSession}
          />
        </div>

        {/* Vue mobile */}
        <div className="sm:hidden">
          <CourseMenuMobile
            activeView={activeView}
            setActiveView={setActiveView}
            selectedSession={selectedSession}
          />
        </div>
      </header>

      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-[1200px] mx-auto bg-white rounded-lg shadow-sm">
          {activeView === 'attendance' ? (
            <AttendanceDashboard
              courseSessionId={courseSessionId}
              students={sortedStudents}
              courseDates={sessionScheduleDates}
            />
          ) : (
            <BehaviorDashboard
              courseId={courseSessionId}
              courseDates={sessionScheduleDates}
            />
          )}
        </div>
      </div>
    </div>
  )
}
