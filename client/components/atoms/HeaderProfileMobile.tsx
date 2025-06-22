'use client'
import { motion } from 'framer-motion'
import { CheckCircle2, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProfileMobileProps {
  courseSessionId?: string
  activeView: 'attendance' | 'behavior'
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

export const HeaderProfileMobile = ({ courseSessionId, activeView }: HeaderProfileMobileProps) => {
  const router = useRouter()

  const handleViewChange = (viewId: string) => {
    if (courseSessionId) {
      const baseUrl = '/teacher/classroom/course'
      const url = `${baseUrl}/${courseSessionId}/${viewId}`
      router.push(url)
    }
  }

  return (
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
        {coursesView.map(({ id, label, Icon }) => {
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
  )
}
