'use client'
import { motion } from 'framer-motion'
import { CheckCircle2, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

interface HeaderClassroomProps {
  courseSessionId?: string
  className?: string
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

export const HeaderClassroom = ({
  courseSessionId,
  className = '',
}: HeaderClassroomProps) => {
  const router = useRouter()
  const pathname = usePathname()

  // Détecter la vue active basée sur le pathname
  const activeView = pathname.includes('/behavior') ? 'behavior' : 'attendance'

  // Extraire l'ID du cours du pathname si courseSessionId n'est pas fourni
  const getCourseId = () => {
    if (courseSessionId) return courseSessionId

    // Extraire l'ID du cours du pathname
    const pathSegments = pathname.split('/')
    const courseIndex = pathSegments.findIndex((segment) => segment === 'course')
    if (courseIndex !== -1 && pathSegments[courseIndex + 1]) {
      return pathSegments[courseIndex + 1]
    }

    return null
  }

  const handleViewChange = (viewId: string) => {
    // Ne pas naviguer si on clique sur l'onglet déjà actif
    if (viewId === activeView) {
      return
    }

    const courseId = getCourseId()

    if (courseId) {
      const baseUrl = '/teacher/classroom/course'
      const url = `${baseUrl}/${courseId}/${viewId}`
      router.push(url)
    } else {
      console.warn('HeaderClassroom - courseId not found in pathname or props')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`flex-[0.4] flex justify-end ${className}`}
    >
      {/* Navigation des vues - Design simple et clair */}
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleViewChange(id)}
              className={`
                relative flex-1 flex items-center justify-center gap-2 rounded-xl
                text-sm font-medium transition-all duration-200 h-full
                ${isActive ? activeClasses : inactiveClasses + ' cursor-pointer'}
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">
                {label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
