'use client'

import { useMemo, useState } from 'react'
import { CourseSession, User, CourseSessionTimeslot, Course, CourseSessionStudent } from '@/types/supabase/db'
import { DashboardAttendanceT } from '@/components/molecules/client/DashboardAttendanceT'
import { DashboardBehaviorT } from '@/components/molecules/client/DashboardBehaviorT'
import { CourseMenuDesktop } from '@/components/atoms/client/CourseMenu_Desktop'
import { CourseMenuMobile } from '@/components/atoms/client/CourseMenu_Mobile'

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
      .filter(student => student.users) // On ne garde que les étudiants avec des données utilisateur
      .map(student => student.users)
      .sort((a, b) => {
        if (!a.lastname || !b.lastname) return 0
        return a.lastname.localeCompare(b.lastname)
      })
  }, [selectedSession])

   return (
     <div className="bg-gray-100">
       {/* Vue desktop */}
       <div className="hidden sm:flex">
         <CourseMenuDesktop
          activeView={activeView}
          setActiveView={setActiveView}
          selectedSession={selectedSession}
         />
      </div>

       {/* Vue mobile */}
      <div className="sm:hidden space-y-2">
         <CourseMenuMobile
          activeView={activeView}
          setActiveView={setActiveView}
          selectedSession={selectedSession}
         />
        </div>

      <div className="p-4">
        <div className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm">
          {activeView === 'attendance' ? (
            <>
              dashboard attendance
            {/* <DashboardAttendanceT
              courseId={courseSessionId}
              students={sortedStudents}
              courseDates={sessionScheduleDates}
            /> */}
            </>
          ) : (
              <>
                dashboard behavior
                {/* <DashboardBehaviorT courseId={courseSessionId} courseDates={sessionScheduleDates} /> */}
              </>
          )}
        </div>
      </div>
    </div>
  )
}
