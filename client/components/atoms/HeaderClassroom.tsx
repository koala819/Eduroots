'use client'
import { motion } from 'framer-motion'
import { CheckCircle2, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

interface HeaderProfileProps {
  courseSessionId?: string
}

const coursesView = [
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

export const HeaderClassroom = ({ courseSessionId }: HeaderProfileProps) => {
  const router = useRouter()
  const pathname = usePathname()

  // Détecter la vue active basée sur le pathname
  const activeView = pathname.includes('/behavior') ? 'behavior' : 'attendance'

  const handleViewChange = (viewId: string) => {
    if (courseSessionId) {
      const baseUrl = '/teacher/classroom/course'
      const url = `${baseUrl}/${courseSessionId}/${viewId}`
      router.push(url)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex-[0.4] flex justify-end"
    >
      {/* Navigation des vues - Style expansif utilisant tout l'espace disponible */}
      <div className="flex bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-1 border
        border-primary-foreground/20 w-full max-w-md h-14">
        {coursesView.map(({ id, label, Icon }) => {
          const isActive = activeView === id

          const activeClasses = 'bg-primary-foreground/20 backdrop-blur-md shadow-lg ' +
            'border border-primary-foreground/30 text-primary-foreground'
          const inactiveClasses = 'text-primary-foreground/60 ' +
            'hover:text-primary-foreground/80 hover:bg-primary-foreground/5'

          return (
            <motion.button
              key={id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleViewChange(id)}
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
                ${isActive ? activeClasses : inactiveClasses}
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
                  <span className="font-semibold whitespace-nowrap">
                    {label}
                  </span>
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
  )
}
