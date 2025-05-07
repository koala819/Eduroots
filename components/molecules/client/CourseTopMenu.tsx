'use client'

import {CheckCircle2, Star} from 'lucide-react'
import {useState} from 'react'

import {useRouter} from 'next/navigation'

import {Course, CourseSession, PopulatedCourse} from '@/types/course'

import {CourseMenu} from '@/components/atoms/client/CourseMenu'
import {CourseSelected} from '@/components/atoms/client/CourseTopMenuDetailedView'

import {motion} from 'framer-motion'

const views = [
  {
    id: 'attendance',
    label: 'Présence',
    Icon: CheckCircle2,
  },
  {
    id: 'behavior',
    label: 'Comportement',
    Icon: Star,
  },
]

// Fonction pour convertir PopulatedCourse en Course
const adaptPopulatedCourse = (populatedCourse: PopulatedCourse): Course => {
  return {
    ...populatedCourse,
    teacher: [populatedCourse.teacher._id],
  }
}

export const TopMenu = ({
  teacherCourses,
  currentCourseId,
  activeView,
  setActiveView,
  selectedSession,
}: {
  teacherCourses: PopulatedCourse[]
  currentCourseId: string
  activeView: string
  setActiveView: (view: string) => void
  selectedSession: CourseSession
}) => {
  const router = useRouter()

  const [expanded, setExpanded] = useState<boolean>(false)

  // Fonction pour gérer la navigation
  function handleCourseSelect(courseId: string) {
    router.push(`/teacher/classroom/course/${courseId}`)
  }

  // Convertir tous les cours pour le menu
  const adaptedCourses = teacherCourses.map(adaptPopulatedCourse)

  return (
    <div className="bg-white shadow-sm border-b">
      {/* Vue desktop */}
      <div className="hidden sm:flex items-center justify-between px-4 py-2 space-x-4">
        <CourseMenu
          courses={adaptedCourses}
          currentCourseId={currentCourseId}
          onCourseSelect={handleCourseSelect}
        />

        <CourseSelected
          course={selectedSession}
          expanded={expanded}
          onToggleExpand={() => setExpanded(!expanded)}
        />

        <div className="flex bg-gray-100 rounded-full p-1 space-x-1">
          {views.map(({id, label, Icon}) => (
            <motion.button
              key={id}
              whileTap={{scale: 0.95}}
              onClick={() => setActiveView(id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all
                ${
                  activeView === id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Vue mobile */}
      <div className="sm:hidden space-y-2">
        <div className="flex justify-center items-center p-2 space-x-4">
          <CourseSelected
            course={selectedSession}
            expanded={expanded}
            onToggleExpand={() => setExpanded(!expanded)}
          />
          {!expanded && (
            <CourseMenu
              courses={adaptedCourses}
              currentCourseId={currentCourseId}
              onCourseSelect={handleCourseSelect}
            />
          )}
        </div>

        <div className="flex justify-center p-2">
          <div className="flex bg-gray-100 rounded-full p-1 space-x-1">
            {views.map(({id, label, Icon}) => (
              <motion.button
                key={id}
                whileTap={{scale: 0.95}}
                onClick={() => setActiveView(id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all
                  ${
                    activeView === id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
