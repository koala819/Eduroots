'use client'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Clock, Star } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

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

export const CourseMenuMobile = ({
  courseSessionId,
  selectedSession,
}: {
  courseSessionId: string
  selectedSession: CourseSessionWithRelations
}) => {
  const router = useRouter()
  const pathname = usePathname()

  // Détecter la vue active basée sur le pathname
  const activeView = pathname.includes('/behavior') ? 'behavior' : 'attendance'

  const handleViewChange = (viewId: string) => {
    router.push(`/teacher/classroom/course/${courseSessionId}/${viewId}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full bg-gradient-to-br from-primary via-primary to-primary-dark
       text-primary-foreground"
    >
      <div className="px-4 py-4">
        {/* Header */}
        <section className="flex items-center justify-between mb-4">
          {/* Bouton retour */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/teacher/classroom')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10
            hover:bg-primary-foreground/15 transition-all duration-200 border
            border-primary-foreground/20"
          >
            <ArrowLeft className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground/90">Mes Cours</span>
          </motion.button>

          {/* Informations du cours */}
          <div className="flex items-center justify-between gap-3 min-w-0 flex-1 mx-4">

            <h1 className="text-lg font-bold text-primary-foreground truncate">
              {selectedSession.subject}
            </h1>
            <div className="flex items-center gap-2 text-primary-foreground/70 text-xs mt-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {formatDayOfWeek(selectedSession.courses_sessions_timeslot[0].day_of_week)}
              </span>

            </div>
          </div>
        </section>

        {/* Menu de navigation des vues */}
        <section className="relative bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-1.5
          border border-primary-foreground/20">
          {/* Background BLANC pour l'onglet actif */}

          <motion.div
            key={activeView}
            layoutId="activeViewBackground"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-1.5 bg-primary-foreground rounded-xl shadow-lg"
            style={{
              left: activeView === 'attendance' ? '6px' : '50%',
              width: 'calc(50% - 6px)',
            }}
          />


          {/* Boutons des vues */}
          <div className="relative flex">
            {views.map(({ id, label, Icon }) => {
              const isActive = activeView === id

              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleViewChange(id)}
                  className="relative flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2
                   sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all
                   duration-200"
                >
                  {/* Contenu du bouton */}
                  <motion.div
                    animate={{
                      color: isActive ? 'var(--color-primary)'
                        : 'var(--color-primary-foreground)',
                      scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </motion.div>


                </motion.button>
              )
            })}
          </div>
        </section>




      </div>
    </motion.div>
  )
}
