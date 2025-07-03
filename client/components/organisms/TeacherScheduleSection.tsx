'use client'

import { BookOpen } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CourseScheduleView } from '@/client/components/atoms/CourseScheduleView'
import { CourseWithRelations, TimeSlotEnum } from '@/types/courses'

interface TeacherScheduleSectionProps {
  courses: CourseWithRelations[]
}

export const TeacherScheduleSection = ({ courses }: TeacherScheduleSectionProps) => {
  const timeSlots = Object.values(TimeSlotEnum)
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotEnum | null>(
    timeSlots.length > 0 ? timeSlots[0] : null,
  )

  // Écouter les changements du header
  useEffect(() => {
    const handleHeaderTimeSlotChange = (event: any) => {
      const { timeSlot } = event.detail
      setSelectedTimeSlot(timeSlot)
      const newIndex = timeSlots.indexOf(timeSlot)
      if (newIndex !== -1) {
        setCurrentDayIndex(newIndex)
      }
    }

    window.addEventListener('headerPlanningTimeSlotChanged',
      handleHeaderTimeSlotChange)

    return () => {
      window.removeEventListener('headerPlanningTimeSlotChanged',
        handleHeaderTimeSlotChange)
    }
  }, [timeSlots])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Mes Cours</h2>
      </div>
      {/* Display mobile */}
      <div className="block sm:hidden">
        <CourseScheduleView
          timeSlot={timeSlots[currentDayIndex]}
          courses={courses}
        />
      </div>

      {/* Display desktop */}
      <div className="hidden sm:block">
        <CourseScheduleView
          timeSlot={selectedTimeSlot || timeSlots[0]}
          courses={courses}
        />
      </div>
    </div>

  )
}
