'use client'

import {Calendar, MenuIcon} from 'lucide-react'
import {CheckCircle2} from 'lucide-react'

import {Course, CourseSession} from '@/types/course'

import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import {formatDayOfWeek} from '@/lib/utils'

export const CourseMenu = ({
  courses,
  currentCourseId,
  onCourseSelect,
}: {
  courses: Course[]
  currentCourseId: string
  onCourseSelect: (id: string) => void
}) => {
  // Récupérer toutes les sessions de tous les cours
  const allSessions = courses.flatMap((course) => course.sessions)

  // Find sessions that have sameStudents set to true
  const sameStudentsCourses = allSessions.filter((session) => session.sameStudents)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="z-50">
          <MenuIcon className="sm:mr-2 w-4 h-4" />{' '}
          <span className="hidden sm:inline">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="[&>button]:hidden">
        <SheetHeader>
          <SheetTitle>Mes Cours</SheetTitle>
          <SheetDescription>{allSessions.length} cours</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col h-full">
          {/* Course List */}
          <div className="flex-1 overflow-auto px-4 pt-4 space-y-3 custom-scrollbar">
            {/* Render only one combined entry if there are courses with sameStudents true */}
            {sameStudentsCourses.length >= 2 && (
              <SheetClose asChild key={'combined-same-students'}>
                <Card
                  className={`
                  cursor-pointer transition-all duration-200
                  ${
                    currentCourseId === sameStudentsCourses[0].id
                      ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                      : 'hover:bg-gray-50 hover:shadow-md'
                  }
                `}
                  onClick={() => onCourseSelect(sameStudentsCourses[0].id!)}
                >
                  <div className="p-4 relative">
                    {currentCourseId === sameStudentsCourses[0].id && (
                      <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                        {sameStudentsCourses[0].subject} - {sameStudentsCourses[1].subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="truncate">
                        {formatDayOfWeek(sameStudentsCourses[0].timeSlot.dayOfWeek)}{' '}
                        {sameStudentsCourses[0].timeSlot.startTime} -{' '}
                        {sameStudentsCourses[1].timeSlot.endTime}
                      </span>
                    </div>
                  </div>
                </Card>
              </SheetClose>
            )}

            {/* Render other courses regularly */}
            {allSessions.map((session: CourseSession) => {
              if (session.sameStudents) return null // Skip individual rendering of sameStudents courses

              const isSelected = session.id === currentCourseId
              return (
                <SheetClose asChild key={session.id}>
                  <Card
                    className={`
                    cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                        : 'hover:bg-gray-50 hover:shadow-md'
                    }
                  `}
                    onClick={() => onCourseSelect(session.id!)}
                  >
                    <div className="p-4 relative">
                      {isSelected && (
                        <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                          {session.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="truncate">
                          {formatDayOfWeek(session.timeSlot.dayOfWeek)} {session.timeSlot.startTime}{' '}
                          - {session.timeSlot.endTime}
                        </span>
                      </div>
                    </div>
                  </Card>
                </SheetClose>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
