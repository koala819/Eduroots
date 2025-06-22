'use client'

import { BookOpen, ChevronLeft, ChevronRight,Users } from 'lucide-react'

import { formatDayOfWeek } from '@/server/utils/helpers'
import { CourseWithRelations, SubjectNameEnum, TimeSlotEnum } from '@/types/courses'

interface CoursesFilterProps {
  courses: CourseWithRelations[]
  selectedTimeSlot: TimeSlotEnum | null
  onTimeSlotChange: (timeSlot: TimeSlotEnum) => void
  currentDayIndex: number
  onPrevDay: () => void
  onNextDay: () => void
}

const CoursesFilter = ({
  courses,
  selectedTimeSlot,
  onTimeSlotChange,
  currentDayIndex,
  onPrevDay,
  onNextDay,
}: CoursesFilterProps) => {
  const timeSlots = Object.values(TimeSlotEnum)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Mes Cours</h2>
      </div>

      {/* Légende des couleurs */}
      <div className="card p-3 mb-2">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-accent" />
            <span className="text-xs sm:text-sm text-foreground">{SubjectNameEnum.Arabe}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-xs sm:text-sm text-foreground">
              {SubjectNameEnum.EducationCulturelle}
            </span>
          </div>
        </div>
      </div>

      {/* Filtres par jour - en desktop */}
      <div className="hidden sm:flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {timeSlots.map((timeSlot) => (
          <button
            key={timeSlot}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedTimeSlot === timeSlot
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            onClick={() => onTimeSlotChange(timeSlot)}
          >
            {formatDayOfWeek(timeSlot)}
          </button>
        ))}
      </div>

      {/* Navigation mobile */}
      <div className="flex sm:hidden items-center justify-between mb-2">
        <button
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          onClick={onPrevDay}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-base font-semibold">{formatDayOfWeek(timeSlots[currentDayIndex])}</h3>
        <button
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          onClick={onNextDay}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Résumé */}
      <div className="card mt-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              {courses.reduce((total, course) => total + course.courses_sessions.length, 0)} cours
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              {courses.reduce((total, course) =>
                total + course.courses_sessions.reduce((sessionTotal, session) =>
                  sessionTotal + (session.courses_sessions_students?.length || 0), 0,
                ), 0,
              )} élèves
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoursesFilter
