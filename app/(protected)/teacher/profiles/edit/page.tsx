'use client'

import { ChevronLeft, ChevronRight, CircleArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import React from 'react'

import { useRouter } from 'next/navigation'

import { useToast } from '@/client/hooks/use-toast'

import { CourseSession, SubjectNameEnum } from '@/zUnused/mongo/course'
import { Period, PeriodTypeEnum } from '@/types/schedule'
import { TimeSlotEnum } from '@/types/courses'

import { PlanningEditor } from '@/client/components/atoms/PlanningEditor'
import { HolidaysCard } from '@/server/components/atoms/HolidaysCard'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/client/components/ui/dialog'

import { useCourses } from '@/client/context/courses'
import { useHolidays } from '@/client/context/holidays'
import { useSchedules } from '@/client/context/schedules'
import { formatDayOfWeek } from '@/utils/helpers'

const PlanningViewer = () => {
  const { toast } = useToast()
  const { courses, isLoading, updateCourses } = useCourses()
  const { schedules, isLoading: loadingSchedules } = useSchedules()
  const { holidays, isLoading: isLoadingHolidays } = useHolidays()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0)
  const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotEnum | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        await updateCourses()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    }
    fetchCourses()
  }, [updateCourses])

  // Définir la session sélectionnée au chargement initial
  useEffect(() => {
    const timeSlots = Object.values(TimeSlotEnum)
    if (timeSlots.length > 0 && !selectedTimeSlot) {
      setSelectedTimeSlot(timeSlots[0])
    }
  }, [selectedTimeSlot])

  const timeSlots = Object.values(TimeSlotEnum)

  const handlePrevDay = () => {
    setCurrentDayIndex((prev) => (prev === 0 ? timeSlots.length - 1 : prev - 1))
  }

  const handleNextDay = () => {
    setCurrentDayIndex((prev) => (prev === timeSlots.length - 1 ? 0 : prev + 1))
  }

  const getSessionsForSlot = (timeSlot: TimeSlotEnum, period: Period) => {
    return courses.flatMap((course) =>
      course.courses_sessions.filter(
        (session) =>
          session.courses_sessions_timeslot[0].day_of_week === timeSlot &&
          session.courses_sessions_timeslot[0].start_time === period.startTime,
      ),
    )
  }

  // Compter le total des sessions
  const totalSessions = timeSlots.reduce((total, timeSlot) => {
    const periodsData = schedules[timeSlot]?.periods || []
    const sessionCount = periodsData.reduce((count, period) => {
      if (period.type === PeriodTypeEnum.CLASS) {
        return count + getSessionsForSlot(timeSlot, period).length
      }
      return count
    }, 0)
    return total + sessionCount
  }, 0)

  const getSubjectBadgeColor = (subject: SubjectNameEnum): string => {
    switch (subject) {
    case SubjectNameEnum.Arabe:
      return 'bg-emerald-100 text-emerald-600'
    case SubjectNameEnum.EducationCulturelle:
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
    }
  }

  const renderTimeSlot = (timeSlot: TimeSlotEnum) => {
    const periodsData = schedules[timeSlot]?.periods || []
    const hasClasses = periodsData.some(
      (period) =>
        period.type === PeriodTypeEnum.CLASS && getSessionsForSlot(timeSlot, period).length > 0,
    )

    return (
      <Card
        className={`shadow-sm border-t-0 border-r-0 border-b-0 overflow-hidden rounded-lg
           animate-fadeIn bg-white ${
      selectedTimeSlot === timeSlot
        ? 'border-l-4 border-l-blue-500'
        : 'border-l-4 border-l-transparent'
      }`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-gray-800">
              {formatDayOfWeek(timeSlot)}
            </CardTitle>
            <PlanningEditor
              timeSlot={timeSlot}
              sessions={periodsData.flatMap((period) =>
                period.type === PeriodTypeEnum.CLASS ? getSessionsForSlot(timeSlot, period) : [],
              )}
              periods={periodsData}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {hasClasses ? (
            periodsData.map((period, periodIdx) =>
              period.type === PeriodTypeEnum.BREAK ? (
                <div
                  key={`break-${periodIdx}`}
                  className="h-1 w-full bg-amber-400 rounded-full my-4"
                />
              ) : (
                <div key={`period-${periodIdx}`} className="space-y-2">
                  <div className="text-sm text-gray-500">
                    {period.startTime} - {period.endTime}
                  </div>
                  <div className="space-y-3">
                    {getSessionsForSlot(timeSlot, period).map((session, sessionIdx) => (
                      <div
                        key={`session-${sessionIdx}`}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors
                        duration-200 cursor-pointer"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center
                        mb-3">
                          <div className="flex items-center mb-2 sm:mb-0">
                            <div
                              className={`h-7 px-3 rounded-full flex items-center justify-center
                                mr-2 ${getSubjectBadgeColor(session.subject)}`}
                            >
                              <span className="text-xs font-medium">{session.subject}</span>
                            </div>
                            <div className="h-7 px-3 rounded-full bg-blue-100 flex items-center
                            justify-center">
                              <span className="text-blue-600 text-xs font-medium">
                                Niveau {session.level}
                              </span>
                            </div>
                          </div>
                          <div className="h-7 px-3 rounded-full bg-gray-100 flex items-center
                          justify-center">
                            <span className="text-gray-600 text-xs font-medium">
                              Salle {session.courses_sessions_timeslot[0].classroom_number}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.courses_sessions_students?.length || 0} élèves
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )
          ) : (
            <div className="text-center py-6 text-gray-500">Aucun cours programmé</div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading || loadingSchedules) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1" />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    )
  }

  if (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: `Error: ${error}`,
      duration: 3000,
    })
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="link"
            className="p-0 text-gray-500 hover:text-blue-600 -ml-1.5 transition-colors"
            onClick={() => router.push('/teacher/profiles')}
          >
            <CircleArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100
            text-blue-600">
              <span className="text-xs font-medium">{totalSessions}</span>
            </div>
            <span className="text-sm text-gray-500">Cours</span>
          </div>
        </div>

        <div className="pb-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Mon Planning</h1>
        </div>

        {/* Légende des couleurs */}
        <div className="bg-white p-3 rounded-lg shadow-sm mb-2">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-xs sm:text-sm text-gray-700">{SubjectNameEnum.Arabe}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-xs sm:text-sm text-gray-700">
                {SubjectNameEnum.EducationCulturelle}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 rounded-full bg-amber-400" />
              <span className="text-xs sm:text-sm text-gray-700">Pause</span>
            </div>
          </div>
        </div>

        {/* Filtres par jour - en desktop */}
        <div className="hidden sm:flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {timeSlots.map((timeSlot) => (
            <Button
              key={timeSlot}
              variant={selectedTimeSlot === timeSlot ? 'default' : 'outline'}
              className="rounded-full text-sm whitespace-nowrap"
              onClick={() => setSelectedTimeSlot(timeSlot)}
            >
              {formatDayOfWeek(timeSlot)}
            </Button>
          ))}
        </div>

        {/* Navigation mobile */}
        <div className="flex sm:hidden items-center justify-between mb-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold">{formatDayOfWeek(timeSlots[currentDayIndex])}</h2>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mt-4">
        <div className="lg:col-span-3">
          {/* Mobile - jour actuel uniquement */}
          <div className="sm:hidden">{renderTimeSlot(timeSlots[currentDayIndex])}</div>

          {/* Desktop - selon le jour sélectionné ou tous les jours */}
          <div className="hidden sm:block">
            {selectedTimeSlot ? (
              <div className="space-y-4">{renderTimeSlot(selectedTimeSlot)}</div>
            ) : (
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeSlots.map((timeSlot) => (
                  <React.Fragment key={timeSlot}>{renderTimeSlot(timeSlot)}</React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar avec HolidaysCard */}
        <div className="space-y-4">
          <HolidaysCard holidays={holidays} isLoading={isLoadingHolidays} />
        </div>
      </div>

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du cours</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Matière</div>
                  <div className="font-medium">{selectedSession?.subject}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Niveau</div>
                  <div className="font-medium">{selectedSession?.level}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Salle</div>
                  <div className="font-medium">{selectedSession?.timeSlot.classroomNumber}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Élèves</div>
                  <div className="font-medium">{selectedSession?.students?.length || 0}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Horaire</h3>
              <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <div>{formatDayOfWeek(selectedSession?.timeSlot.dayOfWeek as TimeSlotEnum)}</div>
                <div>
                  {selectedSession?.timeSlot.startTime} - {selectedSession?.timeSlot.endTime}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PlanningViewer
