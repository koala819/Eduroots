'use client'

import { ChevronLeft, ChevronRight, Clock, TreePalm } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

import { CourseSession } from '@/types/mongo/course'
import { Period, PeriodTypeEnum } from '@/types/supabase/schedule'

import PlanningDetailsCard from '@/components/admin/atoms/client/PlanningDetailsCard'
import { TimeSlotColumn } from '@/components/admin/molecules/client/PlanningTimeSlotColumn'
import { HolidaysCard } from '@/components/atoms/server/HolidaysCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { useCourses } from '@/context/Courses/client'
import { useHolidays } from '@/context/Holidays/client'
import { useSchedules } from '@/context/Schedules/client'
import { formatDayOfWeek } from '@/utils/helpers'
import { TimeSlotEnum } from '@/types/supabase/courses'

export default function PlanningGridClient() {
  const { courses, isLoading, updateCourses } = useCourses()
  const { holidays, isLoading: isLoadingHolidays } = useHolidays()
  const router = useRouter()
  const { schedules, isLoading: loadingSchedules } = useSchedules()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSession(user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, user) => {
      setSession(user)
    })

    return () => subscription.unsubscribe()
  }, [])

  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0)
  const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null)

  useEffect(() => {
    updateCourses()
  }, [updateCourses])

  const timeSlots = Object.values(TimeSlotEnum)

  const getSessionsForSlot = (timeSlot: TimeSlotEnum, period: Period) => {
    return courses
      .flatMap((course) =>
        course.courses_sessions.map((session) => {
          const firstTeacher = Array.isArray(course.courses_teacher) && course.courses_teacher[0]
          const teacherData = firstTeacher && 'firstname' in firstTeacher ? firstTeacher : null

          return {
            ...session,
            courseId: course.id,
            user: teacherData
              ? {
                id: teacherData.users.id,
                firstname: teacherData.users.firstname,
                lastname: teacherData.users.lastname,
                role: teacherData.users.role,
              }
              : undefined,
          }
        }),
      )
      .filter((session) => {
        if (!session?.courses_sessions_timeslot) {
          console.error('Session invalide:', { session })
          return false
        }

        return (
          session.courses_sessions_timeslot[0].day_of_week === timeSlot &&
          session.courses_sessions_timeslot[0].start_time === period.startTime
        )
      })
  }

  const handlePrevDay = () => {
    setCurrentDayIndex((prev) => (prev === 0 ? timeSlots.length - 1 : prev - 1))
  }

  const handleNextDay = () => {
    setCurrentDayIndex((prev) => (prev === timeSlots.length - 1 ? 0 : prev + 1))
  }

  if (isLoading || loadingSchedules || isLoadingHolidays) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-lg text-gray-600">Chargement du Planning...</div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Navigation */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <Button variant="outline" size="icon" onClick={handlePrevDay} className="shadow-sm">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{formatDayOfWeek(timeSlots[currentDayIndex])}</h2>
        <Button variant="outline" size="icon" onClick={handleNextDay} className="shadow-sm">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
        {/* Mobile: Show only current day */}
        <Card className="md:hidden">
          <CardHeader className="pb-2">
            <CardTitle>{formatDayOfWeek(timeSlots[currentDayIndex])}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3">
              {schedules[timeSlots[currentDayIndex]]?.periods.map((period, idx) =>
                period.type === PeriodTypeEnum.BREAK ? (
                  <div key={idx} className="h-full flex items-center justify-center">
                    <div className="w-1 h-full bg-amber-400 rounded-full mx-auto" />
                  </div>
                ) : (
                  <TimeSlotColumn
                    key={idx}
                    timeSlot={{
                      startTime: period.startTime,
                      endTime: period.endTime,
                      display: `${period.startTime} - ${period.endTime}`,
                    }}
                    sessions={getSessionsForSlot(timeSlots[currentDayIndex], period)}
                    onSessionClick={setSelectedSession}
                  />
                ),
              )}
            </div>
          </CardContent>
        </Card>

        {/* Desktop: Show all days */}
        {timeSlots.map((timeSlot, idx) => (
          <Card key={idx} className="hidden md:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-center">{formatDayOfWeek(timeSlot)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 -gap-x-2">
                {schedules[timeSlot]?.periods.map((period, slotIdx) =>
                  period.type === PeriodTypeEnum.BREAK ? (
                    <div key={slotIdx} className="h-full ">
                      <div className="w-1 h-full bg-amber-400 rounded-full mx-auto" />
                    </div>
                  ) : (
                    <TimeSlotColumn
                      key={slotIdx}
                      timeSlot={{
                        startTime: period.startTime,
                        endTime: period.endTime,
                        display: `${period.startTime} - ${period.endTime}`,
                      }}
                      sessions={getSessionsForSlot(timeSlot, period)}
                      onSessionClick={setSelectedSession}
                    />
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSession?.user?.firstname && selectedSession?.user?.lastname
                ? `${selectedSession.user.firstname} ${selectedSession.user.lastname.charAt(0)}.`
                : 'Enseignant non assigné'}
            </DialogTitle>
          </DialogHeader>
          {selectedSession && <PlanningDetailsCard session={selectedSession} />}
        </DialogContent>
      </Dialog>

      {/* Holidays */}
      <HolidaysCard holidays={holidays} isLoading={isLoadingHolidays} />

      {/* Buttons Controls */}
      {session?.user?.user_metadata?.role === 'admin' && (
        <div className="sticky bottom-0 bg-gray-50 pb-4 space-y-4">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1 bg-white shadow-sm hover:bg-gray-50"
              onClick={() =>
                router.push(`${process.env.NEXT_PUBLIC_CLIENT_URL}/admin/root/schedule/edit`)
              }
            >
              <Clock className="w-4 h-4 mr-2" />
              Éditer horaires
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-white shadow-sm hover:bg-gray-50"
              onClick={() =>
                router.push(`${process.env.NEXT_PUBLIC_CLIENT_URL}/admin/schedule/holidays`)
              }
            >
              <TreePalm className="w-4 h-4 mr-2" />
              Éditer vacances
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
