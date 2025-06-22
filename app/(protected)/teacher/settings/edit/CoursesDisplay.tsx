'use client'

import { useState } from 'react'

import CoursesFilter from '@/client/components/atoms/SettingsCourses'
import SettingsPlanning from '@/client/components/atoms/SettingsPlanning'
import { CourseWithRelations, TimeSlotEnum } from '@/types/courses'

interface CoursesDisplayProps {
  courses: CourseWithRelations[]
}

export const CoursesDisplay = ({ courses }: CoursesDisplayProps) => {
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotEnum | null>(null)

  const timeSlots = Object.values(TimeSlotEnum)

  // Définir la session sélectionnée au chargement initial
  useState(() => {
    if (timeSlots.length > 0 && !selectedTimeSlot) {
      setSelectedTimeSlot(timeSlots[0])
    }
  })

  const handlePrevDay = () => {
    setCurrentDayIndex((prev) => (prev === 0 ? timeSlots.length - 1 : prev - 1))
  }

  const handleNextDay = () => {
    setCurrentDayIndex((prev) => (prev === timeSlots.length - 1 ? 0 : prev + 1))
  }

  const handleTimeSlotChange = (timeSlot: TimeSlotEnum) => {
    setSelectedTimeSlot(timeSlot)
  }

  return (
    <div className="space-y-4">
      {/* Composant de filtrage et navigation */}
      <CoursesFilter
        courses={courses}
        selectedTimeSlot={selectedTimeSlot}
        onTimeSlotChange={handleTimeSlotChange}
        currentDayIndex={currentDayIndex}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
      />


      {/* Display mobile */}
      <div className="block sm:hidden">
        <SettingsPlanning
          timeSlot={timeSlots[currentDayIndex]}
          courses={courses}
        />
      </div>

      {/* Display desktop */}
      <div className="hidden sm:block">
        {selectedTimeSlot ? (
          <div className="space-y-4">
            <SettingsPlanning timeSlot={selectedTimeSlot} courses={courses} />
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot}>
                <SettingsPlanning timeSlot={timeSlot} courses={courses} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

  )
}
