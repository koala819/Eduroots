'use client'

import { Calendar, CheckCircle2, ChevronDown } from 'lucide-react'

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
  selectedTimeSlot: TimeSlotEnum | null
  onTimeSlotChange: (timeSlot: TimeSlotEnum) => void
  currentDayIndex: number
  onPrevDay: () => void
  onNextDay: () => void
}

export const HeaderPlanning = ({
  courses,
  selectedTimeSlot,
  onTimeSlotChange,
  currentDayIndex,
  onPrevDay,
  onNextDay,
}: HeaderPlanningProps) => {
  const timeSlots = Object.values(TimeSlotEnum)

  return (
    <div className={'flex-[0.4] flex justify-end'}>
      {/* Créneaux horaires - Sélecteur moderne avec badge */}
      {timeSlots && timeSlots.length > 0 && (
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
                      {selectedTimeSlot
                        ? formatDayOfWeek(selectedTimeSlot)
                        : 'Sélectionner un jour'
                      }
                    </span>
                    {selectedTimeSlot && (
                      <span className="text-xs bg-primary-foreground text-primary
                        px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Planning
                      </span>
                    )}
                  </div>
                  {selectedTimeSlot && (
                    <span className="text-xs text-primary-foreground/70 truncate">
                      {courses.reduce((total, course) => total + course.courses_sessions.length, 0)} cours
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
                  {timeSlots.length}
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-full min-w-[280px] sm:min-w-[300px] p-2 bg-white
              border border-gray-200 shadow-lg">
              {timeSlots.map((timeSlot) => {
                const isActive = selectedTimeSlot === timeSlot
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
                const totalStudents = dayCourses.reduce((total, course) =>
                  total + course.courses_sessions.reduce((sessionTotal, session) =>
                    sessionTotal + (session.courses_sessions_students?.length || 0), 0,
                  ), 0,
                )

                return (
                  <DropdownMenuItem
                    key={timeSlot}
                    onClick={() => onTimeSlotChange(timeSlot)}
                    className={`
                      w-full px-3 py-2.5 rounded-lg text-left text-sm
                      transition-all duration-200
                      flex items-center justify-between group cursor-pointer
                      ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-muted hover:text-foreground'
                  }
                    `}
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
                      <span className="text-xs opacity-60 truncate">
                        {totalStudents} élèves
                      </span>
                    </div>
                    {isActive && (
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground
                        flex-shrink-0" />
                    )}
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

