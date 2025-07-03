import { motion } from 'framer-motion'
import { CalendarDays, Clock } from 'lucide-react'

import { StudentStats } from '@/types/stats'

import { formatAbsenceDate,formatTimeToNow } from './utils'

interface ActivityInfoProps {
  stats: StudentStats
}

export const ActivityInfo = ({ stats }: Readonly<ActivityInfoProps>) => {
  // Fonction pour convertir une date en objet Date
  const parseDate = (date: Date | string): Date => {
    if (date instanceof Date) return date
    return new Date(date)
  }

  // Récupérer la dernière absence avec gestion des dates
  const getLastAbsenceDate = () => {
    if (!stats.absences || stats.absences.length === 0) return null
    const lastAbsence = stats.absences[stats.absences.length - 1]
    return parseDate(lastAbsence.date)
  }

  return (
    <div className="px-4">
      {/* Dernière activité et absence */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between py-2 border-b
        border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-xs">
            <CalendarDays className="h-3 w-3 mr-1 text-primary" />
            <span>Dernière absence</span>
          </div>
          <motion.span
            className="font-medium text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {getLastAbsenceDate() ?
              formatAbsenceDate(getLastAbsenceDate()!) : 'Aucune'}
          </motion.span>
        </div>

        <div className="flex justify-between py-2 border-b
        border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-xs">
            <Clock className="h-3 w-3 mr-1 text-primary" />
            <span>Dernière activité</span>
          </div>
          <span className="font-medium text-xs">
            {stats.lastActivity ? formatTimeToNow(parseDate(stats.lastActivity)) : 'Jamais'}
          </span>
        </div>
      </div>
    </div>
  )
}
