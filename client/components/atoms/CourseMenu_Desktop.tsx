'use client'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Clock,Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { formatDayOfWeek } from '@/server/utils/helpers'
import { CourseSessionWithRelations } from '@/types/courses'

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

export const CourseMenuDesktop = ({
  activeView,
  setActiveView,
  selectedSession,
}: {
  activeView: string
  setActiveView: (view: string) => void
  selectedSession: CourseSessionWithRelations
}) => {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full bg-gradient-to-br from-primary via-primary to-primary-dark
       text-primary-foreground"
    >
      <div className="px-8 py-6">
        {/* Header avec breadcrumb et informations - Split 60/40 */}
        <div className="flex items-center gap-8 mb-6">
          {/* Partie gauche - Navigation et infos (60%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-6 flex-[0.6]"
          >
            {/* Bouton retour avec style moderne */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/teacher/classroom')}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10
              hover:bg-primary-foreground/15 transition-all duration-200 border
              border-primary-foreground/20 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-primary-foreground
              group-hover:text-primary-foreground transition-colors" />
              <span className="text-sm font-medium text-primary-foreground/90
              group-hover:text-primary-foreground">
                Retour
              </span>
            </motion.button>

            {/* Informations du cours avec design moderne */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-px h-8 bg-primary-foreground/20 flex-shrink-0" />
              <div className="min-w-0">
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-primary-foreground truncate"
                >
                  {selectedSession.subject}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 text-primary-foreground/70 text-sm mt-1"
                >
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {formatDayOfWeek(selectedSession.courses_sessions_timeslot[0].day_of_week)}
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Partie droite - Navigation des vues (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex-[0.4] flex justify-end"
          >
            {/* Navigation des vues - Style expansif utilisant tout l'espace disponible */}
            <div className="flex bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-1 border
            border-primary-foreground/20 w-full max-w-md h-14">
              {views.map(({ id, label, Icon }) => {
                const isActive = activeView === id

                return (
                  <motion.button
                    key={id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveView(id)}
                    animate={{
                      width: isActive ? '90%' : '10%',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                      duration: 0.6,
                    }}
                    className={`
                      relative flex items-center justify-center rounded-xl text-sm font-medium
                      transition-all duration-300 h-full
                      ${isActive
                    ? 'bg-primary-foreground/20 backdrop-blur-md shadow-lg border ' +
                          'border-primary-foreground /30 text - primary - foreground'
                    : 'text-primary-foreground/60 hover:text-primary-foreground/80 ' +
                          'hover:bg-primary-foreground/5'
                  }
                    `}
                  >
                    {/* Contenu de l'onglet actif (90%) */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="flex items-center gap-3"
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-semibold whitespace-nowrap">{label}</span>
                      </motion.div>
                    )}

                    {/* Contenu de l'onglet inactif (10%) - juste l'icône */}
                    {!isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                        className="flex items-center justify-center"
                      >
                        <Icon className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
