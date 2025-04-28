import { Clock } from 'lucide-react'

import { TimeSlotEnum } from '@/types/course'

interface TimeSlotConfig {
  id: TimeSlotEnum
  label: string
  sessions: Array<{ startTime: string; endTime: string }>
}

interface TimeSlotCardProps {
  config: TimeSlotConfig
  isSelected: boolean
  onSelect: (id: TimeSlotEnum) => void
}

export const TimeSlotCard = ({
  config,
  isSelected,
  onSelect,
}: TimeSlotCardProps) => {
  const firstSession = config.sessions[0]
  const lastSession = config.sessions[config.sessions.length - 1]
  const timeRange = `${firstSession.startTime} - ${lastSession.endTime}`

  return (
    <div
      onClick={() => onSelect(config.id)}
      className={`
        bg-white rounded-lg md:rounded-xl p-3 md:p-4 cursor-pointer transition-all duration-200
        hover:shadow-md border
        ${isSelected ? 'ring-2 ring-primary shadow-sm' : ''}
      `}
    >
      <h3 className="font-medium text-gray-900 mb-2 md:mb-3 text-sm md:text-base">
        {config.label}
      </h3>
      <div className="flex items-center text-xs md:text-sm text-gray-600">
        <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 text-primary" />
        {timeRange}
      </div>
    </div>
  )
}
