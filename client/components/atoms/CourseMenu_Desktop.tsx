'use client'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar,CheckCircle2, ChevronDown, Clock, Star } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { formatDayOfWeek } from '@/server/utils/helpers'
import { CourseSessionWithRelations } from '@/types/courses'
import { TimeSlotEnum } from '@/types/courses'

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

interface TimeSlot {
  id: string
  subject: string
  dayOfWeek: string
  level: string
  courseId: string
}

export const CourseMenuDesktop = ({
  courseSessionId,
  selectedSession,
  returnBackName = 'Accueil',
  returnBackUrl = '/teacher/classroom',
  showTabs = true,
  isClassroomRoute = false,
}: {
  courseSessionId?: string
  selectedSession?: CourseSessionWithRelations
  returnBackName?: string
  returnBackUrl?: string
  showTabs?: boolean
  isClassroomRoute?: boolean
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  // Détecter la vue active basée sur le pathname
  const activeView = pathname.includes('/behavior') ? 'behavior' : 'attendance'

  // Récupérer les créneaux depuis le DOM de ClassroomDashboard
  useEffect(() => {
    if (isClassroomRoute) {
      const findTimeSlots = () => {
        // Chercher les boutons de créneaux dans le DOM
        const timeSlotButtons = document.querySelectorAll('button[class*="rounded-full"]')
        const foundTimeSlots: TimeSlot[] = []
        let foundSelectedSession = ''

        timeSlotButtons.forEach((button) => {
          const buttonText = button.textContent?.trim()
          if (buttonText && buttonText.includes('Samedi') || buttonText?.includes('Dimanche')) {
            // Extraire l'ID du bouton (data-key ou autre attribut)
            const buttonElement = button as HTMLElement
            const isSelected = buttonElement.classList.contains('bg-primary') ||
                             buttonElement.classList.contains('bg-blue-600')

            // Créer un TimeSlot basé sur le texte
            const timeSlot: TimeSlot = {
              id: `session-${foundTimeSlots.length + 1}`, // ID temporaire
              subject: '',
              dayOfWeek: buttonText.includes('Samedi') ?
                (buttonText.includes('Matin') ? 'SATURDAY_MORNING' : 'SATURDAY_AFTERNOON') :
                'SUNDAY_MORNING',
              level: '',
              courseId: '',
            }

            foundTimeSlots.push(timeSlot)

            if (isSelected) {
              foundSelectedSession = timeSlot.id
            }
          }
        })

        if (foundTimeSlots.length > 0) {
          setTimeSlots(foundTimeSlots)
          setSelectedTimeSlot(foundSelectedSession)
        }
      }

      // Attendre que le DOM soit chargé
      const timer = setTimeout(findTimeSlots, 100)

      // Observer les changements dans le DOM
      const observer = new MutationObserver(() => {
        findTimeSlots()
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })

      return () => {
        clearTimeout(timer)
        observer.disconnect()
      }
    }
  }, [isClassroomRoute])

  const handleViewChange = (viewId: string) => {
    if (courseSessionId) {
      const baseUrl = '/teacher/classroom/course'
      const url = `${baseUrl}/${courseSessionId}/${viewId}`
      router.push(url)
    }
  }

  const handleTimeSlotChange = (sessionId: string) => {
    setSelectedTimeSlot(sessionId)

    // Trouver et cliquer sur le bouton correspondant dans ClassroomDashboard
    const timeSlotButtons = document.querySelectorAll('button[class*="rounded-full"]')
    timeSlotButtons.forEach((button) => {
      const buttonElement = button as HTMLElement
      const buttonText = buttonElement.textContent?.trim()

      if (buttonText) {
        const timeSlot = timeSlots.find((ts) => ts.id === sessionId)
        if (timeSlot) {
          const expectedText = formatDayOfWeek(timeSlot.dayOfWeek as TimeSlotEnum)
          if (buttonText === expectedText) {
            buttonElement.click()
          }
        }
      }
    })
  }

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
              onClick={() => router.push(returnBackUrl)}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10
              hover:bg-primary-foreground/15 transition-all duration-200 border
              border-primary-foreground/20 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-primary-foreground
              group-hover:text-primary-foreground transition-colors" />
              <span className="text-sm font-medium text-primary-foreground/90
              group-hover:text-primary-foreground">
                {returnBackName}
              </span>
            </motion.button>

            {/* Informations du cours avec design moderne */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-px h-8 bg-primary-foreground/20 flex-shrink-0" />
              <div className="min-w-0">
                {selectedSession ? (
                  <>
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
                  </>
                ) : isClassroomRoute ? (
                  <>
                    <motion.h1
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl font-bold text-primary-foreground truncate"
                    >
                      Mes Cours
                    </motion.h1>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-2 text-primary-foreground/70 text-sm mt-1"
                    >
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {timeSlots.length > 0 ? `${timeSlots.length} créneaux disponibles` : 'Chargement...'}
                      </span>
                    </motion.div>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>

          {/* Partie droite - Navigation des vues ou Créneaux horaires (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex-[0.4] flex justify-end"
          >
            {showTabs ? (
              /* Navigation des vues - Style expansif utilisant tout l'espace disponible */
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
            ) : isClassroomRoute && timeSlots.length > 0 ? (
              /* Créneaux horaires - Sélecteur moderne avec badge */
              <div className="w-full max-w-md">
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-2.5 rounded-xl bg-primary-foreground/10
                    border border-primary-foreground/20 text-primary-foreground/90
                    hover:bg-primary-foreground/15 transition-all duration-200
                    flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary-foreground/70" />
                      <span className="text-sm font-medium">
                        {selectedTimeSlot
                          ? formatDayOfWeek(timeSlots.find((ts) => ts.id === selectedTimeSlot)?.dayOfWeek as TimeSlotEnum)
                          : 'Sélectionner un créneau'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
                        {timeSlots.length}
                      </span>
                      <motion.div
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </div>
                  </motion.button>

                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-primary-foreground/95
                      backdrop-blur-md rounded-xl border border-primary-foreground/20
                      shadow-xl z-50 max-h-64 overflow-y-auto"
                    >
                      <div className="p-2">
                        {timeSlots.map((timeSlot, index) => (
                          <motion.button
                            key={timeSlot.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                              handleTimeSlotChange(timeSlot.id)
                              setIsDropdownOpen(false)
                            }}
                            className={`
                              w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200
                              flex items-center justify-between group
                              ${selectedTimeSlot === timeSlot.id
                            ? 'bg-primary-foreground/20 text-primary-foreground shadow-sm'
                            : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                          }
                            `}
                          >
                            <span className="font-medium">
                              {formatDayOfWeek(timeSlot.dayOfWeek as TimeSlotEnum)}
                            </span>
                            {selectedTimeSlot === timeSlot.id && (
                              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
