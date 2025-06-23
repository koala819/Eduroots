'use client'

import { Calendar, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { CourseWithRelations, TimeSlotEnum } from '@/types/courses'

interface HeaderPlanningProps {
  courses: CourseWithRelations[]
}

export const HeaderPlanning = ({
  courses,
}: HeaderPlanningProps) => {
  const timeSlots = Object.values(TimeSlotEnum)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotEnum | null>(
    timeSlots.length > 0 ? timeSlots[0] : null,
  )

  const handleTimeSlotChange = (timeSlot: TimeSlotEnum) => {
    setSelectedTimeSlot(timeSlot)

    // Émettre un événement personnalisé pour notifier CoursesDisplay
    const customEvent = new CustomEvent('headerPlanningTimeSlotChanged', {
      detail: { timeSlot },
    })
    window.dispatchEvent(customEvent)
  }

  const getSelectedDayStats = () => {
    if (!selectedTimeSlot) return { sessions: 0, students: 0 }

    const dayCourses = courses.filter((course) =>
      course.courses_sessions.some((session) =>
        session.courses_sessions_timeslot.some((timeslot) =>
          timeslot.day_of_week === selectedTimeSlot,
        ),
      ),
    )

    const totalSessions = dayCourses.reduce((total, course) =>
      total + course.courses_sessions.filter((session) =>
        session.courses_sessions_timeslot.some((timeslot) =>
          timeslot.day_of_week === selectedTimeSlot,
        ),
      ).length, 0,
    )

    return { sessions: totalSessions }
  }

  const { sessions } = getSelectedDayStats()

  // Filtrer les timeSlots pour n'afficher que ceux où il y a au moins un cours
  const filteredTimeSlots = timeSlots.filter((slot) =>
    courses.some((course) =>
      course.courses_sessions.some((session) =>
        session.courses_sessions_timeslot.some((timeslot) =>
          timeslot.day_of_week === slot,
        ),
      ),
    ),
  )

  return (
    <div className={'flex-[0.4] flex justify-end'}>
      {/* Créneaux horaires - Sélecteur moderne avec badge */}
      {filteredTimeSlots && filteredTimeSlots.length > 0 && (
        <div className="w-full max-w-md">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-full px-3 sm:px-4 py-2.5 rounded-xl
                bg-primary-foreground/10 border border-primary-foreground/20
                text-primary-foreground/90 hover:bg-primary-foreground/15
                hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <Calendar className="w-4 h-4 text-primary-foreground/70 flex-shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-sm font-medium truncate">
                      {formatDayOfWeek(selectedTimeSlot as TimeSlotEnum)}
                    </span>
                    <span className="text-xs bg-primary-foreground text-primary
                        px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {sessions} cours
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
                  {filteredTimeSlots.length}
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-full min-w-[280px] sm:min-w-[300px] p-2 bg-white
              border border-gray-200 shadow-lg">
              {filteredTimeSlots.map((timeSlot) => {
                const dayCourses = courses.filter((course) =>
                  course.courses_sessions.some((session) =>
                    session.courses_sessions_timeslot.some((timeslot) =>
                      timeslot.day_of_week === timeSlot,
                    ),
                  ),
                )
                const totalSessions = dayCourses.reduce((total, course) =>
                  total + course.courses_sessions.filter((session) =>
                    session.courses_sessions_timeslot.some((timeslot) =>
                      timeslot.day_of_week === timeSlot,
                    ),
                  ).length, 0,
                )

                return (
                  <DropdownMenuItem
                    key={timeSlot}
                    onClick={() => handleTimeSlotChange(timeSlot)}
                    className="w-full px-3 py-2.5 rounded-lg text-left text-sm
                      transition-all duration-200 flex items-center justify-between
                      group cursor-pointer text-foreground hover:bg-muted
                      hover:text-foreground"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-medium truncate">
                          {formatDayOfWeek(timeSlot)}
                        </span>
                        <span className="text-xs bg-foreground text-background
                          px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {totalSessions} cours
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

