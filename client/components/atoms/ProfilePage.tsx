'use client'

import { BarChart, Calendar, LogOut, PenSquare, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useStats } from '@/client/context/stats'
import { useToast } from '@/client/hooks/use-toast'
import { createClient } from '@/client/utils/supabase'

const Profile = () => {
  const router = useRouter()
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  const { toast } = useToast()
  const { refreshTeacherStudentsStats, refreshGlobalStats } = useStats()

  async function logoutHandler() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = process.env.NEXT_PUBLIC_CLIENT_URL || '/'
  }

  const actions = [
    {
      icon: <Users className="h-10 w-10" />,
      title: 'Détail des élèves',
      onClick: () => {
        handleNavClick('/teacher/profiles/classroom')
      },
    },
    {
      icon: <PenSquare className="h-10 w-10" />,
      title: 'Devoirs & Contrôles',
      onClick: () => {
        handleNavClick('/teacher/profiles/grades')
      },
    },
    {
      icon: <Calendar className="h-10 w-10" />,
      title: 'Emploi du temps',
      onClick: () => {
        handleNavClick('/teacher/profiles/edit')
      },
    },
    {
      icon: <BarChart className="h-10 w-10" />,
      title: 'Mettre à jour les statistiques',
      onClick: async () => {
        const now = Date.now()
        const timeSinceLastUpdate = now - lastUpdateTime
        const MIN_UPDATE_INTERVAL = 1000 * 60 * 30 // 30 minutes

        if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
          toast({
            variant: 'destructive',
            title: 'Mise à jour impossible',
            description: `Veuillez attendre ${Math.ceil(
              (MIN_UPDATE_INTERVAL - timeSinceLastUpdate) / 1000 / 60,
            )} minutes avant la prochaine mise à jour`,
            duration: 3000,
          })
          return
        }

        try {
          toast({
            title: 'Mise à jour en cours',
            description: 'Veuillez patienter...',
            duration: 3000,
          })

          await Promise.all([
            refreshTeacherStudentsStats(true),
            refreshGlobalStats(),
          ])

          setLastUpdateTime(now)

          toast({
            variant: 'success',
            title: 'Mise à jour terminée',
            description: 'Les statistiques ont été actualisées avec succès',
            duration: 3000,
          })
        } catch (error) {
          console.error('Erreur lors de la mise à jour:', error)
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la mise à jour des statistiques',
            duration: 3000,
          })
        }
      },
    },
  ]

  function handleNavClick(href: string) {
    router.push(href)
  }

  return (
    <div className="flex flex-col gap-2 h-[77vh] md:grid md:grid-cols-2 w-full
     md:h-[86vh] md:gap-4">
      {actions.map((item) => {
        return (
          <button
            key={item.title}
            onClick={item.onClick}
            className="flex flex-col items-center justify-center
            rounded-2xl shadow-lg w-full h-full text-xl
            font-semibold transition-all hover:cursor-pointer
           hover:bg-primary hover:text-primary-foreground"
          >
            {item.icon}
            <span className="mt-3 text-center px-2">{item.title}</span>
          </button>
        )
      })}
      <button
        key="Déconnexion"
        onClick={logoutHandler}
        className="flex flex-col items-center justify-center rounded-2xl
        shadow-lg w-full h-full text-xl font-semibold transition-all col-span-2 bg-error-light
        hover:cursor-pointer hover:bg-error hover:text-error-foreground"

      >
        <LogOut className="h-10 w-10" style={{ color: 'var(--color-error-foreground)' }} />
        <span className="mt-3 text-center px-2">Déconnexion</span>
      </button>
    </div>
  )
}

export default Profile
