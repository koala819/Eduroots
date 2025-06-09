'use client'

import { BarChart, Calendar, LogOut, PenSquare, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ProfileSection } from '@/components/molecules/server/ProfileSection'
import { useStats } from '@/context/Stats/client'
import { createClient } from '@/utils/supabase/client'

// Déclaration du type OneSignal
declare global {
  interface Window {
    OneSignal: {
      isPushNotificationsSupported(): Promise<boolean>
      User: {
        PushSubscription: {
          optedIn: boolean
          optIn(): Promise<void>
          optOut(): Promise<void>
        }
      }
    }
  }
}

export type MenuItem = {
  icon: React.ReactNode
  title: string
  color?: string
  onClick: () => void
}

const ProfilePage = () => {
  const router = useRouter()
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { toast } = useToast()
  const { refreshTeacherStudentsStats, refreshGlobalStats } = useStats()

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user && !error) {
        setUser(user)
      } else {
        setUser(null)
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  async function logoutHandler() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = process.env.NEXT_PUBLIC_CLIENT_URL || '/'
  }

  const actions: MenuItem[] = [
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Détail des élèves',
      // color: 'text-green-600',
      onClick: () => {
        router.push('/teacher/profiles/classroom')
      },
    },
    {
      icon: <PenSquare className="h-5 w-5" />,
      title: 'Devoirs & Contrôles',
      // color: 'text-orange-600',
      onClick: () => {
        router.push('/teacher/profiles/grades')
      },
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: 'Emploi du temps',
      // color: 'text-purple-600',
      onClick: () => {
        router.push('/teacher/profiles/edit')
      },
    },
    {
      icon: <BarChart className="h-5 w-5" />,
      title: 'Mettre à jour les statistiques',
      onClick: async () => {
        const now = Date.now()
        const timeSinceLastUpdate = now - lastUpdateTime
        const MIN_UPDATE_INTERVAL = 1000 * 60 * 30 // 30 minutes

        if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
          toast({
            variant: 'destructive',
            title: 'Mise à jour impossible',
            description: `Veuillez attendre
            ${Math.ceil((MIN_UPDATE_INTERVAL - timeSinceLastUpdate) / 1000 / 60)}
            minutes avant la prochaine mise à jour`,
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
    // {
    //   icon: <ArrowUpRight className="h-5 w-5" />,
    //   title: 'Transférer ma session',
    //   color: 'text-gray-400', // Couleur grisée pour indiquer l'état désactivé
    //   onClick: () => {
    //     toast({
    //       variant: 'success',
    //       title: 'En dev',
    //       description: 'Bientôt fonctionnel :)',
    //       duration: 3000,
    //     })
    //     // console.log('Transfert session')
    //   },
    // },
  ]

  const settings: MenuItem[] = [
    {
      icon: <LogOut className="h-5 w-5" />,
      title: 'Déconnexion',
      color: 'text-red-600',
      onClick: () => logoutHandler(),
    },
  ]

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping"></div>
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
            style={{ animationDelay: '0.4s' }}
          ></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-gray-500">Non authentifié</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="hidden md:block mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 space-x-4">
          {user.user_metadata?.firstname + ' ' + user.user_metadata?.lastname}
        </h1>
        <p className="text-gray-500">Professeur de Al&apos;Ihsane</p>
      </div>

      <ProfileSection title="Actions" items={actions} />
      <ProfileSection title="Paramètres" items={settings} />
    </div>
  )
}

export default ProfilePage
