'use client'

import { useEffect, useState } from 'react'

import { EmptyContent } from '@/client/components/atoms/StatusContent'
import { ProfileCourseCard } from '@/client/components/organisms/ProfileCourseCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { sortTimeSlots } from '@/client/utils/timeSlots'
import { SubjectNameEnum } from '@/types/courses'
import { TeacherWithStudentsResponse } from '@/types/teacher-payload'

interface ClassroomDashboardProps {
  initialData: TeacherWithStudentsResponse
}

const ClassroomDashboard = ({ initialData }: ClassroomDashboardProps) => {
  // Extraire tous les créneaux horaires uniques (déjà triés côté serveur)
  const allTimeSlots = initialData.courses.flatMap((course) =>
    course.sessions.map((session) => ({
      id: session.sessionId,
      subject: session.subject,
      dayOfWeek: session.timeSlot,
      level: session.level,
      courseId: course.courseId,
      startTime: session.startTime,
      endTime: session.endTime,
    })),
  )

  // Trier globalement tous les créneaux horaires pour garantir l'ordre correct
  const sortedTimeSlots = [...allTimeSlots].sort(sortTimeSlots)

  // Initialiser avec le premier créneau (maintenant trié globalement)
  const [selectedSession, setSelectedSession] = useState<string | null>(
    sortedTimeSlots.length > 0 ? sortedTimeSlots[0].id : null,
  )

  // Écouter les changements depuis le header
  useEffect(() => {
    const handleHeaderTimeSlotChanged = (event: CustomEvent) => {
      const { sessionId } = event.detail
      setSelectedSession(sessionId)
    }

    window.addEventListener('headerTimeSlotChanged', handleHeaderTimeSlotChanged as any)
    return () => {
      window.removeEventListener('headerTimeSlotChanged', handleHeaderTimeSlotChanged as any)
    }
  }, [])

  if (!initialData.courses || initialData.courses.length === 0) {
    return <EmptyContent />
  }

  return (
    <div className="p-4" data-dashboard="classroom">
      <div className="space-y-6 mt-4">
        {initialData.courses.map((course) =>
          Object.values(SubjectNameEnum).map((subject) => {
            // Filtrer les sessions pour ce cours, cette matière et ce créneau
            const subjectSessions = course.sessions.filter(
              (session) =>
                session.subject === subject &&
                session.sessionId === selectedSession,
            )

            if (subjectSessions.length > 0) {
              return (
                <Card
                  key={`${course.courseId}-${subject}`}
                  className="shadow-sm border-l-4 border-l-blue-500 border-t-0 border-r-0 border-b-0
                  overflow-hidden rounded-lg animate-fadeIn bg-white"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {subject}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    {subjectSessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors
                        duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between
                        sm:items-center mb-3">
                          <div className="flex items-center mb-2 sm:mb-0">
                            <div className="h-7 w-24 rounded-full bg-blue-100 flex items-center
                            justify-center mr-2">
                              <span className="text-blue-600 text-xs font-medium">
                                Niveau {session.level}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ProfileCourseCard
                          key={session.sessionId}
                          students={session.students}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            }
            return null
          }),
        )}
      </div>
    </div>
  )
}

export default ClassroomDashboard
