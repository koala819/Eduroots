'use client'

import { BarChart, Calendar, LogOut, PenSquare, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useStats } from '@/context/Stats/client'
import { logoutHandler } from '@/lib/utils'

const ProfilePage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  const { toast } = useToast()
  const { refreshTeacherStudentsStats, refreshGlobalStats } = useStats()

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
            description: `Veuillez attendre ${Math.ceil((MIN_UPDATE_INTERVAL - timeSinceLastUpdate) / 1000 / 60)} minutes avant la prochaine mise à jour`,
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
            description:
              'Une erreur est survenue lors de la mise à jour des statistiques',
            duration: 3000,
          })
        }
      },
    },
  ]

  function handleNavClick (href: string) {
    router.push(href)
  }

  return (
    <>
      <section className="p-2 text-center w-full">
        <h1 className="text-2xl font-bold text-gray-900 space-x-4">
          {session?.user.firstname + ' ' + session?.user.lastname}
        </h1>
        <p className="text-gray-500">Professeur de Al&apos;Ihsane</p>
      </section>
      <section className="w-full flex-1 flex flex-col justify-center md:p-4 p-2">
        <div className="flex flex-col gap-2 h-[77vh] md:grid md:grid-cols-2 w-full md:h-[86vh] md:gap-4 ">
          {actions.map((item) => {
            return (
              <button
                key={item.title}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center rounded-2xl shadow-lg w-full h-full text-xl font-semibold transition-all bg-white text-[#375073] hover:bg-blue-50"
              >
                {item.icon}
                <span className="mt-3 text-center px-2">{item.title}</span>
              </button>
            )
          })}
          <button
            key="Déconnexion"
            onClick={logoutHandler}
            className="flex flex-col items-center justify-center rounded-2xl shadow-lg w-full h-full text-xl font-semibold transition-all bg-red-100 text-red-600 hover:bg-red-200 col-span-2"
            style={{ minHeight: '120px' }}
          >
            <LogOut className="h-10 w-10 text-red-600" />
            <span className="mt-3 text-center px-2">Déconnexion</span>
          </button>
        </div>
      </section>
    </>
  )
}

export default ProfilePage
