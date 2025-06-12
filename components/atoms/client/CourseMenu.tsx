'use client'

import { CheckCircle2, Calendar, MenuIcon } from 'lucide-react'

import { CourseSession, CourseSessionTimeslot, TeacherCourseResponse } from '@/types/supabase/db'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { formatDayOfWeek } from '@/lib/utils'

type SessionWithTimeslot = CourseSession & {
  timeslot?: CourseSessionTimeslot
}


export const CourseMenu = ({
  courses,
  currentCourseId,
  onCourseSelect,
}: {
  courses: TeacherCourseResponse[] | null
  currentCourseId: string
  onCourseSelect: (id: string) => void
  }) => {
  if (!courses) return null
 console.log('courses complet:', courses)

  // On récupère toutes les sessions avec leurs timeslots
  const allSessions = courses.flatMap((course) => {
    console.log('course.courses:', course.courses)
    console.log('course.courses.courses_sessions:', course.courses.courses_sessions)

    return course.courses.courses_sessions.map(session => {
      console.log('session complète:', session)
      console.log('session.courses_sessions_timeslot:', session.courses_sessions_timeslot)

      // Vérification de sécurité pour les timeslots
      const timeslot = session.courses_sessions_timeslot?.[0]
      if (!timeslot) {
        console.warn('Pas de timeslot trouvé pour la session:', session.id)
      }

      return {
        ...session,
        timeslot
      }
    })
  })

  console.log('allSessions final:', allSessions)
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
            {/* Render other courses regularly */}
            {allSessions.map((session: SessionWithTimeslot) => {
              if (!session) return null
              console.log('session', session)
              const isSelected = session.id === currentCourseId
              const timeslot = session.timeslot

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
                    onClick={() => onCourseSelect(session.id)}
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
                     <div className="flex flex-col gap-1 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="truncate">
                        {timeslot ? formatDayOfWeek(timeslot.day_of_week) : 'Pas de jour défini'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <span className="truncate">
                        {timeslot ? `${timeslot.start_time} - ${timeslot.end_time}` : 'Pas d\'horaire défini'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <span className="truncate">
                        Niveau: {session.level}
                      </span>
                    </div>
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
