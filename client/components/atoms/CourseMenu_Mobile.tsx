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

export const CourseMenuMobile = ({
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-40 bg-[#375073] text-white border-b border-[#375073]/20"
    >
      {/* Header avec informations du cours */}
      <div className="px-4 py-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {/* Bouton retour amélioré */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            onClick={() => router.push('/teacher/classroom')}
            className="flex items-center justify-center w-10 h-10 rounded-full
            transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>

          {/* Informations du cours */}
          <div className="flex-1 min-w-0">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-bold text-white truncate"
            >
              {selectedSession.subject}
            </motion.h1>

            <div className="flex items-center gap-4 mt-1">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-1 text-sm text-white/80"
              >
                <Clock className="w-4 h-4" />
                {formatDayOfWeek(selectedSession.courses_sessions_timeslot[0].day_of_week)}
              </motion.div>


            </div>
          </div>
        </motion.div>
      </div>

      {/* Menu de navigation des vues */}
      <div className="px-4 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative"
        >
          {/* Container avec design cohérent à la sidebar */}
          <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-1.5
          border border-white/20">
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
              className="absolute inset-1.5 bg-white rounded-xl shadow-lg"
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
                    onClick={() => setActiveView(id)}
                    className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3
                    rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    {/* Contenu du bouton */}
                    <motion.div
                      animate={{
                        color: isActive ? '#375073' : '#ffffff',
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
          </div>


        </motion.div>
      </div>

      {/* Séparateur avec dégradé */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent
       via-white/20 to-transparent" />
    </motion.div>
  )
}
