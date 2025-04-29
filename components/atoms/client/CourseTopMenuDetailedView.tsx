'use client'

import {BarChart2, Book, Calendar, ChevronDown, ChevronUp, Clock, GraduationCap} from 'lucide-react'

import {CourseSession} from '@/types/course'

import {Card, CardContent, CardHeader} from '@/components/ui/card'

import {formatDayOfWeek} from '@/lib/utils'
import {motion} from 'framer-motion'

export const CourseSelected = ({
  course,
  expanded,
  onToggleExpand,
}: {
  course: CourseSession
  expanded: boolean
  onToggleExpand: () => void
}) => {
  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.3}}
      className="space-y-4 p-4 cursor-pointer"
      onClick={onToggleExpand}
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-900">{course.subject}</div>
          <div className="text-sm text-gray-600">{formatDayOfWeek(course.timeSlot.dayOfWeek)}</div>
        </div>
        <div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-700" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-4 text-gray-700" />
          )}
        </div>
      </div>

      {expanded && (
        <Card className="w-full bg-white/70 backdrop-blur-sm border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900">Niveau {course.level}</h2>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Statistics Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                <p className="text-sm font-semibold text-gray-900">Statistiques</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: 'Présence',
                    value: `${course.stats.averageAttendance?.toFixed(1)}%`,
                    color: 'blue',
                  },
                  {
                    label: 'Notes',
                    value: `${course.stats.averageGrade?.toFixed(1)}/20`,
                    color: 'green',
                  },
                  {
                    label: 'Comportement',
                    value: `${course.stats.averageBehavior?.toFixed(1)}/5`,
                    color: 'purple',
                  },
                ].map(({label, value, color}) => (
                  <motion.div
                    whileHover={{scale: 1.05}}
                    key={label}
                    className={`
                      bg-${color}-50 p-3 rounded-xl
                      border border-${color}-100
                      text-center
                    `}
                  >
                    <div className={`text-xs text-${color}-600 mb-1`}>{label}</div>
                    <div className={`text-xl font-bold text-${color}-700`}>{value}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Subjects Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Book className="w-5 h-5 text-blue-500" />
                <p className="text-sm font-semibold text-gray-900">Matières</p>
              </div>
              <div className="text-sm text-gray-900 leading-relaxed">{course.subject}</div>
            </div>

            {/* Schedule Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <p className="text-sm font-semibold text-gray-900">Horaires</p>
              </div>
              <motion.div
                whileHover={{scale: 1.02}}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"
              >
                <Calendar className="w-6 h-6 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">
                    {formatDayOfWeek(course.timeSlot.dayOfWeek)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {course.timeSlot.startTime} - {course.timeSlot.endTime}
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
