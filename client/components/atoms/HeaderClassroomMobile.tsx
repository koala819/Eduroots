'use client'
import { Calendar, CheckCircle2,ChevronDown } from 'lucide-react'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { ClassroomTimeSlot } from '@/types/courses'
import { TimeSlotEnum } from '@/types/courses'

interface HeaderClassroomMobileProps {
  classroomTimeSlots: ClassroomTimeSlot[]
  onTimeSlotChange?: (sessionId: string) => void
}

export const HeaderClassroomMobile = ({
  classroomTimeSlots,
  onTimeSlotChange,
}: HeaderClassroomMobileProps) => {
  // Sélectionner le premier créneau par défaut
  const defaultTimeSlot = classroomTimeSlots.length > 0 ? classroomTimeSlots[0].id : ''
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(defaultTimeSlot)

  const handleTimeSlotChange = (sessionId: string) => {
    setSelectedTimeSlot(sessionId)

    // Trouver le timeSlot correspondant
    const timeSlot = classroomTimeSlots.find((ts) => ts.id === sessionId)
    if (timeSlot) {
      // Émettre un événement personnalisé pour notifier ClassroomDashboard
      const customEvent = new CustomEvent('headerTimeSlotChanged', {
        detail: {
          sessionId,
          timeSlot,
          dayOfWeek: timeSlot.dayOfWeek as TimeSlotEnum,
        },
      })
      window.dispatchEvent(customEvent)
    }

    // Appeler le callback parent si fourni
    if (onTimeSlotChange) {
      onTimeSlotChange(sessionId)
    }
  }

  // Fonction pour formater l'heure
  const formatTime = (time: string) => {
    // Les heures sont déjà formatées côté serveur en HH:mm
    // On remplace juste les ":" par "h" pour l'affichage français
    return time.replace(':', 'h')
  }

  // Fonction pour obtenir les horaires par créneau
  const getTimeSlotHours = (dayOfWeek: string) => {
    // Chercher dans les créneaux statiques
    const timeSlot = classroomTimeSlots.find((ts) => ts.dayOfWeek === dayOfWeek)
    if (timeSlot && timeSlot.startTime && timeSlot.endTime) {
      return { start: timeSlot.startTime, end: timeSlot.endTime }
    }

    // Fallback avec les valeurs par défaut
    const defaultTimeSlots = {
      'saturday_morning': { start: '09:00', end: '12:30' },
      'saturday_afternoon': { start: '14:00', end: '17:30' },
      'sunday_morning': { start: '09:00', end: '12:30' },
    }
    return defaultTimeSlots[dayOfWeek as keyof typeof defaultTimeSlots] || { start: '', end: '' }
  }

  return (
    <section className="mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="w-full px-3 py-2.5 rounded-xl bg-primary-foreground/10
            border border-primary-foreground/20 text-primary-foreground/90
            hover:bg-primary-foreground/15 hover:scale-[1.02] active:scale-[0.98]
            transition-all duration-200 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Calendar className="w-4 h-4 text-primary-foreground/70 flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">
                  {selectedTimeSlot
                    ? formatDayOfWeek(
                      classroomTimeSlots.find(
                        (ts) => ts.id === selectedTimeSlot)?.dayOfWeek as TimeSlotEnum,
                    )
                    : 'Sélectionner un créneau'
                  }
                </span>
                {selectedTimeSlot && (
                  <>
                    <span className="text-xs text-primary-foreground/60 truncate">
                      {classroomTimeSlots.find(
                        (ts) => ts.id === selectedTimeSlot)?.subject || ''}
                    </span>
                    <span className="text-xs bg-primary-foreground text-primary
                      px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {classroomTimeSlots.find(
                        (ts) => ts.id === selectedTimeSlot)?.level || ''}
                    </span>
                  </>
                )}
              </div>
              {selectedTimeSlot && (
                <span className="text-xs text-primary-foreground/70 truncate">
                  {(() => {
                    const timeSlot = classroomTimeSlots.find(
                      (ts) => ts.id === selectedTimeSlot)
                    if (timeSlot) {
                      const hours = getTimeSlotHours(timeSlot.dayOfWeek)
                      const startTime = formatTime(hours.start)
                      const endTime = formatTime(hours.end)
                      return `${startTime} - ${endTime}`
                    }
                    return ''
                  })()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
              {classroomTimeSlots.length}
            </span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-full min-w-[280px] p-2 bg-white
          border border-gray-200 shadow-lg">
          {classroomTimeSlots.map((timeSlot) => {
            const hours = getTimeSlotHours(timeSlot.dayOfWeek)
            const isActive = selectedTimeSlot === timeSlot.id

            return (
              <DropdownMenuItem
                key={timeSlot.id}
                onClick={() => handleTimeSlotChange(timeSlot.id)}
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
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium truncate">
                      {formatDayOfWeek(timeSlot.dayOfWeek as TimeSlotEnum)}
                    </span>
                    <span className="text-xs opacity-70 truncate">
                      {timeSlot.subject}
                    </span>
                    <span className="text-xs bg-foreground text-background
                      px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {timeSlot.level}
                    </span>
                  </div>
                  <span className="text-xs opacity-60 truncate">
                    {formatTime(hours.start)} - {formatTime(hours.end)}
                  </span>
                </div>
                {isActive && (
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground flex-shrink-0" />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  )
}
